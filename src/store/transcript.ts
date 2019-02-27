
import * as _ from 'lodash'
import audio from '../service/audio'
import { clone, isEqualDeep  } from '../util'
import { historyToServerTranscript, serverTranscript } from '../service/data-backend/server-backend'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
  }
  interface ServerTranscriptListItem {
    pk: number
    ut: string
    n: string
  }
}

export interface ServerTranscript {
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
  aTranskript?: {
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
  fo?: number // fragment of
}

export interface ServerEvent {
  pk: number
  tid: {
    [speaker_id: string]: number[]
  }
  e: string // end
  s: string // start
  l: 0
}

interface LocalTranscriptTokenTier {
  text: string
  type: number|null
}

type LocalTranscriptSpeakers = ServerTranscript['aInformanten']
type LocalTranscriptTokenTypes = ServerTranscript['aTokenTypes']

export interface LocalTranscriptToken {
  id: number
  fragmentOf: number|null
  tiers: {
    default: LocalTranscriptTokenTier
    [tier: string]: LocalTranscriptTokenTier
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

export interface LocalTranscriptEditEvent extends LocalTranscriptEvent {
  editType: 'UPDATE'|'DELETE'|'ADD'
}

export interface LocalTranscriptTier {
  name: string
  show: boolean
}

export type LocalTranscript = LocalTranscriptEvent[]

export interface HistoryEventAction {
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'|'JOIN'
  apply: boolean
  events: LocalTranscriptEditEvent[]
}

export const history: HistoryEventAction[] = [];

export const eventStore = {
  events: [] as LocalTranscriptEvent[],
  selectedEventIds: [] as number[],
  searchResults: [] as LocalTranscriptEvent[],
  playingEvent: null as LocalTranscriptEvent|null,
  metadata: {
    speakers: {} as LocalTranscriptSpeakers,
    tokenTypes: {} as LocalTranscriptTokenTypes,
    transcriptName: null as string|null,
    audioUrl: null as string|null,
    tiers: [] as LocalTranscriptTier[]
  },
  userState: {
    viewingTranscriptEvent: null as LocalTranscriptEvent|null,
    viewingAudioEvent: null as LocalTranscriptEvent|null
  },
  status: 'empty' as 'empty'|'loading'|'finished'|'new'
}

export function scrollToAudioEvent(e: LocalTranscriptEvent) {
  eventStore.userState.viewingAudioEvent = e
}

export function scrollToTranscriptEvent(e: LocalTranscriptEvent) {
  eventStore.userState.viewingTranscriptEvent = e
}

export function makeEventId() {
  return Number(_.uniqueId()) * -1
}

export function makeTokenId() {
  return Number(_.uniqueId()) * -1
}

export function findSegmentById(id: number) {
  return _(eventStore.events).findIndex(e => e.eventId === id)
}

export function sentencesFromEvent(event: LocalTranscriptEvent): string[] {
  return _(event.speakerEvents).map(e => {
    return e.tokens.map(t => t.tiers.default.text).join(' ')
  }).value()
}

const sentenceRules: [(text: string) => boolean] = [
  (text) => !text.includes('  ')
]

export function speakerEventHasErrors(event: LocalTranscriptEvent): boolean {
  const sentences = sentencesFromEvent(event)
  // not every sentence satisfies every rule.
  return !sentences.every(s => sentenceRules.every(r => r(s)))
}

export function updateSpeakerTokens(
  event: LocalTranscriptEvent,
  speaker: number,
  tokens: LocalTranscriptToken[],
) {
  const oldEvent = eventStore.events[findSegmentById(event.eventId)]
  const isNew = event.speakerEvents[speaker] === undefined
  const deletedSpeaker = tokens.length === 0 ? speaker : undefined
  const speakerEvents = _({
      ...oldEvent.speakerEvents,
      [speaker] : {
        speakerEventId: isNew ? makeEventId() : event.speakerEvents[speaker].speakerEventId,
        tokens
      }
    })
    .reduce((m, e, k, l) => {
      if (Number(k) !== Number(deletedSpeaker)) {
        m[k] = e
      }
      return m
    }, {} as LocalTranscriptEvent['speakerEvents'])
  const newEvent = clone({...oldEvent, speakerEvents})
  console.log({deletedSpeaker, speakerEvents})
  history.push({
    apply: true,
    type: 'CHANGE_TOKENS',
    events: [{
      ...clone(newEvent),
      editType: 'UPDATE'
    }]
  })
  const index = findSegmentById(event.eventId)
  eventStore.events.splice(index, 1, newEvent)
}

export function resizeSegment(id: number, startTime: number, endTime: number) {
  const i = findSegmentById(id)
  history.push({
    apply: true,
    type: 'RESIZE',
    events: [{
      ...clone(eventStore.events[i]),
      editType: 'UPDATE'
    }]
  })
  eventStore.events[i].startTime = startTime
  eventStore.events[i].endTime = endTime
}

export function addSegment(atTime: number) {
  const newEvent: LocalTranscriptEvent = {
    startTime: atTime,
    endTime: atTime + 1,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  history.push({
    apply: true,
    type: 'ADD',
    events: [{
      ...clone(newEvent),
      editType: 'ADD'
    }]
  })
  eventStore.events.push(newEvent)
  return newEvent
}

export function deleteSelectedEvents(): number[] {
  eventStore.selectedEventIds.forEach(deleteEventById)
  return eventStore.selectedEventIds
}

export function deleteEvent(event: LocalTranscriptEvent) {
  const i = findSegmentById(event.eventId)
  history.push({
    apply: true,
    type: 'DELETE',
    events: [{
      ...clone(eventStore.events[i]),
      editType: 'DELETE'
    }]
  })
  eventStore.events.splice(i, 1)
}

export function splitSegment(event: LocalTranscriptEvent, splitAt: number): LocalTranscriptEvent[] {
  const i = findSegmentById(event.eventId)
  const oldEvent: LocalTranscriptEvent = {
    ...event,
    endTime: event.startTime + splitAt
  }
  const newEvent: LocalTranscriptEvent = {
    startTime: event.startTime + splitAt,
    endTime: event.endTime,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  eventStore.events.splice(i, 1, oldEvent, newEvent)
  history.push(
    {
      apply: true,
      type: 'RESIZE',
      events: [{
        ...clone(oldEvent),
        editType: 'UPDATE'
      }],
    },
    {
      apply: true,
      type: 'ADD',
      events: [{
        ...clone(newEvent),
        editType: 'ADD'
      }]
    }
  )
  return [ event, newEvent ]
}

export function findNextSegmentAt(seconds: number, events = eventStore.events): LocalTranscriptEvent|undefined {
  return _(events).find((e) => e.startTime >= seconds)
}

export function findPreviousSegmentAt(seconds: number, events = eventStore.events): LocalTranscriptEvent|undefined {
  const i = _(events).findLastIndex((e) => e.startTime < seconds)
  return events[Math.max(0, i - 1)]
}

export function findSegmentAt(seconds: number): LocalTranscriptEvent|undefined {
  return _(eventStore.events).find((e) => e.startTime <= seconds && e.endTime >= seconds)
}

export function findSegmentIndexAt(seconds: number): number {
  return _(eventStore.events).findIndex((e) => e.startTime <= seconds && e.endTime >= seconds)
}

export function deleteEventById(id: number) {
  const i = findSegmentById(id)
  deleteEvent(eventStore.events[i])
}

export function timeToSeconds(time: string) {
  const chunks = _.map(time.split(':'), Number)
  return (
      chunks[0] * 60 * 60 // hours
    + chunks[1] * 60      // minutes
    + chunks[2]           // seconds
  )
}

export function timeFromSeconds(seconds: number) {
  return new Date(1000 * seconds).toISOString().substr(12, 11)
}

export async function playEvents(events: LocalTranscriptEvent[]) {
  eventStore.playingEvent = null
  const sortedEvents = _(events).sortBy((e) => e.startTime).value()

  const synEvent = {
    ..._(sortedEvents).first() as LocalTranscriptEvent,
    endTime: (_(sortedEvents).last() as LocalTranscriptEvent).endTime
  }
  if (audio.store.uint8Buffer.byteLength > 0) {
    const buffer = await audio.decodeBufferTimeSlice(
      synEvent.startTime,
      synEvent.endTime,
      audio.store.uint8Buffer.buffer
    )
    if (buffer !== undefined) {
      requestAnimationFrame(() => {
        eventStore.playingEvent = synEvent
        audio.playBuffer(buffer, audio.store.playbackRate)
          .addEventListener('ended', (e: Event) => {
            eventStore.playingEvent = null
          })
      })
    }
  }
}

export async function playEvent(event: LocalTranscriptEvent) {
  playEvents([ event])
}

function getSpeakersFromEvents(es: LocalTranscriptEvent[]): string[] {
  return _(es)
    .flatMap((e, i) => _(e.speakerEvents).map((v, k) => k).value())
    .uniq()
    .value()
}

function getEventsByIds(ids: number[]): LocalTranscriptEvent[] {
  return _(eventStore.selectedEventIds)
    .map((id) => eventStore.events[findSegmentById(id)])
    .compact()
    .sortBy(e => e.startTime)
    .value()
}

function replaceEvents(oldEvents: LocalTranscriptEvent[], newEvents: LocalTranscriptEvent[]) {
  const startIndex = findSegmentById(oldEvents[0].eventId)
  const numDeletions = oldEvents.length
  eventStore.events.splice(startIndex, numDeletions, ...newEvents)
}

export function joinEvents(eventIds: number[]): LocalTranscriptEvent {
  const events = getEventsByIds(eventIds)
  const speakerIds = getSpeakersFromEvents(events)
  const joinedEvent = {
    startTime: events[0].startTime,
    endTime: events[events.length - 1].endTime,
    eventId: events[0].eventId,
    speakerEvents: speakerIds.reduce((speakerEvents, speakerId) => {
      speakerEvents[speakerId] = {
        speakerEventId: makeEventId(),
        tokens: events.reduce((ts, ev) => {
          if (ev.speakerEvents[speakerId]) {
            return ts = ts.concat(ev.speakerEvents[speakerId].tokens)
          } else {
            return ts
          }
        }, [] as LocalTranscriptToken[])
      }
      return speakerEvents
    }, {} as LocalTranscriptEvent['speakerEvents'])
  }
  history.push({
    type: 'JOIN',
    apply: true,
    events: [
      { ...joinedEvent, editType: 'UPDATE' },
      ..._.tail(events).map((e) => ({ ...e, editType: 'DELETE'} as LocalTranscriptEditEvent))
    ]
  })
  replaceEvents(events, [ joinedEvent ])
  eventStore.selectedEventIds = [ joinedEvent.eventId ]
  return joinedEvent
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

export function selectOrDeselectEvent(e: LocalTranscriptEvent): LocalTranscriptEvent {
  if (isEventSelected(e.eventId)) {
    removeEventsFromSelection([ e ])
  } else {
    addEventsToSelection([ e ])
  }
  return e
}
export function addEventsToSelection(es: LocalTranscriptEvent[]) {
  eventStore.selectedEventIds = eventStore.selectedEventIds.concat(es.map(e => e.eventId))
}

export function removeEventsFromSelection(es: LocalTranscriptEvent[]) {
  const eIds = es.map(e => e.eventId)
  eventStore.selectedEventIds = eventStore.selectedEventIds.filter((eId) => eIds.indexOf(eId) === -1)
}

export function getSelectedEvent(): LocalTranscriptEvent|undefined {
  return _.find(eventStore.events, (e) => e.eventId === eventStore.selectedEventIds[0])
}

export function toTime(time: number): string {
  // seconds to readable time
  return new Date(time * 1000).toISOString().substr(11, 8)
}

export async function saveHistoryToServer() {
  if (history.length > 0 && serverTranscript !== null) {
    const x = historyToServerTranscript(history, serverTranscript, eventStore.events)
    console.log({x})
  }
}
