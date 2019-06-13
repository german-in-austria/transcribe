import _ from 'lodash'
import PromiseWorker from 'promise-worker-transferable'

import {
  LocalTranscriptEvent,
  eventStore,
  ServerTranscript,
  ServerTranscriptSaveResponse,
  ServerEventSaveResponse,
  LocalTranscript,
  timeToSeconds,
  ServerEvent,
  ServerToken,
  ServerTokenSaveResponse,
  ServerTranscriptSaveRequest,
  LocalTranscriptTier,
  LocalTranscriptSpeakerEventTiers
} from '@store/transcript'
import { clone } from '@util/index'
import serverTranscriptDiff from './server-transcript-diff.worker'

const diffWorker = new PromiseWorker(new serverTranscriptDiff())
const textEncoder = new TextEncoder()

export let serverTranscript = null as ServerTranscript|null

export function getMetadataFromServerTranscript(res: ServerTranscript) {
  const v = {
    speakers: res.aInformanten!,
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    defaultTier: res.aDefaultTier || 'text',
    audioUrl: `${ eventStore.backEndUrl }/private-media`
      + res.aEinzelErhebung!.dp.split('\\').join('/')
      + res.aEinzelErhebung!.af
      + '.ogg',
    tiers: _(res.aTiers).map((t, tid) => {
      return {
        type: 'freeText',
        name: t,
        show: false,
        id: tid
      }
    })
    .concat([
      {
        type: 'basic',
        name: 'default',
        show: true,
        id: 'text'
      },
      {
        type: 'token',
        name: 'ortho',
        show: false,
        id: 'ortho'
      },
      {
        type: 'token',
        name: 'phon',
        show: false,
        id: 'phon'
      }
    ]).value() as LocalTranscriptTier[]
  }
  return v
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
  // console.log({tokens: _(s.aTokens).toArray().sortBy(t => t.tr).value()})
}

export async function localTranscriptToServerTranscript(
  oldServerTranscript: ServerTranscript,
  localEvents: LocalTranscript): Promise<ServerTranscript> {
  const oldT = textEncoder.encode(JSON.stringify(oldServerTranscript)).buffer
  const newT = textEncoder.encode(JSON.stringify(localEvents)).buffer
  const [ tokensAndEventsDiff, newServerTranscript ] = await diffWorker
    .postMessage({oldT, newT}, [oldT, newT]) as [ServerTranscriptSaveRequest, ServerTranscript]
  return newServerTranscript
}

export async function localTranscriptToServerSaveRequest(
  oldServerTranscript: ServerTranscript,
  localEvents: LocalTranscript): Promise<ServerTranscriptSaveRequest> {
  const oldT = textEncoder.encode(JSON.stringify(oldServerTranscript)).buffer
  const newT = textEncoder.encode(JSON.stringify(localEvents)).buffer
  const [
    tokensAndEventsDiff,
  ] = await diffWorker.postMessage({oldT, newT}, [oldT, newT]) as [ServerTranscriptSaveRequest, ServerTranscript]
  return {
    ...oldServerTranscript,
    ...tokensAndEventsDiff
  }
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

export function serverEventSaveResponseToServerEvent(e: ServerEventSaveResponse): ServerEvent {
  return {
    e: e.e,
    l: e.l,
    pk: e.newPk || e.pk,
    s: e.s,
    tid: e.tid,
    event_tiers: e.event_tiers
  }
}

export function serverTokenSaveResponseToServerToken(
  t: ServerTokenSaveResponse,
  es: _.Dictionary<ServerEventSaveResponse>
): ServerToken {
  return {
    e: t.e > 0
      ? t.e             // it’s an existing event
      : es[t.e].newPk!, // it’s a new event, use the server-supplied primary key.
    fo: t.fo,
    i: t.i,
    o: t.o,
    s: t.s,
    sr: t.sr,
    t: t.t,
    to: t.to,
    tr: t.tr,
    tt: t.tt
  }
}

function mergeTokenChanges(
  ts: _.Dictionary<ServerToken>,
  tcs: _.Dictionary<ServerTokenSaveResponse>,
  es: ServerEventSaveResponse[]
): _.Dictionary<ServerToken> {
    const tokens = clone(ts)
    const keyedEvents = _(es).keyBy('pk').value()
    _(tcs).each((t, id) => {
      if (t.newStatus === 'deleted') {
        delete tokens[id]
      } else if (t.newStatus === 'inserted') {
        tokens[t.newPk!] = serverTokenSaveResponseToServerToken(t, keyedEvents)
      } else if (t.newStatus === 'updated') {
        tokens[id] = serverTokenSaveResponseToServerToken(t, keyedEvents)
      }
    })
    return tokens
}

function mergeEventChanges(
  es: ServerEvent[],
  ecs: ServerEventSaveResponse[],
  ts: _.Dictionary<ServerToken>
): ServerEvent[] {
  const keyedEvents = _(clone(es)).keyBy('pk').value()
  // insert, update and delete events
  _(ecs).each((e) => {
    if (e.newStatus === 'deleted') {
      delete keyedEvents[e.pk]
    } else if (e.newStatus === 'inserted') {
      keyedEvents[e.newPk!] = serverEventSaveResponseToServerEvent(e)
      console.log('inserted event', keyedEvents[e.newPk!], e.newPk)
    } else if (e.newStatus === 'updated') {
      keyedEvents[e.pk] = serverEventSaveResponseToServerEvent(e)
    }
  })
  // rebuild the token_id (tid) reference in their events
  _(ts)
    .mapValues((t, k) => ({...t, token_id: Number(k)}))
    .groupBy(t => `${t.e}-${t.i}`)
    .each((speakerTokens, speakerEventId) => {
      const [ eventId, speakerId ] = speakerEventId.split('-')
      if (keyedEvents[eventId] !== undefined) {
        keyedEvents[eventId].tid[speakerId] = _(speakerTokens).orderBy(t => t.tr).map(t => t.token_id).value()
      } else {
        console.log('undefined event id', speakerEventId)
      }
    })
  return _.toArray(keyedEvents)
}

export function updateServerTranscriptWithChanges(s: ServerTranscriptSaveResponse): ServerTranscript {
  if (serverTranscript !== null) {
    const newTokens = mergeTokenChanges(serverTranscript.aTokens, s.aTokens, s.aEvents)
    const newEvents = mergeEventChanges(serverTranscript.aEvents, s.aEvents, newTokens)
    const x = {
      ...s,
      aTokens: newTokens,
      aEvents: newEvents
    }
    serverTranscript = x
    return x
  } else {
    throw new Error('can’t handle null')
  }
}

export function serverTranscriptToLocal(s: ServerTranscript): LocalTranscript {
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
        speakerEvents: _.reduce(eG, (m, se) => {
          _.each(se.tid, (tokenIds, speakerKey) => {
            m[speakerKey] = {
              speakerEventTiers: _(eG).reduce((ts, e) => {
                const x = _(e.event_tiers[speakerKey]).mapValues((t, tierId) => {
                  ts[tierId] = {
                    type: 'freeText',
                    text: t.t
                  }
                  return ts[tierId]
                }).value()
                return ts
              }, {} as LocalTranscriptSpeakerEventTiers),
              speakerEventId: se.pk,
              tokens: _.map(tokenIds, (tokenId) => {
                if (s.aTokens[tokenId] === undefined) {
                  console.log('not found', tokenId, se)
                }
                return {
                  id: tokenId,
                  fragmentOf: s.aTokens[tokenId].fo || null,
                  sentenceId: s.aTokens[tokenId].s || null,
                  order: s.aTokens[tokenId].tr,
                  tiers: {
                    text: {
                      // replace fragment in current token,
                      // if next token has a "fragment_of" marker
                      text: (() => {
                        const nextFragmentOfId = findNextFragmentOfId(tokenId, speakerKey, lG, iG, s.aTokens)
                        if (nextFragmentOfId !== undefined) {
                          return replaceLastOccurrence(s.aTokens[tokenId].t, s.aTokens[nextFragmentOfId].t, '=')
                        } else {
                          return s.aTokens[tokenId].t
                        }
                      })(),
                      type: s.aTokens[tokenId].tt
                    },
                    ortho: {
                      text: s.aTokens[tokenId].o || '',
                      type: null
                    },
                    // TODO: add "phon" on server
                    phon: {
                      text: (s.aTokens[tokenId] as any).p || '',
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
    })
    .orderBy(e => e.startTime)
    .value()
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
    const res = await (await fetch(`${ eventStore.backEndUrl }/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    // when it’s the first page
    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
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
