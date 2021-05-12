
import _ from 'lodash'
import { saveAs } from 'file-saver'
import audio from '../service/audio'
import {
  clone,
  fileToUint8ArrayAndName
} from '../util'
import settings from '../store/settings'
import presets from '../presets'
import { HistoryEventAction } from './history'
import eventBus from '../service/event-bus'
import { collectTokensViaOffsets } from '../service/copy-paste'

import {
  ServerTranscriptInformant,
  ServerTranscriptListItem,
  ServerTranscriptTokenTypes
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

export interface LocalTranscriptSpeaker extends ServerTranscriptInformant {
  searchInSpeaker: boolean
}

export interface LocalTranscriptSpeakers {
  [speakerId: number]: LocalTranscriptSpeaker
}

export type LocalTranscriptTokenTypes = ServerTranscriptTokenTypes

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
  id: string
  type: 'freeText'
  text: string
}

export type LocalTranscriptSpeakerEventTier = TierFreeText

export interface LocalTranscriptSpeakerEventTiers {
  [tierId: string]: LocalTranscriptSpeakerEventTier
}

export interface LocalTranscriptSpeakerEvent {
  speakerEventId: number
  tokens: LocalTranscriptToken[]
  speakerEventTiers: LocalTranscriptSpeakerEventTiers
}

export interface LocalTranscriptEvent {
  eventId: number
  startTime: number
  endTime: number,
  speakerEvents: {
    [speakerId: string]: LocalTranscriptSpeakerEvent
  }
}

export interface LocalTranscriptEditEvent extends LocalTranscriptEvent {
  editType: 'UPDATE'|'DELETE'|'ADD'
}

export interface SearchResult {
  resultId: number
  offset: number
  offsetEnd: number
  text: string
  speakerId: string
  tierId: string
  event: LocalTranscriptEvent
}

interface LocalTranscriptTierBasic {
  name: string
  searchInTier: boolean
  show: boolean
}

interface LocalTranscriptTierToken extends LocalTranscriptTierBasic {
  type: 'token'
  id: TokenTierType
}

interface LocalTranscriptTierEvent extends LocalTranscriptTierBasic {
  type: 'freeText'
  id: string
}

export type LocalTranscriptTier = LocalTranscriptTierEvent|LocalTranscriptTierToken

export type LocalTranscript = LocalTranscriptEvent[]

export const eventStore = {

  transcripts: null as ServerTranscriptListItem[]|null,

  events: [] as LocalTranscriptEvent[],
  selectedEventIds: [] as number[],

  selectedSearchResult: null as SearchResult|null,
  searchResults: [] as SearchResult[],
  searchTerm: '',
  inspectedEvent: null as LocalTranscriptEvent|null,

  isPaused: true as boolean,
  currentTime: 0,
  lockedTokens: [] as number[],
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
    editingTranscriptEvent: null as LocalTranscriptEvent|null,
    viewingAudioEvent: null as LocalTranscriptEvent|null,
    showSpeakerTierEditModal: false,
    timeSpanSelection: {
      start: null as null|number,
      end: null as null|number
    }
  },
  transcriptDownloadProgress: 0 as number,
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  playAllFrom: null as number|null,
  audioElement: document.createElement('audio')
}

export function tokenTypeFromToken(token: string) {
  const type = _(presets[settings.projectPreset].tokenTypes).find((tt) => {
    return tt.type === 'single' && tt.regex.test(token.replace('=', ''))
  })
  if (type !== undefined) {
    return type
  } else if (token === settings.placeholderToken) {
    return {
      name: 'placeholder',
      color: 'grey',
      id: -2
    }
  } else {
    return {
      name: 'error',
      color: 'red',
      id: -1
    }
  }
}

export function timeSpanSelectionIsEmpty() {
  return eventStore.userState.timeSpanSelection.start === null &&
    eventStore.userState.timeSpanSelection.end === null
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

export function loadAudioFromUrl(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const a = document.createElement('audio')
    a.src = url
    a.addEventListener('durationchange', function listener() {
      a.removeEventListener('durationchange', listener)
      audio.store.isLocalFile = false
      eventStore.audioElement = a
      eventStore.audioMetadata.length = a.duration
      resolve(a)
    })
  })
}

export function loadAudioFromFile(f: File|Uint8Array): Promise<HTMLAudioElement> {
  return new Promise(async (resolve, reject) => {
    let audioUrl = ''
    const a = document.createElement('audio')
    if (f instanceof File) {
      const { b } = await fileToUint8ArrayAndName(f)
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
      eventStore.audioMetadata.length = a.duration
      eventStore.audioMetadata.fileSize = audio.store.uint8Buffer.byteLength
      resolve(a)
    })
  })
}

export function isTokenTier(tier: string): tier is TokenTierType {
  return ['ortho', 'text', 'phon'].indexOf(tier) > -1
}

export function speakerEventHasTier(e: LocalTranscriptEvent, speaker: string, tier: string): boolean {
  return isTokenTier(tier) ||
    e.speakerEvents[speaker] !== undefined &&
    e.speakerEvents[speaker].speakerEventTiers[tier] !== undefined
}

export function eventHasSpeaker(e: LocalTranscriptEvent, speaker: string): boolean {
  return e.speakerEvents[speaker] !== undefined
}

export function getTextFromTier(e: LocalTranscriptEvent, tier: string, speaker: string): string {
  if (eventHasSpeaker(e, speaker)) {
    if (isTokenTier(tier)) {
      return getTextFromTokens(e.speakerEvents[speaker].tokens, tier)
    } else if (speakerEventHasTier(e, speaker, tier)) {
      return e.speakerEvents[speaker].speakerEventTiers[tier].text
    } else {
      return ''
    }
  } else {
    return ''
  }
}

export function getTextFromTokens(ts: LocalTranscriptToken[], defaultTier: TokenTierType): string {
  return ts.map(t => t.tiers[defaultTier].text).join(' ')
}

export function getTokenIndexByCharacterOffset(tokens: LocalTranscriptToken[], offset: number): number {
  let currentStart = 0
  return tokens.findIndex(e => {
    const currentEnd = currentStart + e.tiers[eventStore.metadata.defaultTier].text.length
    if (offset >= currentStart && offset <= currentEnd) {
      return true
    } else {
      currentStart = currentEnd + 1
      return false
    }
  })
}

export function selectSearchResult(r: SearchResult) {
  eventStore.selectedSearchResult = r
  scrollToAudioEvent(r.event)
  scrollToTranscriptEvent(r.event)
  selectEvent(r.event)
}

export function scrollToAudioTime(t: number) {
  eventBus.$emit('scrollToAudioTime', t)
}

export function scrollToAudioEvent(e: LocalTranscriptEvent) {
  eventStore.userState.viewingAudioEvent = e
  eventBus.$emit('scrollToAudioEvent', e)
}

export function scrollToTranscriptEvent(
  e: LocalTranscriptEvent, opts?: {
    animate: boolean,
    focusSpeaker: string|null,
    focusTier: string|null,
    focusRight: boolean
  }
) {
  eventStore.userState.viewingTranscriptEvent = e
  eventBus.$emit('scrollToTranscriptEvent', e, {
    animate: true,
    focusSpeaker: null,
    focusTier: eventStore.metadata.defaultTier,
    focusRight: false,
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

export function makeEventTierId() {
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

export function getFirstTokenOrder(e: LocalTranscriptEvent, speakerId: string): number {
  const speakerEvent = e.speakerEvents[speakerId]
  if (speakerEvent) {
    const firstToken = e.speakerEvents[speakerId].tokens[0]
    if (firstToken) {
      return firstToken.order
    } else {
      return 0
    }
  } else {
    const i = findPreviousSpeakerEvent(speakerId, e.eventId)
    if (i !== -1) {
      const prevLastToken = _(eventStore.events[i].speakerEvents[speakerId].tokens).last()
      if (prevLastToken) {
        return prevLastToken.order + 1
      } else {
        return 0
      }
    } else {
      return 0
    }
  }
}

function getLastEventToken(event: LocalTranscriptEvent|undefined, speakerId: number): LocalTranscriptToken|undefined {
  if (event === undefined) {
    return undefined
  } else {
    const speakerEvent = event.speakerEvents[speakerId]
    if (speakerEvent !== undefined && speakerEvent.tokens.length > 0) {
      return _(speakerEvent.tokens).last()
    } else {
      return undefined
    }
  }
}

function hasNextFragmentMarker(event: LocalTranscriptEvent|undefined, speakerId: number, tier: TokenTierType): boolean {
  if (event === undefined) {
    return false
  } else {
    const lastToken = getLastEventToken(event, speakerId)
    if (lastToken !== undefined) {
      return lastToken.tiers[tier].text.endsWith('=')
    } else {
      return false
    }
  }
}

function setFirstTokenFragmentOf(
  eventIndex: number,
  speakerId: number,
  lastEventToken?: LocalTranscriptToken
) {
  const event = eventStore.events[eventIndex]
  // console.log('next event', event)
  if (event !== undefined) {
    const speakerEvent = event.speakerEvents[speakerId]
    if (speakerEvent !== undefined) {
      const firstToken = eventStore.events[eventIndex].speakerEvents[speakerId].tokens[0]
      if (firstToken !== undefined) {
        eventStore.events[eventIndex].speakerEvents[speakerId].tokens[0].fragmentOf = lastEventToken
          ? lastEventToken.id
          : null
      }
    }
  }
}

export function updateSpeakerEvents(
  es: LocalTranscriptEvent[],
  speakerId: number,
  eTokens: LocalTranscriptToken[][]
): HistoryEventAction {
  const newEs = es.map((e, i) => ({
    ...e,
    speakerEvents: {
      [speakerId]: {
        ...e.speakerEvents[speakerId],
        tokens: eTokens[i]
      }
    }
  }))
  const updateHistoryActions = newEs.map((e, i) => updateSpeakerEvent(e, speakerId))
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'CHANGE_TOKENS',
    before: _(updateHistoryActions).map(hea => clone(hea.before)).flatten().value(),
    after: _(updateHistoryActions).map(hea => clone(hea.after)).flatten().value()
  }
}

export function hasEventTiers(se: LocalTranscriptSpeakerEvent): boolean {
  // tslint:disable-next-line:max-line-length
  return !_.isEmpty(se.speakerEventTiers) && _.some(se.speakerEventTiers, (set) => set.text !== undefined && set.text.trim() !== '' )
}

export function hasTokens(se: LocalTranscriptSpeakerEvent): boolean {
  return se.tokens.length > 0 && se.tokens.map(t => t.tiers[eventStore.metadata.defaultTier].text).join('').trim() !== ''
}

export function updateSpeakerEvent(
  event: LocalTranscriptEvent,
  speakerId: number
): HistoryEventAction {
  const tokens = event.speakerEvents[speakerId].tokens
  const eventIndex = findEventIndexById(event.eventId)
  const oldEvent = eventStore.events[eventIndex] || {}
  // tslint:disable-next-line:max-line-length
  const deletedSpeakerId = !hasTokens(event.speakerEvents[speakerId]) && !hasEventTiers(event.speakerEvents[speakerId]) ? speakerId : undefined
  const speakerEvents = _({
    // merge the new speaker
    ...oldEvent.speakerEvents || undefined,
    [ speakerId ]: {
      speakerEventId: event.eventId,
      speakerEventTiers: event.speakerEvents[speakerId].speakerEventTiers || {},
      // update order, from 0 to token length
      tokens: tokens.map((t, i) => ({ ...t, order: i }))
    }
  // remove deleted speaker events
  }).reduce((m, e, k) => {
    if (Number(k) !== Number(deletedSpeakerId)) {
      m[k] = e
    }
    return m
  }, {} as LocalTranscriptEvent['speakerEvents'])

  // create the event
  const newEvent = clone({ ...oldEvent, speakerEvents })

  console.log({ newEvent })

  // if it has a fragment marker ("="),
  // mark the first token in the next
  // speaker event as a fragment_of
  if (hasNextFragmentMarker(newEvent, speakerId, eventStore.metadata.defaultTier)) {
    setFirstTokenFragmentOf(eventIndex + 1, speakerId, getLastEventToken(newEvent, speakerId))
  // unset, if it doesn’t
  } else {
    setFirstTokenFragmentOf(eventIndex + 1, speakerId, undefined)
  }

  // UPDATE EVENT
  eventStore.events.splice(eventIndex, 1, newEvent)
  // if the last token in the previous event
  // has a fragment marker (=), set fragment of here.
  if (hasNextFragmentMarker(getPreviousEvent(event.eventId), speakerId, eventStore.metadata.defaultTier)) {
    const t = getLastEventToken(getPreviousEvent(event.eventId), speakerId)
    if (t !== undefined) {
      setFirstTokenFragmentOf(eventIndex, speakerId, t)
    }
  // unset, if it doesn’t
  } else {
    setFirstTokenFragmentOf(eventIndex, speakerId, undefined)
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

export function findEventOverlaps(e: LocalTranscriptEvent, events = eventStore.events): LocalTranscriptEvent[][] {
  const left: LocalTranscriptEvent[] = []
  const middle: LocalTranscriptEvent[] = []
  const right: LocalTranscriptEvent[] = []
  events.forEach(ev => {
    if (ev.eventId !== e.eventId) {
      // left side overlapped
      if (ev.startTime <= e.startTime && ev.endTime > e.startTime && ev.endTime <= e.endTime) {
        left.push(ev)
      } else if (ev.startTime >= e.startTime && ev.endTime <= e.endTime) {
        // fully overlapped
        middle.push(ev)
      } else if (ev.startTime < e.endTime && ev.startTime >= e.startTime && ev.endTime > e.endTime) {
        // right side overlapped
        right.push(ev)
      }
    }
  })
  return [ left, middle, right ]
}

export function isEventDockedToEvent(...es: LocalTranscriptEvent[]): boolean {
  return sortEvents(es).every((e, i, l) => {
    return i === 0 || e.startTime - l[ i - 1].endTime <= settings.eventDockingInterval
  })
}

export function moveEventEndTime(e: LocalTranscriptEvent, by: number): HistoryEventAction {
  // create future event and find next.
  const newEvent = { ...e, endTime: e.endTime + by }
  const nextEvent = findNextEventAt(e.endTime)
  console.log({ nextEvent, isEventDockedToEvent: nextEvent && isEventDockedToEvent(e, nextEvent) })
  // there is a next event and it’s docked to
  // either the current event or the future event
  if (
    nextEvent !== undefined && (
      isEventDockedToEvent(newEvent, nextEvent) ||
      isEventDockedToEvent(e, nextEvent)
    )
  ) {
    const nextEventFutureLength = nextEvent.endTime - newEvent.endTime
    // the next event’s length after the operation will be sufficient
    if (nextEventFutureLength >= settings.minimumEventLength) {
      return resizeEvents(
        { ...newEvent },
        { ...nextEvent, startTime: newEvent.endTime }
      )
    // it won’t be
    } else {
      // resize the previous event to the minimum length, and fit the current one snugly.
      return resizeEvents(
        { ...e, endTime: nextEvent.endTime - settings.minimumEventLength },
        { ...nextEvent, startTime: nextEvent.endTime - settings.minimumEventLength }
      )
    }
  // there is no next event or it’s not docked
  } else {
    // resize just it.
    return resizeEvents(newEvent)
  }
}

export function moveEventStartTime(e: LocalTranscriptEvent, by: number): HistoryEventAction {
  // same as above but in the other direction and with the previous event.
  const newEvent = { ...e, startTime: e.startTime + by }
  const previousEvent = findPreviousEventAt(e.endTime)
  console.log({ previousEvent, isEventDockedToEvent: previousEvent && isEventDockedToEvent(e, previousEvent) })
  if (
    previousEvent !== undefined && (
      isEventDockedToEvent(newEvent, previousEvent) ||
      isEventDockedToEvent(e, previousEvent)
    )
  ) {
    const previousEventFutureLength = newEvent.startTime - previousEvent.startTime
    if (previousEventFutureLength >= settings.minimumEventLength) {
      return resizeEvents(
        { ...previousEvent, endTime: newEvent.startTime },
        { ...newEvent }
      )
    } else {
      return resizeEvents(
        { ...previousEvent, endTime: previousEvent.startTime + settings.minimumEventLength },
        { ...e, startTime: previousEvent.startTime + settings.minimumEventLength }
      )
    }
  } else {
    return resizeEvents(newEvent)
  }
}

export function resizeEvent(id: number, startTime: number, endTime: number): HistoryEventAction {
  const i = findEventIndexById(id)
  return resizeEvents({ ...eventStore.events[i], startTime, endTime })
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

export function prependEmptyEventAt(t: number): HistoryEventAction|undefined {
  const eventAt = findEventAt(t)
  // can’t insert event when theres already one there, so just select it.
  if (eventAt !== undefined) {
    selectEvent(eventAt)
  } else {
    const prev = findPreviousEventAt(t)
    if (prev !== undefined) {
      return addEvent(Math.max(t - 2, prev.endTime), 2)
    } else {
      return addEvent(t, 2)
    }
  }
}

export function appendEmptyEventAt(t: number): HistoryEventAction|undefined {
  const eventAt = findEventAt(t)
  // can’t insert event when theres already one there, so just select it.
  if (eventAt !== undefined) {
    selectEvent(eventAt)
  } else {
    const next = findNextEventAt(t)
    if (next !== undefined) {
      return addEvent(t, Math.min(2, next.startTime - t))
    } else {
      return addEvent(t, 2)
    }
  }
}

export function appendEmptyEventAfter(e: LocalTranscriptEvent|undefined): HistoryEventAction|undefined {
  // an event is selected
  if (e !== undefined) {
    const next = findNextEventAt(e.endTime)
    // there is one after it.
    if (next !== undefined) {
      if (isEventDockedToEvent(e, next)) {
        // it’s docked, so there’s nothing to do
        return undefined
      } else {
        // there is room, so we add one
        return addEvent(e.endTime, Math.min(2, next.startTime - e.endTime))
      }
    } else {
      return addEvent(e.endTime, 2)
    }
  }
}

// see above
export function prependEmptyEventBefore(e: LocalTranscriptEvent|undefined): HistoryEventAction|undefined {
  if (e !== undefined) {
    const prev = findPreviousEventAt(e.endTime)
    if (prev !== undefined) {
      if (isEventDockedToEvent(prev, e)) {
        return undefined
      } else {
        return addEvent(Math.max(prev.endTime, e.startTime - 2), Math.min(2, e.startTime - prev.endTime))
      }
    } else {
      return addEvent(Math.max(0, e.startTime - 2), Math.min(e.startTime, 2))
    }
  }
}

export function addEvent(atTime: number, length = 1): HistoryEventAction {
  const nextEvent = findNextEventAt(atTime)
  const newEvent: LocalTranscriptEvent = {
    startTime: atTime,
    endTime: atTime + length,
    eventId: makeEventId(),
    speakerEvents: {}
  }
  if (nextEvent !== undefined) {
    const i = findEventIndexById(nextEvent.eventId)
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

function splitTokensAtFactor(ts: LocalTranscriptToken[], factor: number): LocalTranscriptToken[][] {
  // _.partition would have been nicer here
  // but typescript keeps getting confused with it.
  return ts.reduce((m, e, i, l) => {
    m[ i / l.length <= factor ? 0 : 1 ].push(e)
    return m
  }, [[], []] as LocalTranscriptToken[][])
}

export function shiftCharsLeft(eventId: number, speakerId: number, start: number, end: number): HistoryEventAction {
  return shiftCharsAcrossEvents(eventId, speakerId, start, end, -1)
}

export function shiftCharsRight(eventId: number, speakerId: number, start: number, end: number): HistoryEventAction {
  return shiftCharsAcrossEvents(eventId, speakerId, start, end, 1)
}

export function shiftCharsAcrossEvents(
  eventId: number,
  speakerId: number,
  start: number,
  end: number,
  direction: 1|-1
): HistoryEventAction {
  const [ left, right ] = [ start, end ].sort((a, b) => a - b)
  console.log('left right', left, right)
  console.log('start end', start, end)
  const i = findEventIndexById(eventId)
  const e = eventStore.events[ i ]
  const targetE = eventStore.events[ i + direction ]
  // it exists, and there’s also one to the left of it & selection is collapsed
  if (e !== undefined && targetE !== undefined) {
    const ts = e.speakerEvents[speakerId].tokens
    const text = getTextFromTokens(ts, eventStore.metadata.defaultTier)
    // console.log({ ts, text, e, targetE })
    const sourceTokens = collectTokensViaOffsets(
      e.speakerEvents[speakerId].tokens,
      //                 keep right  : keep left
      direction === -1 ? right       : 0,
      direction === -1 ? text.length : left
    )
    const targetTokens = (() => {
      // append
      if (direction === -1) {
        return [
          ...targetE.speakerEvents[speakerId] ? targetE.speakerEvents[speakerId].tokens : [],
          ...collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, 0, right)
        ]
      // prepend
      } else {
        return [
          ...collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, left, text.length),
          ...targetE.speakerEvents[speakerId] ? targetE.speakerEvents[speakerId].tokens : []
        ]
      }
    })()
    const historyEvent = updateSpeakerEvents([ e, targetE ], speakerId, [
      // changed source event
      sourceTokens,
      // changed target event
      targetTokens
    ])
    console.log(historyEvent)
    return historyEvent
  } else {
    throw new Error('Move tokens: source or target event not found.')
  }
}

export function splitEvent(event: LocalTranscriptEvent, splitTime: number): HistoryEventAction {
  const i = findEventIndexById(event.eventId)
  const before = clone(eventStore.events[i])
  const eventLength = event.endTime - event.startTime
  const cutAtProgressFactor = splitTime / eventLength
  const newEventId = makeEventId()
  const leftEvent: LocalTranscriptEvent = {
    ...event,
    speakerEvents: {
      ..._(event.speakerEvents).mapValues(se => {
        return {
          ...se,
          tokens: splitTokensAtFactor(se.tokens, cutAtProgressFactor)[0]
        }
      }).value()
    },
    endTime: event.startTime + splitTime
  }
  const rightEvent: LocalTranscriptEvent = {
    startTime: event.startTime + splitTime,
    endTime: event.endTime,
    eventId: newEventId,
    speakerEvents: {
      ..._(event.speakerEvents).mapValues(se => {
        return {
          ...se,
          speakerEventId: newEventId,
          tokens: splitTokensAtFactor(se.tokens, cutAtProgressFactor)[1]
        }
      }).value()
    }
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

export function splitEventAtChar(
  eventId: number,
  speakerId: number,
  start: number,
  end: number
): HistoryEventAction[] {
  const [ left, right ] = [start, end].sort((a, b) => a - b)
  const i = findEventIndexById(eventId)
  // event exists
  if (i !== -1) {
    const e = eventStore.events[i]
    const before = clone(e)
    const tokens = e.speakerEvents[speakerId] !== undefined ? e.speakerEvents[speakerId].tokens : []
    const segmentCharacters = getTextFromTokens(tokens, eventStore.metadata.defaultTier).length
    // selection is collapsed and not at beginning or end: split into two
    console.log({right, segmentCharacters})
    if (left === right && left !== 0 && right !== segmentCharacters) {
      const splitFactor = left / segmentCharacters
      const splitTime = splitFactor * (e.endTime - e.startTime)
      const newEventId = makeEventId()
      const leftEvent: LocalTranscriptEvent = {
        ...e,
        speakerEvents: {
          ..._(e.speakerEvents).mapValues((se, sid) => ({
            ...se,
            tokens: collectTokensViaOffsets(e.speakerEvents[sid].tokens, 0, left)
          })).value()
        },
        endTime: e.startTime + splitTime
      }
      const rightEvent: LocalTranscriptEvent = {
        startTime: e.startTime + splitTime,
        endTime: e.endTime,
        eventId: newEventId,
        speakerEvents: {
          ..._(e.speakerEvents).mapValues((se, sid) => ({
            ...se,
            speakerEventId: newEventId,
            tokens: collectTokensViaOffsets(e.speakerEvents[sid].tokens, left, segmentCharacters)
          })).value()
        }
      }
      eventStore.events.splice(i, 1, leftEvent, rightEvent)
      return [{
        id: _.uniqueId(),
        time: new Date(),
        apply: true,
        type: 'SPLIT',
        before: [ before ],
        after: [ clone(leftEvent), clone(rightEvent) ]
      }]
    } else {
      // double split
      return []
    }
  } else {
    return []
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

export function findPreviousSpeakerEvent(speaker: string, eventId: number): number {
  const i = findEventIndexById(eventId)
  return _(eventStore.events).findLastIndex((e, eventIndex) => eventIndex < i && e.speakerEvents[speaker] !== undefined)
}

export function findNextSpeakerEvent(speaker: string, eventId: number): number {
  const i = findEventIndexById(eventId)
  return _(eventStore.events).findIndex((e, eventIndex) => eventIndex > i && e.speakerEvents[speaker] !== undefined)
}

export function getNextEvent(id: number): LocalTranscriptEvent|undefined {
  const sorted = sortEvents(eventStore.events)
  const index = sorted.findIndex(e => e.eventId === id) + 1
  return sorted[index]
}

export function getPreviousEvent(id: number): LocalTranscriptEvent|undefined {
  const sorted = sortEvents(eventStore.events)
  const index = sorted.findIndex(e => e.eventId === id) - 1
  return sorted[index]
}

export function deleteEventById(id: number) {
  const i = findEventIndexById(id)
  return deleteEvent(eventStore.events[i])
}

export function timeToSeconds(time: string) {
  const chunks = _.map(time.split(':'), Number)
  return (
    chunks[0] * 60 * 60 // hours
    + chunks[1] * 60 // minutes
    + chunks[2] // seconds
  )
}

export function timeFromSeconds(seconds: number) {
  return new Date(1000 * seconds).toISOString().substr(12, 11)
}

export function pause() {
  eventStore.audioElement.pause()
  eventStore.playAllFrom = null
  eventBus.$emit('pauseAudio', eventStore.currentTime)
  audio.pauseCurrentBuffer()
  eventStore.isPaused = true
}

function emitUpdateTimeUntilPaused(t: number, lockScroll: boolean, maxT: number, useAudioElement: boolean) {
  const startTime = performance.now()
  eventStore.currentTime = t
  eventBus.$emit('updateTime', t)
  let currentlyPlayingEventId: number|null = null
  const step = (now: number) => {
    const elapsed = (now - startTime) / 1000 * settings.playbackSpeed
    // more than 16 ms have passed
    if (useAudioElement === true) {
      eventStore.currentTime = eventStore.audioElement.currentTime
      eventBus.$emit('updateTime', eventStore.currentTime)
    } else {
      if (t + elapsed - eventStore.currentTime >= .016) {
        // update and emit.
        eventStore.currentTime = t + elapsed
        eventBus.$emit('updateTime', eventStore.currentTime)
      }
    }
    // paused or over max t.
    if (
      (maxT !== undefined && eventStore.currentTime >= maxT) ||
      eventStore.isPaused === true
    ) {
      // stop emitting.
      eventStore.isPaused = true
      return false
    } else {
      // sync scroll if locked.
      if (lockScroll) {
        const e = findEventAt(eventStore.currentTime)
        if (e !== undefined && e.eventId !== currentlyPlayingEventId) {
          currentlyPlayingEventId = e.eventId
          scrollToTranscriptEvent(e)
        }
      }
      // continue emitting
      return requestAnimationFrame(step)
    }
  }
  return step(performance.now())
}

export function playAllFrom(t: number) {
  if (eventStore.isPaused === false) {
    pause()
  }
  eventStore.playAllFrom = t
  eventStore.audioElement.currentTime = t
  eventStore.audioElement.play().then(() => {
    eventStore.isPaused = false
    eventBus.$emit('playAudio', t)
    emitUpdateTimeUntilPaused(
      eventStore.audioElement.currentTime,
      settings.lockScroll && settings.lockPlayHead,
      eventStore.audioElement.duration,
      true
    )
  })
}

export function scrubAudio(t: number) {
  eventStore.currentTime = t
  eventBus.$emit('scrubAudio', t)
}

export async function playEventsStart(events: LocalTranscriptEvent[], duration: number) {
  const sortedEvents = sortEvents(events)
  const firstEvent = sortedEvents[0]
  const [ start, end ] = [ firstEvent.startTime, Math.min(firstEvent.startTime + duration, firstEvent.endTime) ]
  playRange(start, end)
}

export async function playEventsEnd(events: LocalTranscriptEvent[], duration: number) {
  const sortedEvents = sortEvents(events)
  const lastEvent = _.last(sortedEvents) as LocalTranscriptEvent
  const [ start, end ] = [ Math.max(lastEvent.endTime - duration, lastEvent.startTime), lastEvent.endTime ]
  playRange(start, end)
}

export async function playRange(start: number, end: number) {
  if (audio.store.uint8Buffer.byteLength === 0) {
    console.log('can’t play, no buffer loaded')
  } else {
    const [ left, right ] = [ start, end ].sort((a, b) => a - b)
    const buffer = await audio.decodeBufferTimeSlice(left, right, audio.store.uint8Buffer.buffer)
    if (buffer !== undefined) {
      requestAnimationFrame(() => {
        eventStore.isPaused = false
        audio
          .playBuffer(buffer, settings.playbackSpeed)
          .addEventListener('ended', () => pause)
        emitUpdateTimeUntilPaused(left, false, right, false)
      })
    }
  }
}

export async function playEvents(events: LocalTranscriptEvent[]) {
  pause()
  const sortedEvents = sortEvents(events)
  const lastEvent = _(sortedEvents).last() as LocalTranscriptEvent
  const firstEvent = _(sortedEvents).first() as LocalTranscriptEvent
  const start = eventStore.currentTime > firstEvent.startTime && eventStore.currentTime < lastEvent.endTime
    ? eventStore.currentTime
    : firstEvent.startTime
  playRange(start, lastEvent.endTime)
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
  return _(ids)
    .map(id => eventStore.events[findEventIndexById(id)])
    .compact()
    .sortBy(e => e.startTime)
    .value()
}

export function replaceEvents(oldEvents: LocalTranscriptEvent[], newEvents: LocalTranscriptEvent[]) {
  oldEvents.forEach(deleteEvent)
  newEvents.forEach(insertEvent)
}

// tslint:disable-next-line:max-line-length
export function findEventGaps(es: LocalTranscriptEvent[], maxGap = .1): Array<{ duration: number, start: number, end: number }> {
  return es.reduce((m, e, i, l) => {
    const gap = l[i + 1] !== undefined ? l[i + 1].startTime - e.endTime : 0
    if (gap > maxGap) {
      m.push({duration: gap, start: e.endTime, end: l[i + 1].startTime})
    }
    return m
  }, [] as Array<{ duration: number, start: number, end: number }>)
}

export function updateTokenOrder(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
  let tr = 0
  return es.map(e => {
    return {
      ...e,
      speakerEvents: _.mapValues(e.speakerEvents, (se) => {
        return {
          ...se,
          tokens: se.tokens.map(t => {
            return {
              ...t,
              order: tr++
            }
          })
        }
      })
    }
  })
}

export function insertPlaceholderTokens(es: LocalTranscriptEvent[], defaultTier: TokenTierType): LocalTranscriptEvent[] {
  const newEs = es.map((e) => {
    return {
      ...e,
      speakerEvents: _.mapValues(e.speakerEvents, (se) => {
        return {
          ...se,
          tokens: ((): LocalTranscriptToken[] => {
            if (se.tokens.length === 0 && Object.keys(se.speakerEventTiers).length > 0) {
              return [
                {
                  fragmentOf: null,
                  id: makeTokenId(),
                  order: -1, // this gets updated later on
                  sentenceId: null,
                  tiers: {
                    ortho: {
                      text: '',
                      type: null
                    },
                    phon: {
                      text: '',
                      type: null
                    },
                    text: {
                      text: '',
                      type: null
                    },
                    [ defaultTier ]: {
                      text: settings.placeholderToken,
                      type: -2
                    }
                  }
                }
              ]
            } else {
              return se.tokens
            }
          })()
        }
      })
    }
  })
  return updateTokenOrder(newEs)
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
            ts = { ...ts, ...ev.speakerEvents[speakerId].speakerEventTiers}
          }
          return ts
        }, {} as LocalTranscriptSpeakerEventTiers),
        speakerEventId: makeEventId(),
        tokens: events.reduce((ts, ev) => {
          if (ev.speakerEvents[speakerId]) {
            ts = ts.concat(ev.speakerEvents[speakerId].tokens)
            return ts
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

export function selectNextEvent(increase: 1|-1 = 1, event?: LocalTranscriptEvent): LocalTranscriptEvent|undefined {
  const id = event ? event.eventId : eventStore.selectedEventIds[0]
  if (id !== undefined) {
    const i = findEventIndexById(id)
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

export function toSeconds(time: string): number {
  const a = time.split(':') // split it at the colons
  // minutes are worth 60 seconds. Hours are worth 60 minutes.
  return (+a[0]) * 60 * 60 + (+a[1] || 0) * 60 + (+a[2] || 0)
}

export function toTime(time: number, decimalPlaces = 0): string {
  // seconds to readable time
  return new Date(time * 1000).toISOString().substr(11, 8 + (decimalPlaces > 0 ? decimalPlaces + 1 : 0))
}
