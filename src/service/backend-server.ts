import _ from 'lodash'
import PromiseWorker from 'promise-worker-transferable'

import {
  LocalTranscriptEvent,
  eventStore,
  LocalTranscript,
  timeToSeconds,
  LocalTranscriptTier,
  LocalTranscriptSpeakerEventTiers,
  TokenTierType
} from '../store/transcript'
import { clone, getTextWidth } from '../util/index'
import ServerTranscriptDiff from './backend-server-transcript-diff.worker'
import settings from '../store/settings'

type ServerTranscriptId = number

export interface ServerTranscriptListItem {
  pk: number
  ut: string
  n: string
}

export type SaveRequest<T> = T & {
  status: 'update'|'delete'|'insert'
}

export type SaveResponse<T> = SaveRequest<T> & {
  newStatus: 'updated'|'deleted'|'inserted'|'error'
  error?: string
  newPk?: number
}

export interface ServerEventSaveResponse extends SaveResponse<ServerEvent> {
  event_tiers: {
    [speakerKey: string]: {
      [eventTierId: string]: SaveResponse<ServerEventTierContent>
    }
  }
}

export interface ServerTranscriptSaveResponse extends ServerTranscript {
  aTokens: {
    [token_id: string]: SaveResponse<ServerToken>
  }
  aEvents: ServerEventSaveResponse[]
  aTiers: {
    [tier_id: string]: SaveResponse<ServerTier>
  }
}

export interface ServerTranscriptSaveRequest extends ServerTranscript {
  aTokens: {
    [token_id: string]: SaveRequest<ServerToken>
  }
  aEvents: Array<SaveRequest<ServerEvent>>
}

export interface ServerInformant {
  weiblich: boolean
  Kuerzel: string
  Geburtsdatum: string|null
  Wohnbezirk: number|null
  Vorname: string|null
  Kuerzel_anonym: string|null
  Name: string|null
  pk: number
}

export interface ServerSurvey {
  pk: number
  FX_Informanten: ServerInformant[]
  ID_Erh: number
  Ort: string
  Audiofile: string
  Dateipfad: string
  Datum: string
}

export interface ServerTranscriptTokenTypes {
  // token type id
  [id: string]: {
    n: string // token type name
  }
}

export interface ServerTranscriptInformants {
  [speaker_id: number]: ServerTranscriptInformant
}

export interface ServerTranscriptInformant {
  ka: string // abbrev anonymized
  k: string // abbrev
}

export interface ServerAnswer {
  // there are other properties here
  // that we don’t care about now
  it: number // token id
}

export interface ServerAnswerSet {
  // there are other properties here
  // that we don’t care about now
  its: number // token set id
}

export interface TokenRange {
  ivt: number // token id (id von token)
  ibt: number // token id (id bis token)
}

export interface TokenSet {
  t: number[] // token ids
}

export interface ServerTier {
  tier_name: string
}

export interface ServerTranscript {
  aAntworten?: {
    [answer_id: string]: ServerAnswer|ServerAnswerSet
  }
  aTokenSets?: {
    [set_id: number]: TokenRange|TokenSet
  }
  aTiers: {
    [tier_id: string]: ServerTier
  }
  aTokens: {
    [token_id: string]: ServerToken
  }
  aEinzelErhebung?: {
    af: string
    d: string
    dp: string
    e: number
    pk: number
    trId: number
  }
  aInformanten?: ServerTranscriptInformants
  aTranskript?: {
    default_tier?: TokenTierType|null
    n: string // name
    pk: ServerTranscriptId
    ut: string
  }
  aTokenTypes?: ServerTranscriptTokenTypes
  aEvents: ServerEvent[]
  nNr: number
  aNr: number
  aTmNr?: number
}

export interface ServerToken {
  tr: number // token reihung
  tt: number // token type
  sr: number // sequence in sentence
  t: string // text
  to: string // text in ortho
  s: number // sentence id
  i: number // inf id
  e: number // event id
  o?: string // ortho
  p?: string // TODO: add phon on server
  fo?: number // fragment of
}

export interface ServerEventTierContent {
  // event tier string
  t: string
  // tier id
  ti: number
}

export interface ServerEventTiers {
  [event_tier_id: string]: ServerEventTierContent
}

export interface ServerSpeakerEventTiers {
  [speaker_id: string]: ServerEventTiers
}

export interface ServerSpeakerEventTiersSaveResponse {
  [speaker_id: string]: {
    [event_tier_id: string]: SaveResponse<ServerEventTierContent>
  }
}

export interface ServerEvent {
  pk: number
  tid: {
    [speaker_id: string]: number[]
  }
  event_tiers: ServerSpeakerEventTiers
  e: string // end
  s: string // start
  l: 0
}

const diffWorker = new PromiseWorker(new ServerTranscriptDiff())
const textEncoder = new TextEncoder()

export let serverTranscript: ServerTranscript|null = null

export function getAudioUrlFromServerNames(name: string|undefined, path: string|undefined): string|null {
  if (path === undefined || name === undefined) {
    return null
  } else {
    // windows file paths to urls with normal forward slashes
    const cleanPath = path.split('\\').join('/')
    // add slashes left and right conditionally
    const cleanPathWithSlashes = cleanPath.startsWith('/')
      ? (cleanPath.endsWith('/')
        ? cleanPath
        : cleanPath + '/')
      : '/' + (cleanPath.endsWith('/')
        ? cleanPath
        : cleanPath + '/')
    console.log({cleanPath, cleanPathWithSlashes})
    // add .ogg if necessary
    const cleanName = name.endsWith('.ogg') ? (name) : (name + '.ogg')
    return `${ settings.backEndUrl }/private-media${ cleanPathWithSlashes }${ cleanName }`
  }
}

export function getMetadataFromServerTranscript(res: ServerTranscript) {
  const defaultTier = res.aTranskript!.default_tier || 'text'
  const v = {
    speakers: _.mapValues(res.aInformanten!, inf => ({ ...inf, searchInSpeaker: true })),
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    defaultTier,
    audioUrl: getAudioUrlFromServerNames(res.aEinzelErhebung!.af, res.aEinzelErhebung!.dp),
    tiers: [
      {
        searchInTier: true,
        type: 'token',
        name: 'eye dialect',
        show: defaultTier === 'text',
        id: 'text'
      },
      {
        searchInTier: true,
        type: 'token',
        name: 'ortho',
        show: defaultTier === 'ortho',
        id: 'ortho'
      },
      {
        searchInTier: true,
        type: 'token',
        name: 'phon',
        show: defaultTier === 'phon',
        id: 'phon'
      }
    ].concat(_(res.aTiers).map((t, tid) => ({
      searchInTier: true,
      type: 'freeText',
      name: t.tier_name,
      show: false,
      id:   tid
    })).value()) as LocalTranscriptTier[]
  }
  return v
}

export function mergeServerTranscript(s: ServerTranscript) {

  const oldSt = (serverTranscript === null ? {
    aTokens: undefined,
    aEvents: [],
    aAntworten: undefined,
    aTokenSets: undefined
  } : serverTranscript)

  serverTranscript = {
    ...oldSt,
    ...s,
    aAntworten: {
      ...oldSt.aAntworten,
      ...s.aAntworten
    },
    aTokenSets: {
      ...oldSt.aTokenSets,
      ...s.aTokenSets
    },
    aTokens: {
      ...oldSt.aTokens,
      ...s.aTokens
    },
    aEvents: _.uniqBy([
      ...oldSt.aEvents,
      ...s.aEvents
    ], (e) => e.pk)
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
  // console.log('replaceLastOccurrence', token, toReplace, replaceWith)
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
      // return the next event’s first token id
      return nextEvent.tid[speakerKey][0]
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}

// tslint:disable-next-line:max-line-length
function serverEventTiersSaveResponseToServerEventTiers(speakerEventTiers: ServerSpeakerEventTiersSaveResponse): ServerSpeakerEventTiers {
  return _(speakerEventTiers).mapValues((speakerEventTier, speakerId) => {
    return _(speakerEventTier).reduce((m, e, k) => {
      if ((e as any).newStatus !== 'deleted') {
        m[e.newPk || k] = {
          ti: e.ti,
          t: e.t
        }
      }
      return m
    }, {} as ServerEventTiers)
  }).value()
}

export function serverEventSaveResponseToServerEvent(e: ServerEventSaveResponse): ServerEvent {
  return {
    e: e.e,
    l: e.l,
    pk: e.newPk || e.pk,
    s: e.s,
    tid: e.tid,
    event_tiers: serverEventTiersSaveResponseToServerEventTiers(e.event_tiers)
  }
}

export function serverTokenSaveResponseToServerToken(
  t: SaveResponse<ServerToken>,
  es: _.Dictionary<SaveResponse<ServerEvent>>
): ServerToken {
  return {
    e: t.e > 0
      ? t.e             // it’s an existing event
      : es[t.e].newPk!, // it’s a new event, use the server-supplied primary key.
    fo: t.fo,
    i: t.i,
    o: t.o,
    p: t.p,
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
  tcs: _.Dictionary<SaveResponse<ServerToken>>,
  es: Array<SaveResponse<ServerEvent>>
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

function mergeTierChanges(
  tiers: _.Dictionary<ServerTier>,
  tiersUpdates: _.Dictionary<SaveResponse<ServerTier>>
): _.Dictionary<ServerTier> {
  return _(tiersUpdates).reduce((m, e, k, l) => {
    if (e.newStatus !== 'deleted' && e.newStatus !== 'error') {
      m[e.newPk || k] = {
        tier_name: e.tier_name
      }
    }
    return m
  }, {} as _.Dictionary<ServerTier>)
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
      // console.log('inserted event', keyedEvents[e.newPk!], e.newPk)
    } else if (e.newStatus === 'updated') {
      keyedEvents[e.pk] = serverEventSaveResponseToServerEvent(e)
    }
  })
  // rebuild the token_id (tid) reference in their events
  _(ts)
    .mapValues((t, k) => ({...t, token_id: Number(k)}))
    .groupBy(t => `${t.e}__${t.i}`)
    .each((speakerTokens, speakerEventId) => {
      const [ eventId, speakerId ] = speakerEventId.split('__')
      if (keyedEvents[eventId] !== undefined) {
        keyedEvents[eventId].tid[speakerId] = _(speakerTokens).orderBy(t => t.tr).map(t => t.token_id).value()
      } else {
        console.log('undefined event id', speakerEventId)
      }
    })
  return _.toArray(keyedEvents)
}

// tslint:disable-next-line:max-line-length
export function updateServerTranscriptWithChanges(st: ServerTranscript, ss: ServerTranscriptSaveResponse): ServerTranscript {
  if (serverTranscript !== null) {
    const newTokens = mergeTokenChanges(st.aTokens, ss.aTokens, ss.aEvents)
    const newEvents = mergeEventChanges(st.aEvents, ss.aEvents, newTokens)
    const newTiers = mergeTierChanges(st.aTiers, ss.aTiers)
    const x = {
      ...ss,
      aTiers: newTiers,
      aTokens: newTokens,
      aEvents: newEvents
    }
    serverTranscript = x
    return x
  } else {
    throw new Error('can’t handle null')
  }
}

function maybeAddFragments(base: string, next?: string) {
  if (next !== undefined && next !== '') {
    const res = replaceLastOccurrence(base, next, '=')
    console.log('added fragment', base, next, res)
    return res
  } else {
    return base
  }
}

export function serverTranscriptToLocal(s: ServerTranscript, defaultTier: TokenTierType): LocalTranscript {
  return _(s.aEvents)
    .uniqBy(e => e.pk)
    // sort, so the grouped events are in the correct order.
    .sortBy(e => timeToSeconds(e.s))
    // group into events by startTime and endTime
    .groupBy((e) => e.s + '-' + e.e)
    // so we can access it as a list
    .toArray()
    // generate unified local events
    .map((eG: ServerEvent[], iG, lG) => {
      return {
        eventId: eG[0].pk,
        startTime: timeToSeconds(eG[0].s),
        endTime: timeToSeconds(eG[0].e),
        speakerEvents: _.reduce(eG, (m, se) => {
          _.each(se.tid, (tokenIds, speakerKey) => {
            m[speakerKey] = {
              speakerEventTiers: _(eG).reduce((ts, e) => {
                _(e.event_tiers[speakerKey]).each((t, tierEventId) => {
                  ts[t.ti] = {
                    id: tierEventId,
                    type: 'freeText',
                    text: t.t
                  }
                  return ts[t.ti]
                })
                return ts
              }, {} as LocalTranscriptSpeakerEventTiers),
              speakerEventId: se.pk,
              tokens: _.map(tokenIds, (tokenId) => {
                if (s.aTokens[tokenId] === undefined) {
                  console.log('not found', tokenId, se)
                }
                const nextFragmentOfId = findNextFragmentOfId(tokenId, speakerKey, Array.from(lG), iG, s.aTokens)
                return {
                  id: tokenId,
                  fragmentOf: s.aTokens[tokenId].fo || null,
                  sentenceId: s.aTokens[tokenId].s || null,
                  order: s.aTokens[tokenId].tr,
                  // TODO: proposal:
                  // calculate the width ahead of time
                  // and use that for virtual scrolling
                  // width: getTextWidth(s.aTokens[tokenId].o!, 14, 'HKGrotesk'),
                  tiers: {
                    text: {
                      text: maybeAddFragments(
                        s.aTokens[tokenId].t,
                        nextFragmentOfId !== undefined ? s.aTokens[nextFragmentOfId].t : ''
                      ),
                      type: defaultTier === 'text' ? s.aTokens[tokenId].tt : null
                    },
                    ortho: {
                      text: maybeAddFragments(
                        s.aTokens[tokenId].o || '',
                        nextFragmentOfId !== undefined ? s.aTokens[nextFragmentOfId].o : ''
                      ),
                      type: defaultTier === 'ortho' ? s.aTokens[tokenId].tt : null
                    },
                    phon: {
                      text: s.aTokens[tokenId].p !== undefined ? s.aTokens[tokenId].p as string : '',
                      type: defaultTier === 'phon' ? s.aTokens[tokenId].tt : null
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
    .uniqBy(e => e.eventId)
    .value()
}

export async function getSurveys(): Promise<ServerSurvey[]> {
  const x = await (await fetch(`${ settings.backEndUrl }/routes/einzelerhebungen`, {
    credentials: 'include',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })).json()
  return x.einzelerhebungen
}

export async function createEmptyTranscript(
  surveyId: number,
  name: string,
  defaultTier: TokenTierType
): Promise<{error: string|null, transcript_id: ServerTranscriptId}> {
  const res = await (await fetch(`${ settings.backEndUrl }/routes/transcript/create`, {
    credentials: 'include',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      id_einzelerhebung: surveyId,
      default_tier: defaultTier
    })
  })).json()
  if (res.error === null) {
    return res
  } else {
    throw new Error('Could not create empty transcript')
  }
}

export function getLockedTokensFromServerTranscript(t: ServerTranscript): number[] {
  if (t.aAntworten !== undefined) {
    return _(t.aAntworten!).reduce((m = [], e) => {
      // single token
      if ('it' in e) {
        return m.concat(e.it)
      // token set or range
      } else if ('its' in e && t.aTokenSets !== undefined) {
        const ts = t.aTokenSets[e.its]
        if (ts !== undefined) {
          if ('t' in ts) {
            // token set
            return m.concat(ts.t)
          } else {
            // token range
            return m.concat([ ts.ivt, ts.ibt ])
          }
        } else {
          return m
        }
      } else {
        return m
      }
    }, [] as number[])
  } else {
    return []
  }
}

export async function getServerTranscripts(backEndUrl: string): Promise<{transcripts: ServerTranscriptListItem[]}> {
  const res = await (await fetch(`${ backEndUrl }/routes/transcripts`, {
    credentials: 'include'
  })).json()
  return res
}

async function performSaveRequest(id: number, t: ServerTranscriptSaveRequest): Promise<ServerTranscriptSaveResponse> {
  return await (
    await fetch(`${ settings.backEndUrl }/routes/transcript/save/${ id }`, {
    credentials: 'include',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(t),
  })).json() as ServerTranscriptSaveResponse
}

export async function convertToServerTranscript(es: LocalTranscriptEvent[]): Promise<ServerTranscript|null> {
  if (serverTranscript !== null) {
    return localTranscriptToServerTranscript(serverTranscript, es)
  } else {
    return null
  }
}

function logServerResponse(req: ServerTranscriptSaveRequest, res: ServerTranscriptSaveResponse) {
  console.log({
    localChanges: _(req.aTokens).toArray().value(),
    localDeletionsAndInserts: _(req.aTokens).toArray().filter((token) => {
      return token.status === 'delete' || token.status === 'insert'
    }).value(),
    serverDeletionsAndErrorsAndInserts: _(res.aTokens).toArray().filter((token) => {
      return token.newStatus === 'deleted' || token.newStatus === 'inserted' || token.newStatus === 'error'
    }).value(),
    groupedErrors: _(res.aTokens)
      .toArray()
      .filter(token => token.error !== undefined)
      .groupBy(token => token.error)
      .value()
  })
}

// also changes metadata: tiers.
export async function saveChangesToServer(es: LocalTranscriptEvent[]): Promise<LocalTranscriptEvent[]> {
  // there’s no transcript or no id => throw
  if ( serverTranscript === null || serverTranscript.aTranskript === undefined ) {
    throw new Error('transcript id is undefined')
  } else {
    // it’s already on the server
    if (serverTranscript.aTranskript.pk > -1) {
      const t = await localTranscriptToServerSaveRequest(serverTranscript, es)
      // console.log({ ServerTranscriptSaveRequest: t })
      const serverChanges = await performSaveRequest(serverTranscript.aTranskript.pk, t)
      // console.log({ serverChanges })
      logServerResponse(t, serverChanges)
      const updatedServerTranscript = updateServerTranscriptWithChanges(serverTranscript, serverChanges)
      console.log({updatedServerTranscript})
      const updatedLocalTranscript = serverTranscriptToLocal(
        updatedServerTranscript,
        eventStore.metadata.defaultTier || 'text'
      )
      // eventStore.events = updatedLocalTranscript
      return updatedLocalTranscript
      // console.log({ updatedServerTranscript, updatedLocalTranscript })
    // it’s a new transcript
    } else {
      console.log({ serverTranscript })
      const { transcript_id } = await createEmptyTranscript(
        serverTranscript.aEinzelErhebung!.pk,
        serverTranscript.aTranskript.n,
        serverTranscript.aTranskript.default_tier!
      )
      console.log('created transcript with id', transcript_id)
      const transcriptWithoutTokensAndEvents = {
        ...serverTranscript,
        aTranskript: {
          ...serverTranscript.aTranskript,
          pk: transcript_id
        },
        aTokens: {},
        aEvents: []
      }
      const t = await localTranscriptToServerSaveRequest(transcriptWithoutTokensAndEvents, eventStore.events)
      const serverChanges = await performSaveRequest(transcript_id, t)
      logServerResponse(t, serverChanges)
      const updatedServerTranscript = updateServerTranscriptWithChanges(transcriptWithoutTokensAndEvents, serverChanges)
      console.log({ updatedServerTranscript })
      const updatedLocalTranscript = serverTranscriptToLocal(
        updatedServerTranscript,
        eventStore.metadata.defaultTier || 'text'
      )
      console.log({ updatedLocalTranscript })
      const { tiers } = getMetadataFromServerTranscript(serverTranscript)
      eventStore.metadata.tiers = tiers
      serverTranscript.aTranskript!.pk = transcript_id
      // eventStore.events = updatedLocalTranscript
      return updatedLocalTranscript
    }
  }
}

function appendTranscriptEventChunk(a: LocalTranscriptEvent[], b: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
  const lastOfPrevious = _(a).last()
  const firstOfNext = _(b).first()
  if (lastOfPrevious !== undefined && firstOfNext !== undefined) {
    if (
      // it’s at exactly the same time
      lastOfPrevious.startTime === firstOfNext.startTime &&
      lastOfPrevious.endTime === firstOfNext.endTime
    ) {
      // merge
      const mergedEvent: LocalTranscriptEvent = {
        ...lastOfPrevious,
        speakerEvents: {
          ...lastOfPrevious.speakerEvents,
          ...firstOfNext.speakerEvents
        }
      }
      // replace the lastOfPrevious & firstOfNext with the merged event
      return _.initial(a).concat(mergedEvent).concat(_.tail(b))
    } else {
      // normal concatenation
      return a.concat(b)
    }
  } else {
    // normal concatenation
    return a.concat(b)
  }
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
    const res = await (await fetch(`${ settings.backEndUrl }/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    // merge the chunk
    mergeServerTranscript(res)

    // when it’s the first page, get it’s metadata
    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
    }

    // get and concat the locked tokens
    eventStore.lockedTokens = eventStore.lockedTokens.concat(getLockedTokensFromServerTranscript(res))

    const eventChunk = serverTranscriptToLocal(res, eventStore.metadata.defaultTier || 'text')
    // update the store
    eventStore.events = appendTranscriptEventChunk(eventStore.events, eventChunk)
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
