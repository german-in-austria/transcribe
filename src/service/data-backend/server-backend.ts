import {
  LocalTranscriptEvent,
  eventStore,
  ServerTranscript,
  LocalTranscript,
  timeToSeconds,
  timeFromSeconds,
  HistoryEventAction,
  ServerEvent,
  ServerToken
} from '@store/transcript'

import { padEnd } from '@util/index'

import * as _ from 'lodash'
const textEncoder = new TextEncoder()
import * as PromiseWorker from 'promise-worker-transferable'
import serverTranscriptDiff from './server-transcript-diff.worker'
const diffWorker = new PromiseWorker(new serverTranscriptDiff(''))
export let serverTranscript = null as ServerTranscript|null

function getMetadataFromServerTranscript(res: ServerTranscript) {
  return {
    speakers: res.aInformanten!,
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    audioUrl: 'https://dissdb.dioe.at/private-media'
      + res.aEinzelErhebung!.dp.split('\\').join('/')
      + res.aEinzelErhebung!.af
      + '.ogg',
    tiers: [
      {
        name: 'default',
        show: true
      },
      {
        name: 'ortho',
        show: false
      }
    ]
  }
}

export function mergeServerTranscript(s: ServerTranscript) {
  const oldSt = (serverTranscript === null ? {aTokens: undefined, aEvents: []} : serverTranscript)
  serverTranscript = {
    ...oldSt,
    ...s,
    aTokens: {
      ...oldSt.aTokens,
      ...s.aTokens
    },
    aEvents: [
      ...oldSt.aEvents,
      ...s.aEvents
    ]
  }
  console.log({tokens: _(s.aTokens).toArray().sortBy(t => t.tr).value()})
}

export async function historyToServerTranscript(
  hs: HistoryEventAction[],
  oldServerTranscript: ServerTranscript,
  localEvents: LocalTranscript): Promise<ServerTranscript> {
  console.log({ hs })
  const oldServerTokens = oldServerTranscript.aTokens
  const aEvents = _(hs.slice().reverse())
    .uniqBy(h => h.events[0].eventId)
    .map((e) => {
      return {
        pk: e.events[0].eventId,
        e: timeFromSeconds(e.events[0].endTime),
        s: timeFromSeconds(e.events[0].startTime),
        l: 0 as 0,
        tid: _(e.events[0].speakerEvents).mapValues((v, k) => {
          return v.tokens.map((t) => t.id)
        }).value()
      }
    })
    .value()
  const newServerEvents: ServerEvent[] = []
  const newServerTokens = _(localEvents).reduce((m, e) => {
    _(e.speakerEvents).mapValues((speakerEvent, speakerId) => {
      newServerEvents.push({
        pk: speakerEvent.speakerEventId,
        s: padEnd(timeFromSeconds(e.startTime), 14, '0'),
        e: padEnd(timeFromSeconds(e.endTime), 14, '0'),
        l: 0,
        tid: {
          [speakerId]: speakerEvent.tokens.map(t => t.id)
        }
      })
      return speakerEvent.tokens.map((t, i) => {
        m[t.id] = {
          e : speakerEvent.speakerEventId,
          i : Number(speakerId),
          // this produces undefined for "" (empty strings)
          o : t.tiers.ortho.text.trim() || undefined,
          // sentence id? do i have to produce new sentences?
          s : oldServerTokens[t.id] ? oldServerTokens[t.id].s : -1,
          // sequence in sentence (how do i find that out?)
          sr: oldServerTokens[t.id] ? oldServerTokens[t.id].sr : -1,
          t : t.tiers.default.text,
          // Text in ortho is basically useless.
          to: t.tiers.ortho.text,
          tr: t.order,
          // TODO: this could be null
          tt: t.tiers.default.type as number,
          // fo: t.fragmentOf || undefined
        }
      })
    })
    .value()
    return m
  }, {} as _.Dictionary<ServerToken>)
  const oldT = textEncoder.encode(JSON.stringify(oldServerTranscript)).buffer
  const newT = textEncoder.encode(JSON.stringify({ aTokens: newServerTokens, aEvents: newServerEvents })).buffer
  const y = await diffWorker.postMessage({oldT, newT}, [oldT, newT])
  console.log(y)
  return oldServerTranscript
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

function findNextFragmentOfId(
  tokenId: number,
  tokenIndex: number,
  speakerKey: string,
  groupedEvents: ServerEvent[][],
  groupedEventsIndex: number,
  tokens: _.Dictionary<ServerToken>
): number|undefined {
  const event = groupedEvents[groupedEventsIndex].find(e => e.tid[speakerKey] !== undefined)
  if (
    // speaker event exists
    event !== undefined &&
    // the speaker event has tokens
    event.tid[speakerKey].length &&
    // there is an event group after this one
    groupedEvents[groupedEventsIndex + 1] !== undefined
  ) {
    const nextEvent = groupedEvents[groupedEventsIndex + 1].find(e => e.tid[speakerKey] !== undefined)
    if (
      // the next event group has an event for this speaker
      nextEvent !== undefined &&
      // there is a token for the first token id
      tokens[nextEvent.tid[speakerKey][0]] &&
      // it refers to the current token
      tokens[nextEvent.tid[speakerKey][0]].fo === tokenId
    ) {
      // return the next event’s id
      return nextEvent.tid[speakerKey][0]
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

function serverTranscriptToLocal(s: ServerTranscript): LocalTranscript {
  return _(s.aEvents)
    // group into events by startTime and endTime
    .groupBy((e) => e.s + '-' + e.e)
    // so we can access it as a list
    .toArray()
    // generate unified local events
    .map((eG, iG, lG) => {
      return {
        eventId: eG[0].pk,
        startTime: timeToSeconds(eG[0].s),
        endTime: timeToSeconds(eG[0].e),
        speakerEvents: _.reduce(eG, (m, se, i, ses) => {
          _.map(se.tid, (tokenIds, speakerKey) => {
            m[speakerKey] = {
              speakerEventId: se.pk,
              tokens: _.map(tokenIds, (tokenId, tokenIndex) => {
                // replace fragment in previous token
                const nextFragmentOfId = findNextFragmentOfId(tokenId, tokenIndex, speakerKey, lG, iG, s.aTokens)
                if (nextFragmentOfId !== undefined) {
                  s.aTokens[tokenId].t = replaceLastOccurrence(s.aTokens[tokenId].t, s.aTokens[nextFragmentOfId].t, '=')
                }
                return {
                  id: tokenId,
                  fragmentOf: s.aTokens[tokenId].fo || null,
                  sentenceId: s.aTokens[tokenId].s || null,
                  order: s.aTokens[tokenId].tr,
                  tiers : {
                    default: {
                      text: s.aTokens[tokenId].t,
                      type: s.aTokens[tokenId].tt
                    },
                    ortho: {
                      text: s.aTokens[tokenId].o || '',
                      type: null
                    }
                  }
                }
              })
            }
          })
          return m
        }, {} as LocalTranscriptEvent['speakerEvents'])
      }
    }).value()
}

export async function getTranscript(
  id: number,
  onProgress: (v: number, es: LocalTranscriptEvent[], res: ServerTranscript) => any,
  chunk = 0,
  buffer: LocalTranscript = [],
  totalSteps?: number,
): Promise<LocalTranscript> {
  try {

    // download transcript page
    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    // when it’s the first page
    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
      eventStore.status = 'loading'
    }

    // convert and concat
    eventStore.events = buffer.concat(serverTranscriptToLocal(res))

    // progress callback with data
    if (onProgress !== undefined) {
      onProgress(res.aNr / (totalSteps || res.aTmNr || 10), eventStore.events, res)
    }

    // get next (recursion) or finish
    if (res.nNr > res.aNr)  {
      return getTranscript(
        id,
        onProgress,
        chunk + 1,
        eventStore.events,
        totalSteps || res.aTmNr
      )
    } else {
      eventStore.status = 'finished'
      return buffer
    }
  } catch (e) {
    console.error(e)
    return buffer
  }
}
