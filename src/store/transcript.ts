
import _ from 'lodash'
import { saveAs } from 'file-saver'
import audio from '../service/audio'
import {
  clone,
  fileToUint8ArrayAndName
} from '../util'
import settings from '../store/settings'
import { HistoryEventAction } from './history'
import eventBus from '../service/event-bus'

import {
  localTranscriptToServerTranscript,
  localTranscriptToServerSaveRequest,
  serverTranscript,
  serverTranscriptToLocal,
  updateServerTranscriptWithChanges,
  ServerTranscriptSaveResponse,
  ServerTranscriptListItem,
  ServerTranscriptInformants,
  ServerTranscriptTokenTypes,
  ServerTranscript,
  createEmptyTranscript
} from '../service/backend-server'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
  }
}

interface LocalTranscriptTokenTier {
  text: string
  type: number|null
}
type LocalTranscriptSpeakers = ServerTranscriptInformants
type LocalTranscriptTokenTypes = ServerTranscriptTokenTypes

export type TokenTierType = 'text'|'ortho'|'phon'

export interface LocalTranscriptToken {
  id: number
  fragmentOf: number|null
  sentenceId: number|null
  order: number
  tiers: {
    [key in TokenTierType]: LocalTranscriptTokenTier
  }
}

export interface TierFreeText {
  type: 'freeText'
  text: string
}

export interface TierAnnotation {
  type: 'annotation',
  tags: number[]
}

export type LocalTranscriptSpeakerEventTier = TierFreeText|TierAnnotation

export interface LocalTranscriptSpeakerEventTiers {
  [tierId: string]: LocalTranscriptSpeakerEventTier
}

export interface LocalTranscriptEvent {
  eventId: number
  startTime: number
  endTime: number,
  speakerEvents: {
    [speakerId: string]: {
      speakerEventId: number
      tokens: LocalTranscriptToken[]
      speakerEventTiers: LocalTranscriptSpeakerEventTiers
    }
  }
}

export interface LocalTranscriptEditEvent extends LocalTranscriptEvent {
  editType: 'UPDATE'|'DELETE'|'ADD'
}

export interface LocalTranscriptTier {
  type: 'basic'|'token'|'freeText'
  name: string
  show: boolean
}

export type LocalTranscript = LocalTranscriptEvent[]

export const eventStore = {
  events: [] as LocalTranscriptEvent[],
  selectedEventIds: [] as number[],
  selectedSearchResult: null as LocalTranscriptEvent|null,
  searchResults: [] as LocalTranscriptEvent[],
  searchTerm: '',
  playingEvent: null as LocalTranscriptEvent|null,
  isPaused: true as boolean,
  currentTime: 0,
  recentlyOpened: JSON.parse(localStorage.getItem('recentlyOpened') || '[]'),
  metadata: {
    defaultTier: 'text' as TokenTierType,
    speakers: {} as LocalTranscriptSpeakers,
    tokenTypes: {} as LocalTranscriptTokenTypes,
    transcriptName: null as string|null,
    audioUrl: null as string|null,
    tiers: [] as LocalTranscriptTier[]
  },
  audioMetadata: {
    fileSize: 0 as number,
    length: 0 as number
  },
  userState: {
    viewingTranscriptEvent: null as LocalTranscriptEvent|null,
    viewingAudioEvent: null as LocalTranscriptEvent|null
  },
  transcriptDownloadProgress: 0 as number,
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  playAllFrom: null as number|null,
  backEndUrl: localStorage.getItem('backEndUrl') || 'https://dissdb-test.dioe.at',
  audioElement: document.createElement('audio')
}

export function tokenTypeFromToken(token: string) {
  const type = _(settings.tokenTypes).find((tt) => {
    return tt.regex.test(token)
  })
  if (type !== undefined) {
    return type
  } else {
    return {
      name: 'error',
      color: 'red',
      id: -1
    }
  }
}

export function addRecentlyOpened(t: ServerTranscriptListItem): ServerTranscriptListItem[] {
  eventStore.recentlyOpened = _([t])
    .concat(eventStore.recentlyOpened)
    .uniqBy(ts => ts.pk)
    .take(3)
    .value()
  localStorage.setItem(
    'recentlyOpened',
    JSON.stringify(eventStore.recentlyOpened)
  )
  return eventStore.recentlyOpened
}

export async function exportEventAudio(eventIds: number[]) {
  const sortedEvents = sortEvents(getEventsByIds(eventIds))
  const [firstEvent, lastEvent] = [_(sortedEvents).first(), _(sortedEvents).last()]
  console.log({ firstEvent, lastEvent })
  if (firstEvent !== undefined && lastEvent !== undefined) {
    const buffer = await audio.decodeBufferTimeSlice(
      firstEvent.startTime,
      lastEvent.endTime,
      audio.store.uint8Buffer.buffer
    )
    const wav = audio.audioBufferToWav(buffer)
    const blob = new Blob([new Uint8Array(wav)])
    saveAs(
      blob,
      eventStore.metadata.transcriptName
      + '__'
      + toTime(firstEvent.startTime).replace(':', '-')
      + '.wav'
    )
  }
}

export function loadAudioFile(f: File|Uint8Array|null): Promise<HTMLAudioElement> {
  return new Promise(async (resolve, reject) => {
    let audioUrl = ''
    const a = document.createElement('audio')
    if (f instanceof File) {
      const { b, n } = await fileToUint8ArrayAndName(f)
      const blob = new Blob([b], { type: 'audio/ogg' })
      audioUrl = URL.createObjectURL(blob)
      audio.store.uint8Buffer = b
    } else if (f instanceof Uint8Array) {
      const blob = new Blob([ f ], { type: 'audio/ogg' })
      audioUrl = URL.createObjectURL(blob)
      audio.store.uint8Buffer = f
    }
    a.src = audioUrl
    a.addEventListener('durationchange', function listener() {
      a.removeEventListener('durationchange', listener)
      audio.store.isLocalFile = true
      eventStore.audioElement = a
      resolve(a as HTMLAudioElement)
    })
  })
}

export function tokenize(s: string): string[] {
  return s
    .split('.').join(' .')
    .split(', ').join(' , ')
    .split('-').join('_ _')
    .split('? ').join(' ? ')
    .split(' ')
    .filter(t => t !== '')
}

export function selectSearchResult(e: LocalTranscriptEvent) {
  eventStore.selectedSearchResult  = e
  scrollToAudioEvent(e)
  scrollToTranscriptEvent(e)
  selectEvent(e)
}

export function scrollToAudioEvent(e: LocalTranscriptEvent) {
  eventStore.userState.viewingAudioEvent = e
  eventBus.$emit('scrollToAudioEvent', e)
}

export function scrollToTranscriptEvent(
  e: LocalTranscriptEvent, opts?: { animate: boolean, focusSpeaker: number|null }
) {
  eventStore.userState.viewingTranscriptEvent = e
  eventBus.$emit('scrollToTranscriptEvent', e, {
    animate: true,
    focusSpeaker: null,
    ...opts
  })
}

export function makeEventId() {
  return Number(_.uniqueId()) * -1
}

export function makeTokenId() {
  return Number(_.uniqueId()) * -1
}

export function makeTierId() {
  return Number(_.uniqueId()) * -1
}

export function sortEvents(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
  return _.sortBy(es, (e) => e.startTime)
}

export function findEventIndexById(id: number) {
  return _(eventStore.events).findIndex(e => e.eventId === id)
}

export function sentencesFromEvent(event: LocalTranscriptEvent, tier: TokenTierType): string[] {
  return _(event.speakerEvents).map(e => {
    return e.tokens.map(t => t.tiers[tier].text).join(' ')
  }).value()
}

const sentenceRules: [(text: string) => boolean] = [
  (text) => !text.includes('  ')
]

export function speakerEventHasErrors(event: LocalTranscriptEvent): boolean {
  const sentences = sentencesFromEvent(event, eventStore.metadata.defaultTier)
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

function hasNextFragmentMarker(event: LocalTranscriptEvent, speakerId: number, tier: TokenTierType): boolean {
  const lastToken = getLastEventToken(event, speakerId)
  if (lastToken !== undefined) {
    return lastToken.tiers[tier].text.endsWith('=')
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

export function updateSpeakerEvent(
  event: LocalTranscriptEvent,
  speakerId: number,
  tokens: LocalTranscriptToken[],
): HistoryEventAction {
  const oldEvent = eventStore.events[findEventIndexById(event.eventId)]
  const isNew = oldEvent.speakerEvents[speakerId] === undefined
  const deletedSpeakerId = tokens.length === 0 ? speakerId : undefined
  const tokenCountDifference = isNew ? tokens.length : tokens.length - oldEvent.speakerEvents[speakerId].tokens.length
  const speakerEvents = _({
      // merge the new speaker
      ...oldEvent.speakerEvents,
      [speakerId] : {
        speakerEventId: event.eventId,
        speakerEventTiers: {},
        tokens
      }
    })
    // remove deleted speaker events
    .reduce((m, e, k, l) => {
      if (Number(k) !== Number(deletedSpeakerId)) {
        m[k] = e
      }
      return m
    }, {} as LocalTranscriptEvent['speakerEvents'])
  const newEvent = clone({...oldEvent, speakerEvents})
  const index = findEventIndexById(event.eventId)
  // UPDATE EVENT
  eventStore.events.splice(index, 1, newEvent)
  // if it has a fragment marker ("="),
  // mark the first token in the next
  // speaker event as a fragment_of
  if (hasNextFragmentMarker(newEvent, speakerId, eventStore.metadata.defaultTier)) {
    setFirstTokenFragmentOf(index + 1, speakerId, getLastEventToken(newEvent, speakerId))
  }
  // update token order if the length has changed
  if (tokenCountDifference !== 0) {
    eventStore.events = updateSpeakerTokenOrderStartingAt(speakerId, index, tokenCountDifference)
  }
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'CHANGE_TOKENS',
    before: [ clone(oldEvent) ],
    after: [ clone(newEvent) ]
  }
}

export function resizeEvents(...es: LocalTranscriptEvent[]): HistoryEventAction {
  const oldEs = clone(es
    .map(e => findEventIndexById(e.eventId))
    .map(i => eventStore.events[i])
  )
  replaceEvents(oldEs, es)
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'RESIZE',
    before: oldEs,
    after: clone(es)
  }
}

export function resizeEvent(id: number, startTime: number, endTime: number): HistoryEventAction {
  const i = findEventIndexById(id)
  return resizeEvents({...eventStore.events[i], startTime, endTime})
  // const i = findEventIndexById(id)
  // const before = clone(eventStore.events[i])
  // console.log('params', startTime, endTime)
  // console.log('before', before.startTime, before.endTime, before)
  // eventStore.events[i].startTime = startTime
  // eventStore.events[i].endTime = endTime
  // const after = clone(eventStore.events[i])
  // console.log('after', after.startTime, after.endTime, after)
  // return {
  //   id: _.uniqueId(),
  //   apply: true,
  //   type: 'RESIZE',
  //   before: [ before ],
  //   after: [ after ]
  // }
}

export function insertEvent(e: LocalTranscriptEvent): HistoryEventAction {
  const nextEvent = findNextEventAt(e.startTime)
  if (nextEvent !== undefined) {
    const i = findEventIndexById(nextEvent.eventId)
    eventStore.events.splice(i, 0, e)
  } else {
    eventStore.events.push(e)
  }
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'INSERT',
    before: [],
    after: [ clone(e) ]
  }
}

export function addEvent(atTime: number): HistoryEventAction {
  const nextEvent = findNextEventAt(atTime)
  const newEvent: LocalTranscriptEvent = {
    startTime: atTime,
    endTime: atTime + 1,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  if (nextEvent !== undefined) {
    const i = findEventIndexById(nextEvent.eventId)
    // console.log({i})
    eventStore.events.splice(i, 0, newEvent)
  } else {
    eventStore.events.push(newEvent)
  }
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'ADD',
    before: [],
    after: [ clone(newEvent) ]
  }
}

export function deleteSelectedEvents(): HistoryEventAction {
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'DELETE',
    before: _(eventStore.selectedEventIds).map(deleteEventById).flatMap(a => a.before).value(),
    after: []
  }
}

export function deleteEvent(event: LocalTranscriptEvent): HistoryEventAction {
  const i = findEventIndexById(event.eventId)
  const e = clone(eventStore.events[i])
  eventStore.events.splice(i, 1)
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'DELETE',
    before: [ e ],
    after: []
  }
}

export function splitEvent(event: LocalTranscriptEvent, splitAt: number): HistoryEventAction {
  const i = findEventIndexById(event.eventId)
  const before = clone(eventStore.events[i])
  const leftEvent: LocalTranscriptEvent = {
    ...event,
    endTime: event.startTime + splitAt
  }
  const rightEvent: LocalTranscriptEvent = {
    startTime: event.startTime + splitAt,
    endTime: event.endTime,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  eventStore.events.splice(i, 1, leftEvent, rightEvent)
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'SPLIT',
    before: [ before ],
    after: [ clone(leftEvent), clone(rightEvent) ]
  }
}

export function findNextEventAt(seconds: number, events = eventStore.events): LocalTranscriptEvent|undefined {
  return _(events).find((e) => e.startTime >= seconds)
}

export function findPreviousEventAt(seconds: number, events = eventStore.events): LocalTranscriptEvent|undefined {
  const i = _(events).findLastIndex((e) => e.startTime < seconds)
  return events[i - 1]
}

export function findEventAt(seconds: number): LocalTranscriptEvent|undefined {
  return _(eventStore.events).find((e) => e.startTime <= seconds && e.endTime >= seconds)
}

export function findEventIndexAt(seconds: number): number {
  return _(eventStore.events).findIndex((e) => e.startTime <= seconds && e.endTime >= seconds)
}

export function findPreviousSpeakerEvent(speaker: number, eventId: number): number|undefined {
  const i = findEventIndexById(eventId)
  return _(eventStore.events).findLastIndex((e, eventIndex) => eventIndex < i && e.speakerEvents[speaker] !== undefined)
}

export function deleteEventById(id: number) {
  const i = findEventIndexById(id)
  return deleteEvent(eventStore.events[i])
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

export function pause() {
  eventStore.playAllFrom = null
  eventStore.playingEvent = null
  eventBus.$emit('pauseAudio', eventStore.currentTime)
  eventStore.audioElement.pause()
  audio.pauseCurrentBuffer()
  eventStore.isPaused = true
}

function emitUpdateTimeUntilPaused(t: number, maxT?: number) {
  const startTime = performance.now()
  eventStore.currentTime = t
  eventBus.$emit('updateTime', t)
  let currentlyPlayingEventId: number|null = null
  const step = (now: number) => {
    const elapsed = (now - startTime) / 1000 * settings.playbackSpeed
    // more than 16 ms have passed
    if (t + elapsed - eventStore.currentTime >= .016) {
      // update and emit.
      eventStore.currentTime = t + elapsed
      eventBus.$emit('updateTime', eventStore.currentTime)
    }
    // paused or over max t.
    if (eventStore.isPaused === true || (maxT !== undefined && eventStore.currentTime >= maxT)) {
      // stop emitting.
      return false
    } else {
      // sync scroll if locked.
      if (settings.lockScroll && settings.lockPlayHead) {
        const e = findEventAt(eventStore.currentTime)
        if (e !== undefined && e.eventId !== currentlyPlayingEventId) {
          currentlyPlayingEventId = e.eventId
          scrollToTranscriptEvent(e, { animate: false, focusSpeaker: null })
        }
      }
      // continue emitting
      return requestAnimationFrame(step)
    }
  }
  return step(performance.now())
}

export function playAllFrom(t: number) {
  pause()
  eventStore.playAllFrom = t
  eventStore.audioElement.currentTime = t
  eventStore.audioElement.play()
  eventStore.isPaused = false
  eventBus.$emit('playAudio', t)
  emitUpdateTimeUntilPaused(t)
}

export function scrubAudio(t: number) {
  eventStore.currentTime = t
  eventBus.$emit('scrubAudio', t)
}

export async function playEvents(events: LocalTranscriptEvent[]) {
  pause()
  const sortedEvents = sortEvents(events)
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
        eventStore.isPaused = false
        eventBus.$emit('playEvents', events)
        audio
          .playBuffer(buffer, settings.playbackSpeed)
          .addEventListener('ended', () => pause)
        emitUpdateTimeUntilPaused(synEvent.startTime, synEvent.endTime)
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
    .map((id) => eventStore.events[findEventIndexById(id)])
    .compact()
    .sortBy(e => e.startTime)
    .value()
}

export function replaceEvents(oldEvents: LocalTranscriptEvent[], newEvents: LocalTranscriptEvent[]) {
  oldEvents.forEach(deleteEvent)
  newEvents.forEach(insertEvent)
}

export function joinEvents(eventIds: number[]): HistoryEventAction {
  const events = getEventsByIds(eventIds)
  const speakerIds = getSpeakersFromEvents(events)
  const joinedEvent = {
    startTime: events[0].startTime,
    endTime: events[events.length - 1].endTime,
    eventId: events[0].eventId,
    speakerEvents: speakerIds.reduce((speakerEvents, speakerId) => {
      speakerEvents[speakerId] = {
        speakerEventTiers: _(events).reduce((ts, ev, tn) => {
          if (ev.speakerEvents[speakerId]) {
            ts = { ...ts,  ...ev.speakerEvents[speakerId].speakerEventTiers}
          }
          return ts
        }, {} as LocalTranscriptSpeakerEventTiers),
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
  replaceEvents(events, [ joinedEvent ])
  eventStore.selectedEventIds = [ joinedEvent.eventId ]
  return {
    id: _.uniqueId(),
    time: new Date(),
    type: 'JOIN',
    apply: true,
    before: clone(events),
    after: [ clone(joinedEvent) ]
  }
}

export function isEventSelected(id: number) {
  return eventStore.selectedEventIds.indexOf(id) > -1
}

export function isMostRecentSelection(id: number) {
  return _.last(eventStore.selectedEventIds) === id
}

export function selectNextEvent(increase: 1|-1 = 1): LocalTranscriptEvent|undefined {
  if (eventStore.selectedEventIds.length > 0) {
    const i = findEventIndexById(eventStore.selectedEventIds[0])
    const e = eventStore.events[i + increase]
    return selectEvent(e)[0]
  } else {
    return eventStore.events[0]
  }
}

export function selectPreviousEvent(): LocalTranscriptEvent|undefined {
  return selectNextEvent(-1)
}

export function deselectEvents() {
  eventStore.selectedEventIds = []
}

export function selectEvents(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
  eventStore.selectedEventIds = es.map(e => e.eventId)
  return es
}

export function selectEvent(e: LocalTranscriptEvent): LocalTranscriptEvent[] {
  return selectEvents([ e ])
}

export function collectEventsByTimeRange(start: number, end: number): LocalTranscriptEvent[] {
  return eventStore.events.filter((e) => {
    return e.startTime >= start && e.endTime <= end
  })
}

export function selectEventRange(e: LocalTranscriptEvent) {
  const anchorEvent = getSelectedEvent()
  if (anchorEvent === undefined) {
    selectEvent(e)
  } else {
    eventStore.selectedEventIds =
      // collect them, from left to right.
      _(collectEventsByTimeRange(
        Math.min(e.startTime, anchorEvent.startTime),
        Math.max(e.endTime, anchorEvent.endTime)
      ))
      // move the anchor back to the beginning
      // of the stack.
      .sortBy(ev => ev.eventId === anchorEvent.eventId ? 0 : 1)
      .map(ev => ev.eventId)
      .value()
  }
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

export function getSelectedEvents(): LocalTranscriptEvent[] {
  return getEventsByIds(eventStore.selectedEventIds)
}

export function getSelectedEvent(): LocalTranscriptEvent|undefined {
  return _.find(eventStore.events, (e) => e.eventId === eventStore.selectedEventIds[0])
}

export function toTime(time: number, decimalPlaces = 0): string {
  // seconds to readable time
  return new Date(time * 1000).toISOString().substr(11, 8 + (decimalPlaces > 0 ? decimalPlaces + 1 : 0))
}

export async function convertToServerTranscript(es: LocalTranscriptEvent[]): Promise<ServerTranscript|null> {
  if (serverTranscript !== null) {
    return localTranscriptToServerTranscript(serverTranscript, es)
  } else {
    return null
  }
}

export async function saveChangesToServer() {
  if (serverTranscript !== null) {
    const t = await localTranscriptToServerSaveRequest(serverTranscript, eventStore.events)
    const tid = await (async () => {
      if (t.aTranskript !== undefined) {
        if (t.aTranskript.pk > -1) {
          return t.aTranskript.pk
        } else {
          const { transcript_id } = await createEmptyTranscript(
            t.aEinzelErhebung!.pk,
            t.aTranskript!.n,
            t.aTranskript!.default_tier!
          )
          return transcript_id
        }
      }
    })()
    if (tid !== undefined) {
      const serverChanges = await (
        await fetch(`${ eventStore.backEndUrl }/routes/transcript/save/${ tid }`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(t),
      })).json() as ServerTranscriptSaveResponse
      console.log({
        localChanges: _(t.aTokens).toArray().value(),
        localDeletionsAndInserts: _(t.aTokens).toArray().filter((token) => {
          return token.status === 'delete' || token.status === 'insert'
        }).value(),
        serverDeletionsAndErrorsAndInserts: _(serverChanges.aTokens).toArray().filter((token) => {
          return token.newStatus === 'deleted' || token.newStatus === 'inserted' || token.newStatus === 'error'
        }).value(),
        groupedErrors: _(serverChanges.aTokens)
          .toArray()
          .filter(token => token.error !== undefined)
          .groupBy(token => token.error)
          .value()
      })
      eventStore.events = serverTranscriptToLocal(updateServerTranscriptWithChanges(serverChanges))
    } else {
      throw new Error('transcript id is undefined')
    }
  }
}
