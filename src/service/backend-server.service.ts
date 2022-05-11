import _ from 'lodash'
import PromiseWorker from 'promise-worker-transferable'

import {
  TranscriptEvent,
  // eventStore,
  LocalTranscript,
  TranscriptTier,
  TranscriptSpeakerEventTiers,
  TokenTierType
} from '../types/transcript'
import { clone, timeToSeconds } from '../util'
import ServerTranscriptDiff from '../workers/backend-server-transcript-diff.worker'
import Transcript from '../classes/transcript.class'
// import EventService from './event-service'
import store from '@/store'
import settings from '@/store/settings.store'

type ServerTranscriptId = number

interface ServerTokenTier {
  text: string
  value: TokenTierType
  description: string
  disabled: boolean
}

export const serverTokenTiers: ServerTokenTier[] = [
  {
    text: 'orthographic',
    value: 'ortho',
    description: 'standard orthographic transcript',
    disabled: false
  },
  {
    text: 'eye dialect',
    value: 'text',
    description: 'phonetic transcription\n using the latin alphabet',
    disabled: false
  },
  {
    text: 'phonetic',
    value: 'phon',
    description: 'actual phonetic transcription',
    disabled: false
  }
]

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
  // aTiers: {
  //   [tier_id: string]: SaveRequest<ServerTier>
  // }
}

export interface ServerInformant {
  weiblich?: boolean
  Kuerzel: string
  Geburtsdatum?: string|null
  Wohnbezirk?: number|null
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
  OrtString: string
  id_transcript: number|null
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

export interface ServerTranscriptSurvey {
  /** Audio File */
  af: string
  d: string
  /** Datei Pfad */
  dp: string
  e: number
  /** Primary Key */
  pk: number
  /** Transcript Id */
  trId: number
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
  aEinzelErhebung?: ServerTranscriptSurvey
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

export function serverTranscriptSurveyToSurvey(s: ServerTranscriptSurvey, transcriptId?: number): ServerSurvey {
  return {
    Audiofile: s.af,
    Dateipfad: s.dp,
    Datum: s.d,
    ID_Erh: s.e,
    id_transcript: transcriptId === undefined ? s.trId : transcriptId,
    FX_Informanten: [],
    Ort: '',
    OrtString: '',
    pk: s.pk
  }
}

export function surveyToServerTranscriptSurvey(s: ServerSurvey, transcriptId = -1): ServerTranscriptSurvey {
  return {
    af: s.Audiofile,
    d: s.Datum,
    dp: s.Dateipfad,
    e: s.ID_Erh,
    pk: s.pk,
    trId: transcriptId
  }
}

export function surveyToServerTranscriptInformants(s: ServerSurvey): ServerTranscriptInformants {
  return s.FX_Informanten.reduce((m, e) => {
    m[e.pk] = {
      k: e.Kuerzel,
      ka: e.Kuerzel_anonym || ''
    }
    return m
  }, {} as ServerTranscriptInformants)
}

export function getAudioUrlFromServerNames(
  name: string|undefined,
  path: string|undefined,
  host: string
): string|null {
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
    return `${ host }/private-media${ cleanPathWithSlashes }${ cleanName }`
  }
}

export function getMetadataFromServerTranscript(res: ServerTranscript) {
  const defaultTier = res.aTranskript!.default_tier || 'text'
  const v = {
    speakers: _.mapValues(res.aInformanten!, inf => ({ ...inf, searchInSpeaker: true })),
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    defaultTier,
    audioUrl: getAudioUrlFromServerNames(
      res.aEinzelErhebung ? res.aEinzelErhebung.af : undefined,
      res.aEinzelErhebung ? res.aEinzelErhebung.dp : undefined,
      settings.backEndUrl!
    ),
    tiers: [
      {
        searchInTier: true,
        type: 'token',
        name: 'eye dialect',
        show: {}, // defaultTier === 'text',
        id: 'text'
      },
      {
        searchInTier: true,
        type: 'token',
        name: 'ortho',
        show: {}, // defaultTier === 'ortho',
        id: 'ortho'
      },
      {
        searchInTier: true,
        type: 'token',
        name: 'phon',
        show: {}, // defaultTier === 'phon'
        id: 'phon'
      }
    ].concat(_(res.aTiers).map((t, tid) => ({
      searchInTier: true,
      type: 'freeText',
      name: t.tier_name,
      show: {},
      id: tid
    })).value()) as TranscriptTier[]
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
    .postMessage({ oldT, newT }, [oldT, newT]) as [ServerTranscriptSaveRequest, ServerTranscript]
  return newServerTranscript
}

export async function localTranscriptToServerSaveRequest(
  oldServerTranscript: ServerTranscript,
  localEvents: LocalTranscript): Promise<ServerTranscriptSaveRequest> {
  const oldT = textEncoder.encode(JSON.stringify(oldServerTranscript)).buffer
  const newT = textEncoder.encode(JSON.stringify(localEvents)).buffer
  const [
    tokensAndEventsDiff
  ] = await diffWorker.postMessage({ oldT, newT }, [oldT, newT]) as [ServerTranscriptSaveRequest, ServerTranscript]
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
        m[e.newPk || k] = {
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
  t: SaveResponse<ServerToken>, // the token
  es: _.Dictionary<SaveResponse<ServerEvent>>, // the new/updated events by key
  tcs: _.Dictionary<SaveResponse<ServerToken>> // the new/updated tokens by key
): ServerToken {
  return {
    // event ID
    e: (() => {
      if (t.e > 0) {
        // it’s an existing event
        return t.e
      } else {
        // it’s a new event, use the server-supplied primary key.
        return es[t.e].newPk!
      }
    })(),
    // fragmentOf ID
    fo: (() => {
      // it has a fragment-of marker
      if (t.fo !== undefined) {
        // it refers to an existing token
        if (t.fo > 0) {
          return t.fo
        // it refers to a new token => use the new key.
        } else if (tcs[t.fo] !== undefined) {
          return tcs[t.fo].newPk
        }
      } else {
        return undefined
      }
    })(),
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
      tokens[t.newPk!] = serverTokenSaveResponseToServerToken(t, keyedEvents, tcs)
    } else if (t.newStatus === 'updated') {
      tokens[id] = serverTokenSaveResponseToServerToken(t, keyedEvents, tcs)
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
    .mapValues((t, k) => ({ ...t, token_id: Number(k) }))
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

function maybeReplaceFragments(base: string, next?: string) {
  if (next !== undefined && next !== '') {
    const res = replaceLastOccurrence(base, next, '=')
    console.log('added fragment', base, next, res)
    return res
  } else {
    return base
  }
}

export function serverTranscriptToLocal(s: ServerTranscript, defaultTier: TokenTierType): LocalTranscript {
  let sTTLd:any = {}
  let sTTL = _(s.aEvents)
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
        // start and end time and id are based on the first unified event.
        eventId: eG[0].pk,
        startTime: timeToSeconds(eG[0].s),
        endTime: timeToSeconds(eG[0].e),
        speakerEvents: _.reduce(eG, (m, se) => {
          // get speakers who have either tokens or entries in event tiers in this group
          const speakers = Object.keys({ ...se.tid, ...se.event_tiers })
          _.each(speakers, (speakerKey) => {
            // generate a speaker event for each speaker
            m[speakerKey] = {
              // generate event tiers
              speakerEventTiers: _(eG).reduce((ts, e) => {
                _(e.event_tiers[speakerKey] || []).each((t, tierEventId) => {
                  ts[t.ti] = {
                    id: tierEventId,
                    type: 'freeText',
                    text: t.t
                  }
                })
                return ts
              }, {} as TranscriptSpeakerEventTiers),
              speakerEventId: se.pk,
              // generate token tiers
              tokens: (se.tid[speakerKey] || [])
                // remove tokens that have a bad reference.
                .filter(tokenId => s.aTokens[tokenId] !== undefined)
                .map((tokenId) => {
                  // find out if this token is part of a fragmented token, and get id.
                  const nextFragmentOfId = findNextFragmentOfId(tokenId, speakerKey, Array.from(lG), iG, s.aTokens)
                  return {
                    id: tokenId,
                    fragmentOf: s.aTokens[tokenId].fo || null,
                    sentenceId: s.aTokens[tokenId].s || null,
                    order: s.aTokens[tokenId].tr,
                    // TODO:
                    // calculate the width ahead of time
                    // and use that for virtual scrolling
                    // width: getTextWidth(s.aTokens[tokenId].o!, 14, 'HKGrotesk'),
                    tiers: {
                      text: {
                        // replace the adjunct fragments with "="
                        text: maybeReplaceFragments(
                          s.aTokens[tokenId].t,
                          nextFragmentOfId !== undefined
                            ? s.aTokens[nextFragmentOfId].t
                            : ''
                        ),
                        type: defaultTier === 'text' ? s.aTokens[tokenId].tt : null
                      },
                      ortho: {
                        // replace the adjunct fragments with "="
                        text: maybeReplaceFragments(
                          s.aTokens[tokenId].o || '',
                          nextFragmentOfId !== undefined
                            ? s.aTokens[nextFragmentOfId].o
                            : ''
                        ),
                        type: defaultTier === 'ortho' ? s.aTokens[tokenId].tt : null
                      },
                      phon: {
                        // don’t do that for phon. there are no fragments here.
                        text: s.aTokens[tokenId].p !== undefined ? s.aTokens[tokenId].p as string : '',
                        type: defaultTier === 'phon' ? s.aTokens[tokenId].tt : null
                      }
                    }
                  }
                })
            }
            if (!sTTLd[eG[0].pk]) {
              sTTLd[eG[0].pk] = {}
            }
            if (!sTTLd[eG[0].pk][speakerKey]) {
              sTTLd[eG[0].pk][speakerKey] = m[speakerKey]
            } else {
              if (eG[0].pk === se.pk) {
                sTTLd[eG[0].pk][speakerKey].speakerEventId = se.pk
              }
              Object.keys(m[speakerKey].speakerEventTiers).forEach(sET => {
                if (!sTTLd[eG[0].pk][speakerKey].speakerEventTiers[sET]) {
                  sTTLd[eG[0].pk][speakerKey].speakerEventTiers[sET] = m[speakerKey].speakerEventTiers[sET]
                }
              })
              m[speakerKey].tokens.forEach(aT => {
                let afT = sTTLd[eG[0].pk][speakerKey].tokens.filter((xT:any) => xT.id === aT.id)
                if (afT.length === 0) {
                  sTTLd[eG[0].pk][speakerKey].tokens.push(aT)
                }
              })
              m[speakerKey] = sTTLd[eG[0].pk][speakerKey]
            }
            // console.log(eG[0].pk, se.pk, speakerKey, {eG, m: m[speakerKey], se, seTid: se.tid[speakerKey], seTidFiltered: (se.tid[speakerKey] || []).filter(tokenId => s.aTokens[tokenId] !== undefined)})
          })
          return m
        }, {} as TranscriptEvent['speakerEvents'])
      }
    })
    .orderBy(e => e.startTime)
    .uniqBy(e => e.eventId)
    .value()
  // console.log('sTTL', sTTL)
  return sTTL
}

export async function getSurveys(host: string): Promise<ServerSurvey[]> {
  const x = await (await fetch(`${ host }/routes/einzelerhebungen`, {
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
  host: string,
  surveyId: number,
  name: string,
  defaultTier: TokenTierType
): Promise<{error: string|null, transcript_id: ServerTranscriptId}> {
  const res = await (await fetch(`${ host }/routes/transcript/create`, {
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

async function performSaveRequest(
  host: string,
  id: number,
  t: ServerTranscriptSaveRequest
): Promise<ServerTranscriptSaveResponse> {
  return await (
    await fetch(`${ host }/routes/transcript/save/${ id }`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(t)
    })).json() as ServerTranscriptSaveResponse
}

// TODO:
// only passing the events won’t work, because we also need to
// diff the tiers and send them to the server.
// as in `ts: {[tier_id: string]: ServerTier}`
export async function convertToServerTranscript(es: TranscriptEvent[]): Promise<ServerTranscript|null> {
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
export async function saveChangesToServer(
  transcript: Transcript,
  surveyId = null,
  defaultTier = null,
  name = null
): Promise<TranscriptEvent[]> {
  // there’s no transcript or no id => throw
  if (serverTranscript === null || serverTranscript.aTranskript === undefined) {
    throw new Error('transcript id is undefined')
  } else {
    // it’s already on the server
    if (serverTranscript.aTranskript.pk > -1 && settings.backEndUrl !== null) {
      const t = await localTranscriptToServerSaveRequest(serverTranscript, transcript.events)
      console.log({ ServerTranscriptSaveRequest: t })
      const serverChanges = await performSaveRequest(settings.backEndUrl, serverTranscript.aTranskript.pk, t)
      console.log({ serverChanges })
      logServerResponse(t, serverChanges)
      const updatedServerTranscript = updateServerTranscriptWithChanges(serverTranscript, serverChanges)
      console.log({ updatedServerTranscript })
      const updatedLocalTranscript = serverTranscriptToLocal(
        updatedServerTranscript,
        transcript.meta.defaultTier || 'text'
      )
      // eventStore.events = updatedLocalTranscript
      return updatedLocalTranscript
      // console.log({ updatedServerTranscript, updatedLocalTranscript })
    // it’s a new transcript
    } else {
      console.log({ serverTranscript })
      const { transcript_id } = await createEmptyTranscript(
        settings.backEndUrl!,
        surveyId || serverTranscript.aEinzelErhebung!.pk,
        name || serverTranscript.aTranskript.n,
        defaultTier || serverTranscript.aTranskript.default_tier!
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
      const t = await localTranscriptToServerSaveRequest(transcriptWithoutTokensAndEvents, transcript.events)
      const serverChanges = await performSaveRequest(settings.backEndUrl!, transcript_id, t)
      logServerResponse(t, serverChanges)
      const updatedServerTranscript = updateServerTranscriptWithChanges(transcriptWithoutTokensAndEvents, serverChanges)
      console.log({ updatedServerTranscript })
      const updatedLocalTranscript = serverTranscriptToLocal(
        updatedServerTranscript,
        transcript.meta.defaultTier || 'text'
      )
      console.log({ updatedLocalTranscript })
      const { tiers } = getMetadataFromServerTranscript(serverTranscript)
      transcript.meta.tiers = tiers
      serverTranscript.aTranskript!.pk = transcript_id
      // eventStore.events = updatedLocalTranscript
      return updatedLocalTranscript
    }
  }
}

function appendTranscriptEventChunk(a: TranscriptEvent[], b: TranscriptEvent[]): TranscriptEvent[] {
  const lastOfPrevious = _(a).last()
  const firstOfNext = _(b).first()
  if (lastOfPrevious !== undefined && firstOfNext !== undefined) {
    if (
      // it’s at exactly the same time
      lastOfPrevious.startTime === firstOfNext.startTime &&
      lastOfPrevious.endTime === firstOfNext.endTime
    ) {
      // merge the event
      const mergedEvent: TranscriptEvent = {
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

export async function fetchTranscript(
  id: number,
  backEndUrl: string,
  transcript: Transcript,
  onProgress: (v: number, es: TranscriptEvent[], res: ServerTranscript) => any,
  chunk = 0,
  totalSteps?: number
): Promise<Transcript> {
  try {
    // download transcript page
    const res = await (await fetch(`${ backEndUrl }/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    // merge the chunk
    mergeServerTranscript(res)

    // when it’s the first page, get its metadata
    if (res.aNr === 0) {
      transcript.meta = {
        ...getMetadataFromServerTranscript(res),
        lockedTokens: getLockedTokensFromServerTranscript(res)
      }
    }

    // get and concatenate the locked tokens
    transcript.meta.lockedTokens = transcript.meta.lockedTokens.concat(getLockedTokensFromServerTranscript(res))

    const eventChunk = serverTranscriptToLocal(res, transcript.meta.defaultTier || 'text')
    // update the store
    transcript.events = appendTranscriptEventChunk(transcript.events, eventChunk)
    // progress callback with data
    if (onProgress !== undefined) {
      onProgress(res.aNr / (totalSteps || res.aTmNr || 10), transcript.events, res)
    }
    // get next (recursion) or finish
    if (res.nNr > res.aNr) {
      return fetchTranscript(
        id,
        backEndUrl,
        transcript,
        onProgress,
        chunk + 1,
        totalSteps || res.aTmNr
      )
    } else {
      return transcript
    }
  } catch (e) {
    console.error(e)
    return transcript
  }
}
