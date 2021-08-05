
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

export type LocalTranscriptIndexedToken = {
    token: LocalTranscriptToken
    eventIndex: number
    eventId: number
    speakerId: string
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
    viewingTranscriptEvent: null as LocalTranscriptEvent|null, // TODO: rename to highlightedEventIds: number[]
    editingTranscriptEvent: null as LocalTranscriptEvent|null, // TODO: remove: unused.
    viewingAudioEvent: null as LocalTranscriptEvent|null, // TODO: remove: unused.
    showSpeakerTierEditModal: false, // TODO: rename: show transcript meta settings
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

// export function timeToSeconds(time: string) {
//   const chunks = _.map(time.split(':'), Number)
//   return (
//     chunks[0] * 60 * 60 // hours
//     + chunks[1] * 60 // minutes
//     + chunks[2] // seconds
//   )
// }

// export function timeFromSeconds(seconds: number) {
//   return new Date(1000 * seconds).toISOString().substr(12, 11)
// }

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

// FIXME: there are 2 functions to do this
// export function toSeconds(time: string): number {
//   const a = time.split(':') // split it at the colons
//   // minutes are worth 60 seconds. Hours are worth 60 minutes.
//   return (+a[0]) * 60 * 60 + (+a[1] || 0) * 60 + (+a[2] || 0)
// }
// FIXME: there are 2 functions to do this
// export function toTime(time: number, decimalPlaces = 0): string {
//   // seconds to readable time
//   return new Date(time * 1000).toISOString().substr(11, 8 + (decimalPlaces > 0 ? decimalPlaces + 1 : 0))
// }
