
import * as _ from 'lodash'
import audio from '../service/audio'
import { clone, isEqualDeep  } from '../util'
import {
  localTranscriptToServerTranscript,
  serverTranscript,
  serverTranscriptToLocal,
  updateServerTranscriptWithChanges
} from '../service/data-backend/server-backend'

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

interface SaveResponseEntity {
  status: 'update'|'delete'|'insert'
  newStatus: 'updated'|'deleted'|'inserted'
  newPk?: number
}

export interface ServerTokenSaveResponse extends ServerToken, SaveResponseEntity {}
export interface ServerEventSaveResponse extends ServerEvent, SaveResponseEntity {}

export interface ServerTranscriptSaveResponse extends ServerTranscript {
  aTokens: {
    [token_id: string]: ServerTokenSaveResponse
  }
  aEvents: ServerEventSaveResponse[]
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
  aTokenSets?: {
    [setId: number]: {
      ivt: number // starting at token id (von)
      ibt: number // ending at token id (bis)
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
  sentenceId: number|null
  order: number
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
  transcriptDownloadProgress: 0 as number,
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  playAllFrom: null as number|null,
  backEndUrl: localStorage.getItem('backEndUrl') || 'https://dissdb.dioe.at'
}
;
(window as any)._eventStore = eventStore

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

function updateSpeakerTokenOrderStartingAt(speakerId: number, startAtIndex = 0, add: number) {
  return _(eventStore.events).map((e, eventIndex) => {
    if (eventIndex > startAtIndex) {
      if (e.speakerEvents[speakerId] !== undefined) {
        const tokens = e.speakerEvents[speakerId].tokens
        if (tokens.length > 0) {
          return {
            ...e,
            speakerEvents: {
              ...e.speakerEvents,
              [speakerId]: {
                ...e.speakerEvents[speakerId],
                tokens: tokens.map((t) => {
                  return { ...t, order: t.order + add }
                })
              }
            }
          }
        } else {
          return e
        }
      } else {
        return e
      }
    } else {
      return e
    }
  }).value()
}

function getLastEventToken(event: LocalTranscriptEvent, speakerId: number): LocalTranscriptToken|undefined {
  const speakerEvent = event.speakerEvents[speakerId]
  if (speakerEvent !== undefined && speakerEvent.tokens.length > 0) {
    return _(speakerEvent.tokens).last()
  } else {
    return undefined
  }
}

function hasNextFragmentMarker(event: LocalTranscriptEvent, speakerId: number): boolean {
  const lastToken = getLastEventToken(event, speakerId)
  if (lastToken !== undefined) {
    return lastToken.tiers.default.text.endsWith('=')
  } else {
    return false
  }
}

function setFirstTokenFragmentOf(
  eventIndex: number,
  speakerId: number,
  lastEventToken?: LocalTranscriptToken
): boolean {
  if (lastEventToken === undefined) {
    return false
  } else {
    const event = eventStore.events[eventIndex]
    if (event !== undefined) {
      const speakerEvent = event.speakerEvents[speakerId]
      if (speakerEvent !== undefined) {
        const firstToken = eventStore.events[eventIndex].speakerEvents[speakerId].tokens[0]
        if (firstToken !== undefined) {
          eventStore.events[eventIndex].speakerEvents[speakerId].tokens[0].fragmentOf = lastEventToken.id
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else {
      return true
    }
  }
}

export function updateSpeakerTokens(
  event: LocalTranscriptEvent,
  speakerId: number,
  tokens: LocalTranscriptToken[],
) {
  const oldEvent = eventStore.events[findSegmentById(event.eventId)]
  const isNew = oldEvent.speakerEvents[speakerId] === undefined
  const deletedSpeakerId = tokens.length === 0 ? speakerId : undefined
  const tokenCountDifference = isNew ? tokens.length : tokens.length - oldEvent.speakerEvents[speakerId].tokens.length
  const speakerEvents = _({
    // MERGE-IN THE NEW SPEAKER
      ...oldEvent.speakerEvents,
      [speakerId] : {
        speakerEventId: event.eventId,
        tokens
      }
    })
    // REMOVE DELETED SPEAKER EVENTS
    .reduce((m, e, k, l) => {
      if (Number(k) !== Number(deletedSpeakerId)) {
        m[k] = e
      }
      return m
    }, {} as LocalTranscriptEvent['speakerEvents'])
  const newEvent = clone({...oldEvent, speakerEvents})
  const index = findSegmentById(event.eventId)
  // UPDATE EVENT
  eventStore.events.splice(index, 1, newEvent)
  // IF IT HAS A FRAGMENT MARKER ("="),
  // MARK THE FIRST TOKEN IN THE NEXT
  // SPEAKER EVENT AS A FRAGMENT_OF
  if (hasNextFragmentMarker(newEvent, speakerId)) {
    setFirstTokenFragmentOf(index + 1, speakerId, getLastEventToken(newEvent, speakerId))
  }
  // UPDATE TOKEN ORDER IF THE LENGTH CHANGED
  if (tokenCountDifference !== 0) {
    eventStore.events = updateSpeakerTokenOrderStartingAt(speakerId, index, tokenCountDifference)
  }
  // ADD HISTORY EVENT
  history.push({
    apply: true,
    type: 'CHANGE_TOKENS',
    events: [{
      ...clone(newEvent),
      editType: 'UPDATE'
    }]
  })
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
  const nextEvent = findNextSegmentAt(atTime)
  console.log({nextEvent})
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
  if (nextEvent !== undefined) {
    const i = findSegmentById(nextEvent.eventId)
    console.log({i})
    eventStore.events.splice(i, 0, newEvent)
  } else {
    eventStore.events.push(newEvent)
  }
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

export function findPreviousSpeakerEvent(speaker: number, eventId: number): number|undefined {
  const i = findSegmentById(eventId)
  return _(eventStore.events).findLastIndex((e, eventIndex) => eventIndex < i && e.speakerEvents[speaker] !== undefined)
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

export function toTime(time: number, decimalPlaces = 0): string {
  // seconds to readable time
  return new Date(time * 1000).toISOString().substr(11, 8 + (decimalPlaces > 0 ? decimalPlaces + 1 : 0))
}

export async function saveChangesToServer() {
  if (serverTranscript !== null) {
    const x = await localTranscriptToServerTranscript(serverTranscript, eventStore.events)
    console.log({x})
    const serverChanges = await (
      await fetch(`${ eventStore.backEndUrl }/routes/transcript/save/${ (x.aTranskript as any).pk }`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(x),
    })).json()
    console.log({x, serverChanges})
    eventStore.events = serverTranscriptToLocal(updateServerTranscriptWithChanges(serverChanges))
  }
}
