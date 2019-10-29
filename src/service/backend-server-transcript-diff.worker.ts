import {
  LocalTranscript,
  LocalTranscriptToken,
  TokenTierType
} from '../store/transcript'

import {
  ServerEvent,
  ServerToken,
  ServerTranscript,
  ServerTranscriptSaveRequest,
  SaveRequest
} from '../service/backend-server'

const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')

import reduce from 'lodash/reduce'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'

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

function getTokenTextWithFragments(t: LocalTranscriptToken, speakerId: string, es: LocalTranscript, defaultTier: TokenTierType): string {
  const event = es.find((e) => {
    return e.speakerEvents[speakerId] !== undefined &&
    e.speakerEvents[speakerId].tokens[0] !== undefined &&
    e.speakerEvents[speakerId].tokens[0].fragmentOf === t.id
  })
  if (event !== undefined) {
    const nextToken = event.speakerEvents[speakerId].tokens[0]
    const newText = replaceLastOccurrence(t.tiers[defaultTier].text, '=', nextToken.tiers[defaultTier].text)
    if (tokenHasFragment(newText)) {
      return t.tiers[defaultTier].text.replace('=', '') + getTokenTextWithFragments(nextToken, speakerId, es, defaultTier)
    } else {
      return newText
    }
  } else {
    return t.tiers[defaultTier].text
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

// tslint:disable-next-line:max-line-length
registerPromiseWorker((message: {oldT: ArrayBuffer, newT: ArrayBuffer}, withTransferList: (...args: any[]) => any): [ServerTranscriptSaveRequest, ServerTranscript] => {
  const { oldT, newT } = message
  const oldTranscript = JSON.parse(textDecoder.decode(oldT)) as ServerTranscript
  const localTranscript = JSON.parse(textDecoder.decode(newT)) as LocalTranscript
  const defaultTier = oldTranscript.aTranskript!.default_tier || 'text'

  const newServerEvents: ServerEvent[] = []
  const newServerTokens = reduce(localTranscript, (m, event) => {
    mapValues(event.speakerEvents, (speakerEvent, speakerId) => {
      newServerEvents.push({
        pk: speakerEvent.speakerEventId,
        s: padEnd(timeFromSeconds(event.startTime), 14, '0'),
        e: padEnd(timeFromSeconds(event.endTime), 14, '0'),
        l: 0,
        tid: {
          [speakerId]: speakerEvent.tokens.map((t) => t.id)
        },
        event_tiers: mapValues(event.speakerEvents, (e) => {
          return reduce(e.speakerEventTiers, (memo, et, tierId) => {
            if (et.type === 'freeText') {
              memo[tierId] = {
                t: et.text,
                ti: tierId
              }
            } else {
              // it’s an annotation thing.
            }
            return memo
          }, {} as _.Dictionary<{t: string, ti: string}>)
        })
      })
      return speakerEvent.tokens.map((t, i, tokens) => {
        const token = {
          e : speakerEvent.speakerEventId,
          i : Number(speakerId),
          // NOTE: this produces undefined for "" (empty strings)
          o : t.tiers.ortho.text.trim() || undefined,
          s : oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].s : -1,
          sr: oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].sr : -1,
          t : t.tiers.text.text,
          p : t.tiers.phon.text,
          // Text in ortho is basically useless, so we populate it with "text".
          to: t.tiers.ortho.text,
          tr: t.order,
          // TODO: this could be null
          tt: t.tiers[defaultTier].type as number,
          fo: t.fragmentOf || undefined
        }
        // it is the last token and has a fragment marker
        if (i + 1 === tokens.length && tokenHasFragment(token.t)) {
          token.t = getTokenTextWithFragments(t, speakerId, localTranscript, defaultTier)
        }
        m[t.id] = token
      })
    })
    return m
  }, {} as _.Dictionary<ServerToken>)

  const oldIndexedEvents = keyBy(oldTranscript.aEvents, 'pk')
  const newIndexedEvents = keyBy(newServerEvents, 'pk')

  const tokenUpdatesAndInserts = reduce(newServerTokens, (m, t, id) => {
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
  }, {} as _.Dictionary<SaveRequest<ServerToken>>)

  const tokenDeletions = reduce(oldTranscript.aTokens, (m, t, id) => {
    if (newServerTokens[id] === undefined) {
      m[id] = {
        ...t,
        status: 'delete'
      }
    }
    return m
  }, {} as _.Dictionary<SaveRequest<ServerToken>>)

  const eventUpdatesAndInserts = reduce(newIndexedEvents, (m, e) => {
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
  }, [] as Array<SaveRequest<ServerEvent>>)

  const eventDeletions = reduce(oldIndexedEvents, (m, e) => {
    if (newIndexedEvents[e.pk] === undefined) {
      m.push({
        ...e,
        status: 'delete'
      })
    }
    return m
  }, [] as Array<SaveRequest<ServerEvent>>)

  return [
    // DIFF
    {
      ...oldTranscript,
      aTokens: {
        ...tokenDeletions,
        ...tokenUpdatesAndInserts
      },
      aEvents: [
        ...eventDeletions,
        ...eventUpdatesAndInserts
      ]
    },
    // NEW, FULL SERVER TRANSCRIPT
    {
      ...oldTranscript,
      aTokens: newServerTokens,
      aEvents: newServerEvents
    }
  ]
})

export default class ServerTranscriptSaveRequestMaker {
  postMessage() {
    return {} as Promise<[ServerTranscriptSaveRequest, ServerTranscript]>
  }
}
