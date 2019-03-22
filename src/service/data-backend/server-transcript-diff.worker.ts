import {
  ServerToken,
  ServerTranscript,
  ServerEvent,
  LocalTranscript,
  LocalTranscriptEvent,
  LocalTranscriptToken,
} from '@store/transcript'

const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')

// this is annoying. lodash loses typings when imported in this way,
// but it’s also the only way to get webpack 2 to tree-shake it.
const reduce = require('lodash/reduce')
const keyBy = require('lodash/keyBy')
const mapValues = require('lodash/mapValues')

function padEnd(string: string, targetLength: number, padString: string) {
  // tslint:disable-next-line:no-bitwise
  targetLength = targetLength >> 0
  padString = String((typeof padString !== 'undefined' ? padString : ' '))
  if (string.length > targetLength) {
      return String(string)
  } else {
      targetLength = targetLength - string.length;
      if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length)
      }
      return String(string) + padString.slice(0, targetLength)
  }
}

function timeFromSeconds(seconds: number) {
  return new Date(1000 * seconds).toISOString().substr(12, 11)
}

interface ServerTokenWithStatus extends ServerToken {
  status: 'delete'|'insert'|'update'
}

interface ServerEventWithStatus extends ServerEvent {
  status: 'delete'|'insert'|'update'
}

function tokenHasFragment(text: string): boolean {
  return text.trim().endsWith('=')
}

function reverseString(str: string) {
  return str.split('').reverse().join('')
}

function replaceLastOccurrence(token: string, toReplace: string, replaceWith: string): string {
  return reverseString(
    reverseString(token).replace(
      reverseString(toReplace),
      reverseString(replaceWith)
    )
  )
}

function getTokenTextWithFragments(t: LocalTranscriptToken, speakerId: string, es: LocalTranscript): string {
  const event = es.find((e) => {
    return e.speakerEvents[speakerId] !== undefined &&
    e.speakerEvents[speakerId].tokens[0] !== undefined &&
    e.speakerEvents[speakerId].tokens[0].fragmentOf === t.id
  })
  if (event !== undefined) {
    const nextToken = event.speakerEvents[speakerId].tokens[0]
    const newText = replaceLastOccurrence(t.tiers.default.text, '=', nextToken.tiers.default.text)
    if (tokenHasFragment(newText)) {
      return t.tiers.default.text.replace('=', '') + getTokenTextWithFragments(nextToken, speakerId, es)
    } else {
      return newText
    }
  } else {
    return t.tiers.default.text
  }
}

function hasTokenChanged(l: ServerToken, r: ServerToken): boolean {
  return (
    l.tr !== r.tr ||
    l.tt !== r.tt ||
    l.t  !== r.t ||
    l.i  !== r.i ||
    l.e  !== r.e ||
    l.o  !== r.o ||
    l.fo !== r.fo
  )
}

function hasEventChanged(l: ServerEvent, r: ServerEvent): boolean {
  return (
    l.e !== r.e ||
    l.s !== r.s
  )
}

registerPromiseWorker((message: {oldT: ArrayBuffer, newT: ArrayBuffer}, withTransferList: (...args: any[]) => any) => {
  const { oldT, newT } = message
  const oldTranscript = JSON.parse(textDecoder.decode(oldT)) as ServerTranscript
  const localTranscript = JSON.parse(textDecoder.decode(newT)) as LocalTranscript

  const newServerEvents: ServerEvent[] = []
  const newServerTokens = reduce(localTranscript, (
    m: _.Dictionary<ServerToken>,
    event: LocalTranscriptEvent,
    eventIndex: number
  ) => {
    mapValues(event.speakerEvents, (speakerEvent: any, speakerId: string) => {
      newServerEvents.push({
        pk: speakerEvent.speakerEventId,
        s: padEnd(timeFromSeconds(event.startTime), 14, '0'),
        e: padEnd(timeFromSeconds(event.endTime), 14, '0'),
        l: 0,
        tid: {
          [speakerId]: speakerEvent.tokens.map((t: LocalTranscriptToken) => t.id)
        }
      })
      return speakerEvent.tokens.map((t: LocalTranscriptToken, i: number, tokens: LocalTranscriptToken[]) => {
        const token = {
          e : speakerEvent.speakerEventId,
          i : Number(speakerId),
          // this produces undefined for "" (empty strings)
          o : t.tiers.ortho.text.trim() || undefined,
          // sentence id? do i have to produce new sentences?
          s : oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].s : -1,
          // sequence in sentence (how do i find that out?)
          sr: oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].sr : -1,
          t : t.tiers.default.text,
          // Text in ortho is basically useless.
          to: t.tiers.ortho.text,
          tr: t.order,
          // TODO: this could be null
          tt: t.tiers.default.type as number,
          fo: t.fragmentOf || undefined
        }
        // it is the last token and has a fragment marker
        if (i + 1 === tokens.length && tokenHasFragment(token.t)) {
          token.t = getTokenTextWithFragments(t, speakerId, localTranscript)
        }
        m[t.id] = token
      })
    })
    return m
  }, {} as _.Dictionary<ServerToken>) as _.Dictionary<ServerToken>

  const oldIndexedEvents = keyBy(oldTranscript.aEvents, 'pk')
  const newIndexedEvents = keyBy(newServerEvents, 'pk')

  const tokenUpdatesAndInserts = reduce(newServerTokens, (
    m: _.Dictionary<ServerTokenWithStatus>,
    t: ServerToken,
    id: string
  ) => {
    if (Number(id) < 0) {
      m[id] = {
        ...t,
        status: 'insert'
      }
    } else if (
      oldTranscript.aTokens[id] !== undefined &&
      hasTokenChanged(t, oldTranscript.aTokens[id])
    ) {
      m[id] = {
        ...t,
        // oldToken: oldTranscript.aTokens[id],
        status: 'update'
      }
    }
    return m
  }, {} as _.Dictionary<ServerTokenWithStatus>) as _.Dictionary<ServerTokenWithStatus>

  const tokenDeletions = reduce(oldTranscript.aTokens, (
    m: _.Dictionary<ServerTokenWithStatus>,
    t: ServerToken,
    id: string
  ) => {
    if (newServerTokens[id] === undefined) {
      m[id] = {
        ...t,
        status: 'delete'
      }
    }
    return m
  }, {} as _.Dictionary<ServerTokenWithStatus>) as _.Dictionary<ServerTokenWithStatus>

  const eventUpdatesAndInserts = reduce(newIndexedEvents, (
    m: ServerEventWithStatus[],
    e: ServerEvent
  ) => {
    if (e.pk < 0) {
      m.push({
        ...e,
        status: 'insert'
      })
    } else if (
      oldIndexedEvents[e.pk] !== undefined &&
      hasEventChanged(e, oldIndexedEvents[e.pk])
    ) {
      m.push({
        ...e,
        status: 'update'
      })
    }
    return m
  }, [] as ServerEventWithStatus[]) as ServerEventWithStatus[]

  const eventDeletions = reduce(oldIndexedEvents, (
    m: ServerEventWithStatus[],
    e: ServerEvent
  ) => {
    if (newIndexedEvents[e.pk] === undefined) {
      m.push({
        ...e,
        status: 'delete'
      })
    }
    return m
  }, [] as ServerEventWithStatus[]) as ServerEventWithStatus[]

  return {
    ...oldTranscript,
    aTokens: {
      ...tokenDeletions,
      ...tokenUpdatesAndInserts
    },
    aEvents: [
      ...eventDeletions,
      ...eventUpdatesAndInserts
    ]
  }
})

export default null as any