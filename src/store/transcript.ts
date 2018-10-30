
import * as _ from 'lodash'
import parseTree, { ParsedXML } from '../service/transcript-parser'
import * as parseXML from '@rgrove/parse-xml'
import audio from '../service/audio'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
    peaks: any
  }
  interface Segment {
    color?: string
    editable?: boolean
    startTime: number
    endTime: number
    id: number
    labelText?: string
  }
  interface Transcript {
    name: string
    audioUrl?: string
    speakers: string[]
    events?: LocalTranscriptEvent[]
    segments: Segment[]
    speakerEvents: _.Dictionary<SpeakerEvent>
  }
  interface SegmentMetadata {
    tokens: string[]
  }
  interface SpeakerEvent {
    [key: string]: {
      tokens: string[]
    }
  }
  interface ServerTranscriptListItem {
    pk: number
    ut: string
    n: string
  }
}

interface ServerTranscript {
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
  aInformanten?: {
    [speaker_id: number]: {
      ka: string // name anonymized
      k: string // name
    }
  }
  aTranscript?: {
    n: string // name
    pk: number
    ut: string
  }
  aTokenTypes?: {
    [id: string]: {
      n: string // word
    }
  }
  aEvents: ServerEvent[]
  nNr: number
  aNr: number
  aTmNr?: number
}

interface ServerToken {
  tr: number // token reihung
  tt: number // token type
  sr: number // sequence in sentence
  t: string // text
  to: string // text in ortho
  s: number // sentence id
  i: number // inf id
  e: number // event id
}

interface ServerEvent {
  pk: number
  tid: {
    [speaker_id: string]: number[]
  }
  e: string // end
  s: string // start
  l: 0
}

interface LocalTranscriptTokeTier {
  text: string
  type: number|null
}

type LocalTranscriptSpeakers = ServerTranscript['aInformanten']
type LocalTranscriptTokenTypes = ServerTranscript['aTokenTypes']

interface LocalTranscriptToken {
  id: number
  tiers: {
    default: LocalTranscriptTokeTier
    [tier: string]: LocalTranscriptTokeTier
  }
}

export interface LocalTranscriptEvent {
  eventId: number
  startTime: number
  endTime: number,
  speakerEvents: {
    [speakerId: string]: {
      speakerEventId: number
      tokens: LocalTranscriptToken[]
    }
  }
}

export type LocalTranscript = LocalTranscriptEvent[]

interface HistoryEventAction {
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'
  event: LocalTranscriptEvent
}

let transcript: Transcript|null = null
export const history: HistoryEventAction[] = []

function transcriptTreeToTranscribable(tree: ParsedXML, name: string): Transcript {
  console.log({tree})
  const speakers = _(tree.speakers).map((v, k) => k).value()
  const segments = _(tree.speakers)
    .map(tiers => _.map(tiers, tier => _.map(tier.events, event => ({
      id: makeEventId(),
      startTime: Number(event.startTime),
      endTime: Number(event.endTime)
    }) )))
    .flatten()
    .flatten()
    .flatten()
    .uniqBy(s => s.id)
    .orderBy(s => s.startTime)
    .value()

  const speakerEvents = _(tree.speakers)
    .map((tiers, key) => {
      // only the first tier for now
      return _.toArray(tiers)[0].events.map(e => {
        return {
          start  : e.start,
          end    : e.end,
          tokens : e.text !== null ? e.text.trim().split(' ') : [],
          speaker: key
        }
      })
    })
    .flatten()
    .groupBy(e => `${e.start}-${e.end}`)
    .mapValues(spe => _.keyBy(spe, 'speaker'))
    .value()

  transcript = {
    name,
    audioUrl: '',
    speakerEvents,
    segments,
    speakers
  }
  return transcript
}

function makeEventId() {
  return Number(_.uniqueId()) * -1
}

export function findSegmentById(id: number) {
  return _(eventStore.events).findIndex(e => e.eventId === id)
}

export function findSpeakerEventById(id: string): SpeakerEvent|null {
  if (transcript !== null) {
    return transcript.speakerEvents[id]
  } else {
    return null
  }
}

export function loadExmeraldaFile(fileName: string, xml: string) {
  return transcriptTreeToTranscribable(parseTree(parseXML(xml)), fileName)
}

export function updateSpeakerTokens(
  event: LocalTranscriptEvent,
  speaker: string,
  tokens: LocalTranscriptToken[],
  tier = 'default'
) {
  if (transcript !== null) {
    history.push({
      type: 'CHANGE_TOKENS',
      event: _.clone(event)
    })
    event = {
      ...event,
      speakerEvents: {
        ...event.speakerEvents,
        [speaker] : {
          speakerEventId: event.speakerEvents[speaker].speakerEventId,
          tokens
        }
      }
    }
  }
}

export function resizeSegment(id: number, startTime: number, endTime: number) {
  if (transcript !== null) {
    const i = findSegmentById(id)
    history.push({
      type: 'RESIZE',
      event: _.clone(eventStore.events[i])
    })
    eventStore.events[i].startTime = startTime
    eventStore.events[i].endTime = endTime
  }
}

export function addSegment(atTime: number) {
  if (transcript !== null) {
    const newEvent: LocalTranscriptEvent = {
      startTime: atTime,
      endTime: atTime + 1,
      eventId: makeEventId(),
      speakerEvents: {}
    }
    history.push({
      type: 'ADD',
      event: newEvent
    })
    eventStore.events.push(newEvent)
    return newEvent
  }
}

export function deleteSegment(event: LocalTranscriptEvent) {
  if (transcript !== null) {
    console.log(event)
    const i = findSegmentById(event.eventId)
    history.push({
      type: 'DELETE',
      event: _.clone(eventStore.events[i])
    })
    eventStore.events.splice(i, 1)
  }
}

export function splitSegment(event: LocalTranscriptEvent, splitAt: number): LocalTranscriptEvent[] {
  const i = findSegmentById(event.eventId)
  const oldEndTime = event.endTime
  const newEvent: LocalTranscriptEvent = {
    startTime: event.startTime + splitAt,
    endTime: oldEndTime,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  event.endTime = event.startTime + splitAt
  eventStore.events.splice(i + 1, 0, newEvent)
  return [ event, newEvent ]
}

export function findSegmentAt(seconds: number): LocalTranscriptEvent|undefined {
  return _(eventStore.events).find((e) => {
    return e.startTime <= seconds && e.endTime >= seconds
  })
}

export function deleteEventById(id: number) {
  const i = findSegmentById(id)
  deleteSegment(eventStore.events[i])
}

function timeToSeconds(time: string) {
  const chunks = _.map(time.split(':'), Number)
  return (
      chunks[0] * 60 * 60 // hours
    + chunks[1] * 60      // minutes
    + chunks[2]           // seconds
  )
}

function serverTranscriptToTranscript(s: ServerTranscript, t: Transcript): Transcript {
  const speakers = _.map(s.aInformanten || [], (i, k) => String(k))
  const audioUrl = (() => {
    if (s.aEinzelErhebung) {
      return `https://dissdb.dioe.at/private-media${
        s.aEinzelErhebung.dp.split('\\').join('/')
      }${
        s.aEinzelErhebung.af
      }.ogg`
    } else {
      return t.audioUrl
    }
  })()
  const segments = _.map(s.aEvents, (e) => {
    return {
      id: e.pk,
      startTime: timeToSeconds(e.s),
      endTime: timeToSeconds(e.e)
    }
  })
  const speakerEvents = _(s.aEvents)
    .keyBy('pk')
    .mapValues((e) => {
      return _(e.tid).mapValues((ts) => {
        return {
          tokens: _(ts).map(ti => s.aTokens[ti].t).value()
        }
      }).value()
    })
    .value()
  // console.log('new speaker events:', speakerEvents)
  return {
    audioUrl,
    name: t.name || (s.aTranscript ? s.aTranscript.n : ''),
    speakers: speakers.length > 0 ? speakers : t.speakers,
    segments: t.segments.concat(segments),
    speakerEvents: {
      ...t.speakerEvents,
      ...speakerEvents
    }
  }
}

function serverTranscriptToLocal(s: ServerTranscript): LocalTranscript {
  const x = _(s.aEvents)
    .groupBy((e) => {
      return e.s + '-' + e.e
    })
    .flatMap((e) => {
      return {
        eventId: e[0].pk,
        startTime: timeToSeconds(e[0].s),
        endTime: timeToSeconds(e[0].e),
        speakerEvents: _.reduce(e, (m, se) => {
          _.map(se.tid, (tokenIds, speakerKey) => {
            m[speakerKey] = {
              speakerEventId: se.pk,
              tokens: _.map(tokenIds, (id) => {
                return {
                  id,
                  tiers : {
                    default: {
                      text: s.aTokens[id].t,
                      type: s.aTokens[id].tt
                    },
                    ortho: {
                      // TODO: not "text_in_ortho", but "ortho".
                      text: s.aTokens[id].to,
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
  return x
}

export async function getTranscriptNew(
  id: number,
  onProgress: (v: number, es: LocalTranscriptEvent[]) => any,
  chunk = 0,
  buffer: LocalTranscript = [],
  totalSteps?: number,
): Promise<LocalTranscript> {
  try {

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
    }

    eventStore.events = buffer.concat(serverTranscriptToLocal(res))

    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps, eventStore.events)
    }

    if (res.nNr > res.aNr)  {
      return getTranscriptNew(
        id,
        onProgress,
        chunk + 1,
        eventStore.events,
        totalSteps || res.aTmNr
      )
    } else {
      return buffer
    }
  } catch (e) {
    return buffer
  }
}

export async function getTranscript(
  id: number,
  onProgress: (p: number, t: Transcript|null) => any,
  chunk = 0,
  totalSteps?: number,
): Promise<Transcript> {
  try {

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (transcript === null) {
      transcript = {
        audioUrl: '',
        name: '',
        segments: [],
        speakerEvents: {},
        speakers: []
      }
    }

    transcript = serverTranscriptToTranscript(res, transcript)
    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps, transcript)
    }

    // console.log(serverTranscriptToLocal(res))
    if (res.nNr > res.aNr)  {
      return getTranscript(
        id,
        onProgress,
        chunk + 1,
        totalSteps || res.aTmNr,
      )
    } else {
      return transcript!
    }
  } catch (e) {
    return transcript!
  }
}

// EVENTS

const events: LocalTranscriptEvent[] = []
const selectedEventIds: number[] = []

function getMetadataFromServerTranscript(res: ServerTranscript) {
  return {
    speakers: res.aInformanten!,
    tokenTypes: res.aTokenTypes!
  }
}

export async function playEvent(event: LocalTranscriptEvent) {
  if (audio.store.uint8Buffer.byteLength > 0) {
    const buffer = await audio.decodeBufferTimeSlice(
      event.startTime,
      event.endTime,
      audio.store.uint8Buffer.buffer
    )
    if (buffer !== undefined) {
      requestAnimationFrame(() => {
        eventStore.playingEvent = event
        audio.playBuffer(buffer).addEventListener('ended', (e: Event) => {
          eventStore.playingEvent = null
        })
      })
    }
  }
}

export function isEventSelected(id: number) {
  return eventStore.selectedEventIds.indexOf(id) > -1
}

export function selectNextEvent(reverse = false) {
  if (eventStore.selectedEventIds.length > 0) {
    const i = findSegmentById(eventStore.selectedEventIds[0])
    const n = eventStore.events[i + (reverse ? -1 : 1)]
    selectEvent(n)
  }
}

export function selectPreviousEvent() {
  selectNextEvent(true)
}

export function selectEvent(e: LocalTranscriptEvent) {
  eventStore.selectedEventIds = [ e.eventId ]
}

export function addEventsToSelection(es: LocalTranscriptEvent[]) {
  eventStore.selectedEventIds = eventStore.selectedEventIds.concat(es.map(e => e.eventId))
}

export function getSelectedEvent(): LocalTranscriptEvent|undefined {
  return _.find(eventStore.events, (e) => e.eventId === eventStore.selectedEventIds[0])
}

export let eventStore = {
  events,
  selectedEventIds,
  playingEvent: null as LocalTranscriptEvent|null,
  metadata: {
    speakers: {} as LocalTranscriptSpeakers,
    tokenTypes: {} as LocalTranscriptTokenTypes
  }
}

export default transcript
