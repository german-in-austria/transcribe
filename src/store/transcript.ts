
import _ from 'lodash'
import { saveAs } from 'file-saver'
import audio from '../service/audio'
import {
  clone,
  fileToUint8ArrayAndName
} from '../util'
import settings, { tokenTypesPresets } from '../store/settings'
import { HistoryEventAction } from './history'
import eventBus from '../service/event-bus'
import { collectTokensViaOffsets } from '../service/copy-paste'

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
  createEmptyTranscript,
  ServerTranscriptSaveRequest
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
    viewingAudioEvent: null as LocalTranscriptEvent|null
  },
  transcriptDownloadProgress: 0 as number,
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  playAllFrom: null as number|null,
  backEndUrl: localStorage.getItem('backEndUrl') || 'https://dissdb-test.dioe.at',
  audioElement: document.createElement('audio')
}

export function tokenTypeFromToken(token: string) {
  const type = _(tokenTypesPresets[settings.tokenTypesPreset]).find((tt) => {
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
      eventStore.audioMetadata.length = a.duration
      eventStore.audioMetadata.fileSize = audio.store.uint8Buffer.byteLength
      resolve(a)
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

export function getTextFromTokens(ts: LocalTranscriptToken[], defaultTier: TokenTierType): string {
  return ts.map(t => t.tiers[defaultTier].text).join(' ')
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

export function updateSpeakerEvents(
  es: LocalTranscriptEvent[],
  speakerId: number,
  eTokens: LocalTranscriptToken[][]
): HistoryEventAction {
  const updateHistoryActions = es.map((e, i) => updateSpeakerEvent(e, speakerId, eTokens[i]))
  return {
    id: _.uniqueId(),
    time: new Date(),
    apply: true,
    type: 'CHANGE_TOKENS',
    before: _(updateHistoryActions).map(hea => clone(hea.before)).flatten().value(),
    after: _(updateHistoryActions).map(hea => clone(hea.after)).flatten().value()
  }
}

// TODO: this should also update the speakerEventTiers
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
        speakerEventTiers: isNew
          ? {}
          : oldEvent.speakerEvents[speakerId].speakerEventTiers,
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

export function findEventOverlaps(e: LocalTranscriptEvent): LocalTranscriptEvent[][] {
  const left: LocalTranscriptEvent[] = []
  const middle: LocalTranscriptEvent[] = []
  const right: LocalTranscriptEvent[] = []
  eventStore.events.forEach(ev => {
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
    // true if it’s either the first event
    // or the distance to the previous one is smaller than the settings dock interval
    if (i !== 0) {
      console.log('distance', e.startTime, e.endTime, e.startTime - l[ i - 1].endTime)
    }
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
  return resizeEvents({...eventStore.events[i], startTime, endTime})
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

export function appendEmptyEventAfter(eIds: number[]): HistoryEventAction|undefined {
  const e = _(sortEvents(getEventsByIds(eIds))).last()
  // an event is selected
  if (e !== undefined) {
    const next = findNextEventAt(e.endTime)
    // there is one after it.
    if (next !== undefined) {
      if (isEventDockedToEvent(e, next)) {
        // it’s docked, so we just select the next one
        selectEvent(next)
      } else {
        // there is room, so we add one
        return addEvent(e.endTime, Math.min(1, next.startTime - e.endTime))
      }
    } else {
      return addEvent(e.endTime, 1)
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
  const [ left, right ] = [ start, end ].sort()
  const i = findEventIndexById(eventId)
  const e = eventStore.events[ i ]
  const targetE = eventStore.events[ i + direction ]
  // it exists, and there’s also one to the left of it & selection is collapsed
  if (e !== undefined && targetE !== undefined) {
    const ts = e.speakerEvents[speakerId].tokens
    const text = getTextFromTokens(ts, eventStore.metadata.defaultTier)
    return updateSpeakerEvents([ e, targetE ], speakerId, [
      // changed source event
      collectTokensViaOffsets(
        e.speakerEvents[speakerId].tokens,
        //                 keep right  : keep left
        direction === -1 ? right       : 0,
        direction === -1 ? text.length : left
      ),
      // changed target event
      (() => {
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
            ...targetE.speakerEvents[speakerId] ? targetE.speakerEvents[speakerId].tokens : [],
          ]
        }
      })()
    ])
  } else {
    throw new Error('Move tokens: source or target event not found.')
  }
}

export function splitEvent(event: LocalTranscriptEvent, splitTime: number): HistoryEventAction {
  const i = findEventIndexById(event.eventId)
  const before = clone(eventStore.events[i])
  const eventLength = event.endTime - event.startTime
  const cutAtProgressFactor = splitTime / eventLength
  const leftEvent: LocalTranscriptEvent = {
    ...event,
    speakerEvents: {
      ..._(event.speakerEvents).mapValues(se => {
        return { ...se, tokens: splitTokensAtFactor(se.tokens, cutAtProgressFactor)[0] }
      }).value()
    },
    endTime: event.startTime + splitTime
  }
  const rightEvent: LocalTranscriptEvent = {
    startTime: event.startTime + splitTime,
    endTime: event.endTime,
    eventId: makeEventId(),
    speakerEvents: {
      ..._(event.speakerEvents).mapValues(se => {
        return { ...se, tokens: splitTokensAtFactor(se.tokens, cutAtProgressFactor)[1] }
      }).value()
    },
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
): HistoryEventAction[]  {
  const [ left, right ] = [start, end].sort()
  const i = findEventIndexById(eventId)
  // event exists
  if (i !== -1) {
    const e = eventStore.events[i]
    const before = clone(e)
    // selection is collapsed: split into two
    if (left === right && left !== 0) {
      const tokens = e.speakerEvents[speakerId].tokens
      const segmentCharacters = getTextFromTokens(tokens, eventStore.metadata.defaultTier).length
      const splitFactor = left / segmentCharacters
      const splitTime = splitFactor * (e.endTime - e.startTime)
      const leftEvent: LocalTranscriptEvent = {
        ...e,
        speakerEvents: {
          ..._(e.speakerEvents).mapValues(se => ({
            ...se,
            tokens: collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, 0, left)
          })).value()
        },
        endTime: e.startTime + splitTime
      }
      const rightEvent: LocalTranscriptEvent = {
        startTime: e.startTime + splitTime,
        endTime: e.endTime,
        eventId: makeEventId(),
        speakerEvents: {
          ..._(e.speakerEvents).mapValues(se => ({
              ...se,
              tokens: collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, left, segmentCharacters)
          })).value()
        },
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

function getEventById(id: number): LocalTranscriptEvent|undefined {
  return getEventsByIds([ id ])[0]
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

async function performSaveRequest(id: number, t: ServerTranscriptSaveRequest): Promise<ServerTranscriptSaveResponse> {
  return await (
    await fetch(`${ eventStore.backEndUrl }/routes/transcript/save/${ id }`, {
    credentials: 'include',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(t),
  })).json() as ServerTranscriptSaveResponse
}

export async function saveChangesToServer() {
  console.log('save to server', serverTranscript)
  // there’s no transcript or no id => throw
  if ( serverTranscript === null || serverTranscript.aTranskript === undefined ) {
    throw new Error('transcript id is undefined')
  } else {
    // it’s already on the server
    if (serverTranscript.aTranskript.pk > -1) {
      const t = await localTranscriptToServerSaveRequest(serverTranscript, eventStore.events)
      const serverChanges = await performSaveRequest(serverTranscript.aTranskript.pk, t)
      logServerResponse(t, serverChanges)
      eventStore.events = serverTranscriptToLocal(updateServerTranscriptWithChanges(serverChanges))
    // it’s a new transcript
    } else {
      const { transcript_id } = await createEmptyTranscript(
        serverTranscript.aEinzelErhebung!.pk,
        serverTranscript.aTranskript.n,
        serverTranscript.aTranskript.default_tier!
      )
      console.log('created transcript with id', transcript_id)
      const transcriptWithoutTokensAndEvents = {
        ...serverTranscript,
        aTranscript: {
          ...serverTranscript.aTranskript,
          pk: transcript_id
        },
        aTokens: {},
        aEvents: []
      }
      const t = await localTranscriptToServerSaveRequest(transcriptWithoutTokensAndEvents, eventStore.events)
      const serverChanges = await performSaveRequest(transcript_id, t)
      logServerResponse(t, serverChanges)
      eventStore.events = serverTranscriptToLocal(updateServerTranscriptWithChanges(serverChanges))
    }
  }
}
