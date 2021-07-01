import {
  LocalTranscriptEvent,
  LocalTranscriptToken,
  TokenTierType
} from '../store/transcript'

import {
  ServerEvent,
  ServerToken,
  ServerEventTiers,
  ServerSpeakerEventTiers,
  ServerTranscript,
  ServerTranscriptSaveRequest,
  SaveRequest
} from '../service/backend-server'

const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')

import reduce from 'lodash/reduce'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import mergeWith from 'lodash/mergeWith'

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

function getTokenTextWithFragments(
  t: LocalTranscriptToken,
  speakerId: string,
  es: LocalTranscriptEvent[],
  defaultTier: TokenTierType
): string {
  // find the event that should come immediately after
  const event = es.find((e) => {
    return e.speakerEvents[speakerId] !== undefined &&
    e.speakerEvents[speakerId].tokens[0] !== undefined &&
    e.speakerEvents[speakerId].tokens[0].fragmentOf === t.id &&
    e.speakerEvents[speakerId].tokens[0].id !== t.id
  })
  if (event !== undefined) {
    const nextToken = event.speakerEvents[speakerId].tokens[0]
    const newText = replaceLastOccurrence(t.tiers[defaultTier].text, '=', nextToken.tiers[defaultTier].text)
    if (tokenHasFragment(newText)) {
      console.log('newText', newText, nextToken)
      // tslint:disable-next-line:max-line-length
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
    l.p  !== r.p ||
    l.fo !== r.fo
  )
}

function hasEventChanged(l: ServerEvent, r: ServerEvent): boolean {
  if (JSON.stringify(l.event_tiers) !== JSON.stringify(r.event_tiers)) {
    console.log(JSON.stringify(l.event_tiers), JSON.stringify(r.event_tiers))
  }
  return (
    l.e !== r.e ||
    l.s !== r.s ||
    // hasEventTierChanged(l.event_tiers, r.event_tiers)
    JSON.stringify(l.event_tiers) !== JSON.stringify(r.event_tiers)
  )
}

function markEventTiersInsertStatus(e: ServerEvent): ServerEvent {
  e.event_tiers = mapValues(e.event_tiers, (speakerEventTiers) => mapValues(speakerEventTiers, (t) => {
    return {...t, status: 'upsert'}
  }))
  return e
}

function markEventTierUpdateStatus(newEvent: ServerEvent, oldEvent: ServerEvent): ServerEvent {
  // tslint:disable-next-line:max-line-length
  const oldEs = mapValues(oldEvent.event_tiers, (ets, speaker) => mapValues(ets, (et) => ({...et, status: 'delete' }) ))
  const newEs = mapValues(newEvent.event_tiers, (ets, speaker) => mapValues(ets, (et) => ({...et, status: 'upsert' }) ))
  const m = mergeWith(oldEs, newEs, (oldE, newE) => {
    // if there’s an old event, use the new event ("upsert" status)
    if (oldE !== undefined && oldE.ti !== undefined) {
      return newE
    }
  })
  return { ...newEvent, event_tiers: m }
}

// tslint:disable-next-line:max-line-length
registerPromiseWorker((message: {oldT: ArrayBuffer, newT: ArrayBuffer}, withTransferList: (...args: any[]) => any): [ServerTranscriptSaveRequest, ServerTranscript] => {
  const { oldT, newT } = message
  const oldTranscript = JSON.parse(textDecoder.decode(oldT)) as ServerTranscript
  const localTranscript = JSON.parse(textDecoder.decode(newT)) as LocalTranscriptEvent[]
  const defaultTier = oldTranscript.aTranskript!.default_tier || 'text'

  const newServerEvents: ServerEvent[] = []
  const newServerTokens = reduce(localTranscript, (m, event) => {
    // events
    newServerEvents.push({
      pk: event.eventId,
      s: padEnd(timeFromSeconds(event.startTime), 14, '0'),
      e: padEnd(timeFromSeconds(event.endTime), 14, '0'),
      l: 0,
      tid: mapValues(event.speakerEvents, (se) => se.tokens.map(t => t.id)),
      event_tiers: reduce(event.speakerEvents, (serverSpeakerEventTiers, se, sId) => {
        const tiers = reduce(se.speakerEventTiers, (serverEventTiers, et, tierId) => {
          serverEventTiers[et.id] = {
            ti: Number(tierId),
            t: et.text,
          }
          return serverEventTiers
        }, {} as ServerEventTiers)
        if (Object.keys(tiers).length !== 0) {
          serverSpeakerEventTiers[sId] = tiers
        }
        return serverSpeakerEventTiers
      }, {} as ServerSpeakerEventTiers)
    })
    mapValues(event.speakerEvents, (speakerEvent, speakerId) => {
      // tokens
      return speakerEvent.tokens.map((t, i, tokens) => {
        const token = {
          e : speakerEvent.speakerEventId,
          i : Number(speakerId),
          // NOTE: this produces undefined for "" (empty strings)
          o : t.tiers.ortho.text.trim() || undefined,
          s : oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].s : -1,
          sr: oldTranscript.aTokens[t.id] ? oldTranscript.aTokens[t.id].sr : -1,
          t : t.tiers.text.text,
          p : t.tiers.phon.text || undefined,
          // Text in ortho is basically useless, so we populate it with "text".
          to: t.tiers.ortho.text,
          tr: t.order,
          // TODO: this could be null
          tt: t.tiers[defaultTier].type as number,
          fo: t.fragmentOf || undefined
        }
        // it is the last token and has a fragment marker
        if (i + 1 === tokens.length) {
          if (defaultTier === 'text' && tokenHasFragment(token.t)) {
            token.t = getTokenTextWithFragments(t, speakerId, localTranscript, defaultTier)
          } else if (defaultTier === 'ortho' && token.o !== undefined && tokenHasFragment(token.o)) {
            token.o = getTokenTextWithFragments(t, speakerId, localTranscript, defaultTier)
          } else {
            // "phon" fragments are not supported.
          }
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
        ...markEventTiersInsertStatus(e),
        status: 'insert'
      })
    } else if (
      oldIndexedEvents[e.pk] !== undefined &&
      hasEventChanged(e, oldIndexedEvents[e.pk])
    ) {
      m.push({
        ...markEventTierUpdateStatus(e, oldIndexedEvents[e.pk]),
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
      // ,
      // aTiers: {
      //   ...tierDeletions,
      //   ...tierUpdatesAndInserts
      // }
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
