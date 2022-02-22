/// <reference types="@types/wicg-file-system-access" />

import {
  TranscriptEvent,
  TranscriptTier,
  TranscriptToken,
  TranscriptTokenTypes,
  SearchResult,
  TokenTierType,
  TranscriptSpeakerEvent,
  LocalTranscriptSpeakers,
  TranscriptSpeakerEventTiers
} from '@/types/transcript'

import TranscriptAudio from './transcript-audio.class'
import { computeTokenTypesForEvents } from '../service/token-types.service'
import _ from 'lodash'
import settings from '@/store/settings.store'
import EventService from './event.class'
import bus from '../service/bus'
import { HistoryEventAction, history } from '@/store/history.store'
// import { collectTokensViaOffsets } from './copy-paste'
import diskService from '../service/disk.service'
import { clone } from '@/util'
import { fetchTranscript, getAudioUrlFromServerNames } from '../service/backend-server.service'
import store from '@/store'
import { Pastable } from '../service/copy-paste.service'

type AudioFile = File
type TranscribeFile = FileSystemFileHandle

export interface TranscriptMetaData {
  defaultTier: TokenTierType
  speakers: LocalTranscriptSpeakers
  lockedTokens: number[]
  tokenTypes: TranscriptTokenTypes
  transcriptName: string|null
  tiers: TranscriptTier[]
}

export interface TranscriptUiState {
  selectedEventIds: number[]
  selectedSearchResult: SearchResult|null
  highlightedEventIds: number[]
  inspectedEventId: number|null
  searchResults: SearchResult[]
  searchTerm: string
  /** Number between 0 and 1. "null" means that the transcript is not currently loading." */
  downloadProgress: number|null
  isInitializing: boolean
  isSaving: boolean
  lastSaved: Date|null,
  showTranscriptMetaSettings: boolean
  timeSpanSelection: {
    start: null|number
    end: null|number
  }
}

export type AudioFileOrUrl = AudioFile | string | ArrayBuffer

/**
 * Contains all instance methods for interacting with the Transcript and its state.
 * It can be initialized in several ways.
 * 1) with only an audio file
 * 2) with a full Transcribe File (.transcribe)
 * 3) With a Back End Url and a Transcript ID for remote transcripts.
 * 4) With the fully formed events (e. g. when an external file is imported)
 * 5) with nothing (creates a totally empty transcript)
*/
export default class Transcript extends EventService {
  constructor(
    init?: AudioFile
      | TranscribeFile
      | { backEndUrl: string, id: number }
      | { events: TranscriptEvent[], meta: TranscriptMetaData },
    audio?: AudioFileOrUrl
  ) {
    super()
    if (init === undefined) {
      console.log('init - initEmptyTranscript')
      this.initEmptyTranscript()
    } else if (init instanceof FileSystemFileHandle) {
      console.log('init - initTranscriptFromFile')
      this.initTranscriptFromFile(init)
    } else if (init instanceof File && init.type === 'audio/ogg') {
      console.log('init - initTranscriptFromAudio')
      this.initTranscriptFromAudio(init)
    } else if ('backEndUrl' in init) {
      console.log('init - initTranscriptWithBackend')
      this.initTranscriptWithBackend(init.id, init.backEndUrl)
    } else if ('events' in init) {
      console.log('init - initTranscriptWithData')
      this.initTranscriptWithData(init.events, audio)
    } else {
      console.log('init - unknown', init, audio)
    }
  }

  key = '-1'
  events: TranscriptEvent[] = []
  audio: TranscriptAudio|null = null

  meta: TranscriptMetaData = {
    defaultTier: 'text',
    speakers: {},
    lockedTokens: [],
    tokenTypes: {},
    transcriptName: null,
    tiers: []
  }

  uiState: TranscriptUiState = {
    selectedEventIds: [],
    selectedSearchResult: null,
    highlightedEventIds: [],
    inspectedEventId: null,
    searchResults: [],
    searchTerm: '',
    isInitializing: false,
    /** Number between 0 and 1. "null" means that the transcript is not currently loading." */
    downloadProgress: null,
    isSaving: false,
    lastSaved: null,
    showTranscriptMetaSettings: false,
    timeSpanSelection: {
      start: null,
      end: null
    }
  }

  initEmptyTranscript() {
    this.initTranscriptWithData([])
  }

  async initTranscriptFromAudio(a: AudioFileOrUrl) {
    this.audio = new TranscriptAudio(a)
    this.initEmptyTranscript()
  }

  async initTranscriptFromFile(f: FileSystemFileHandle) {
    const pf = await diskService.loadProjectFile(f)
    history.actions = pf.historyActions
    history.autoSaver = async () => {
      this.uiState.isSaving = true
      this.uiState.lastSaved = new Date()
      await diskService.saveFile(this, history.actions)
      this.uiState.isSaving = false
      console.log('auto saving done.')
    }
    this.initTranscriptWithData(
      pf.events,
      pf.audioBuffer.buffer,
      pf.meta,
      pf.uiState
    )
  }

  async initTranscriptWithBackend(id: number, backEndUrl: string) {
    this.key = String(id)
    this.uiState.isInitializing = true
    await fetchTranscript(id, backEndUrl, this, (p, es, res) => {
      // Only continue, if we’re still trying to
      // load the same transcript from the same server.
      if (String(id) === this.key && backEndUrl === settings.backEndUrl) {
        this.uiState.isInitializing = false
        this.uiState.downloadProgress = p
        this.key = String(id)
        if (
          this.audio === null &&
          settings.backEndUrl !== null &&
          res.aEinzelErhebung?.af !== undefined
        ) {
          const audioUrl = getAudioUrlFromServerNames(res.aEinzelErhebung.af, res.aEinzelErhebung.dp, settings.backEndUrl)
          if (audioUrl !== null) {
            this.audio = new TranscriptAudio(audioUrl)
          }
        }
      } else {
        // Otherwise, the recursive operation stops here.
      }
    })
    this.uiState.downloadProgress = null
  }

  initTranscriptWithData(
    es: TranscriptEvent[],
    audio?: AudioFileOrUrl,
    meta?: TranscriptMetaData,
    uiState?: TranscriptUiState,
    overviewSvg?: string
  ) {
    console.log('initTranscriptWithData', {es, audio, meta, uiState, overviewSvg})
    if (audio !== undefined) {
      this.audio = new TranscriptAudio(audio, overviewSvg)
    }
    if (uiState !== undefined) {
      this.uiState = uiState
    }
    if (meta !== undefined) {
      this.meta = meta
    }
    // Apply some cautious fixes to the transcript, in case it has structural faults.
    const fixedEvents = EventService.sortEvents(
      EventService.removeBrokenFragmentLinks(
        computeTokenTypesForEvents(
          es,
          this.meta.defaultTier,
          Object.keys(this.meta.speakers)
        )
      )
    )
    console.log('fixedEvents', {es, fixedEvents, t: this})
    this.events = fixedEvents
  }

  /** Create a unique Id */
  static makeTierId() {
    return Number(_.uniqueId()) * -1
  }

  /** Create a unique Id */
  static makeEventTierId() {
    return Number(_.uniqueId()) * -1
  }

  /** Create a unique Id */
  static makeSpeakerId() {
    return Number(_.uniqueId()) * -1
  }

  /** Checks if a time span selection exists */
  isTimeSpanSelectionEmpty() {
    return this.uiState.timeSpanSelection.start === null &&
      this.uiState.timeSpanSelection.end === null
  }

  scrollToAudioTime(t: number) {
    bus.$emit('scrollToAudioTime', t)
  }

  scrollToAudioEvent(e: TranscriptEvent) {
    this.uiState.highlightedEventIds = [ e.eventId ]
    bus.$emit('scrollToAudioEvent', e)
  }

  scrollToTranscriptEvent(
    e: TranscriptEvent, opts?: {
      animate: boolean,
      focusSpeaker: string|null,
      focusTier: string|null,
      focusRight: boolean
    }
  ) {
    this.uiState.highlightedEventIds = [ e.eventId ]
    bus.$emit('scrollToTranscriptEvent', e, {
      animate: true,
      focusSpeaker: null,
      focusTier: this.meta.defaultTier,
      focusRight: false,
      ...opts
    })
  }

  findEventIndexById(id: number) {
    return _(this.events).findIndex(e => e.eventId === id)
  }

  getFirstTokenOrder(e: TranscriptEvent, speakerId: string): number {
    const speakerEvent = e.speakerEvents[speakerId]
    if (speakerEvent) {
      const firstToken = e.speakerEvents[speakerId].tokens[0]
      if (firstToken) {
        return firstToken.order
      } else {
        return 0
      }
    } else {
      const i = this.findPreviousSpeakerEvent(speakerId, e.eventId)
      if (i !== -1) {
        const prevLastToken = _(this.events[i].speakerEvents[speakerId].tokens).last()
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

  findPreviousSpeakerEvent(speaker: string, eventId: number): number {
    const i = this.findEventIndexById(eventId)
    return _(this.events).findLastIndex((e, eventIndex) => eventIndex < i && e.speakerEvents[speaker] !== undefined)
  }

  getLastEventToken(event: TranscriptEvent|undefined, speakerId: number): TranscriptToken|undefined {
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

  /**
   * Link the first Token of an Event to a Token via the fragmentOf Property.
  */
  setFirstTokenFragmentOf(
    eventIndex: number,
    speakerId: number,
    lastEventToken?: TranscriptToken
  ) {
    const event = this.events[eventIndex]
    if (
      event !== undefined &&
      event.speakerEvents !== undefined &&
      event.speakerEvents[speakerId] !== undefined
    ) {
      const speakerEvent = event.speakerEvents[speakerId]
      if (speakerEvent !== undefined) {
        const firstToken = this.events[eventIndex].speakerEvents[speakerId].tokens[0]
        if (firstToken !== undefined) {
          this.events[eventIndex].speakerEvents[speakerId].tokens[0].fragmentOf = lastEventToken
            ? lastEventToken.id
            : null
        }
      }
    }
  }

  /** Update the Tokens for several Events at once. */
  updateSpeakerEvents(
    es: TranscriptEvent[],
    speakerId: number,
    eTokens: TranscriptToken[][]
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
    const updateHistoryActions = newEs.map(e => this.updateSpeakerEvent(e, speakerId))
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'CHANGE_TOKENS',
      before: _(updateHistoryActions).map(hea => clone(hea.before)).flatten().value(),
      after: _(updateHistoryActions).map(hea => clone(hea.after)).flatten().value()
    }
  }

  /** Checks whether a Speaker Event has any tokens */
  hasTokens(se: TranscriptSpeakerEvent): boolean {
    return se.tokens.length > 0 && se.tokens.map(t => t.tiers[this.meta.defaultTier].text).join('').trim() !== ''
  }

  /** Update an Event, creating an undoable History Action. */
  updateSpeakerEvent(
    event: TranscriptEvent,
    speakerId: number
  ): HistoryEventAction {
    const tokens = event.speakerEvents[speakerId].tokens
    const eventIndex = this.findEventIndexById(event.eventId)
    const oldEvent = this.events[eventIndex] || {}
    // tslint:disable-next-line:max-line-length
    const deletedSpeakerId = !this.hasTokens(event.speakerEvents[speakerId]) && !EventService.hasEventTiers(event.speakerEvents[speakerId]) ? speakerId : undefined
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
    }, {} as TranscriptEvent['speakerEvents'])

    // create the event
    const newEvent = clone({ ...oldEvent, speakerEvents })

    // console.log({ newEvent })

    // if it has a fragment marker ("="),
    // mark the first token in the next
    // speaker event as a fragment_of
    if (EventService.hasNextFragmentMarker(newEvent, speakerId, this.meta.defaultTier)) {
      this.setFirstTokenFragmentOf(eventIndex + 1, speakerId, this.getLastEventToken(newEvent, speakerId))
    // unset, if it doesn’t
    } else {
      this.setFirstTokenFragmentOf(eventIndex + 1, speakerId, undefined)
    }

    // UPDATE EVENT
    this.events.splice(eventIndex, 1, newEvent)
    // if the last token in the previous event
    // has a fragment marker (=), set fragment of here.
    if (EventService.hasNextFragmentMarker(this.getPreviousEvent(event.eventId), speakerId, this.meta.defaultTier)) {
      const t = this.getLastEventToken(this.getPreviousEvent(event.eventId), speakerId)
      if (t !== undefined) {
        this.setFirstTokenFragmentOf(eventIndex, speakerId, t)
      }
    // unset, if it doesn’t
    } else {
      this.setFirstTokenFragmentOf(eventIndex, speakerId, undefined)
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

  /** Get the event before this one. */
  getPreviousEvent(id: number): TranscriptEvent|undefined {
    const sorted = EventService.sortEvents(this.events)
    const index = sorted.findIndex(e => e.eventId === id) - 1
    return sorted[index]
  }

  /** Resize Events. Use this to update the startTime or endTime of one or multiple Events at once. */
  resizeEvents(...es: TranscriptEvent[]): HistoryEventAction {
    const oldEs = clone(es
      .map(e => this.findEventIndexById(e.eventId))
      .map(i => this.events[i])
    )
    this.replaceEvents(oldEs, es)
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'RESIZE',
      before: oldEs,
      after: clone(es)
    }
  }

  /** Same as above, for a single item. */
  resizeEvent(id: number, startTime: number, endTime: number): HistoryEventAction {
    const i = this.findEventIndexById(id)
    return this.resizeEvents({ ...this.events[i], startTime, endTime })
  }

  /** Move the left side of an event (i. e. the start time) */
  moveEventStartTime(e: TranscriptEvent, by: number): HistoryEventAction {
    // same as above but in the other direction and with the previous event.
    const newEvent = { ...e, startTime: e.startTime + by }
    const previousEvent = this.findPreviousEventAt(e.endTime)
    console.log({ previousEvent, isEventDockedToEvent: previousEvent && EventService.isEventDockedToEvent([e, previousEvent], settings.eventDockingInterval) })
    if (
      previousEvent !== undefined && (
        EventService.isEventDockedToEvent([newEvent, previousEvent], settings.eventDockingInterval) ||
        EventService.isEventDockedToEvent([e, previousEvent], settings.eventDockingInterval)
      )
    ) {
      const previousEventFutureLength = newEvent.startTime - previousEvent.startTime
      if (previousEventFutureLength >= settings.minimumEventLength) {
        return this.resizeEvents(
          { ...previousEvent, endTime: newEvent.startTime },
          { ...newEvent }
        )
      } else {
        return this.resizeEvents(
          { ...previousEvent, endTime: previousEvent.startTime + settings.minimumEventLength },
          { ...e, startTime: previousEvent.startTime + settings.minimumEventLength }
        )
      }
    } else {
      return this.resizeEvents(newEvent)
    }
  }

  /** Move the right side of an event (i. e. its end time). */
  moveEventEndTime(e: TranscriptEvent, by: number): HistoryEventAction {
    // create future event and find next.
    const newEvent = { ...e, endTime: e.endTime + by }
    const nextEvent = this.findNextEventAt(e.endTime)
    // console.log({ nextEvent, isEventDockedToEvent: nextEvent && EventService.isEventDockedToEvent(e, nextEvent) })
    // there is a next event and it’s docked to
    // either the current event or the future event
    if (
      nextEvent !== undefined && (
        EventService.isEventDockedToEvent([newEvent, nextEvent], settings.eventDockingInterval) ||
        EventService.isEventDockedToEvent([e, nextEvent], settings.eventDockingInterval)
      )
    ) {
      const nextEventFutureLength = nextEvent.endTime - newEvent.endTime
      // the next event’s length after the operation will be sufficient
      if (nextEventFutureLength >= settings.minimumEventLength) {
        return this.resizeEvents(
          { ...newEvent },
          { ...nextEvent, startTime: newEvent.endTime }
        )
      // it won’t be
      } else {
        // resize the previous event to the minimum length, and fit the current one snugly.
        return this.resizeEvents(
          { ...e, endTime: nextEvent.endTime - settings.minimumEventLength },
          { ...nextEvent, startTime: nextEvent.endTime - settings.minimumEventLength }
        )
      }
    // there is no next event or it’s not docked
    } else {
      // resize just it.
      return this.resizeEvents(newEvent)
    }
  }

  /** Insert a complete event into the transcript. */
  private insertEvent(e: TranscriptEvent): HistoryEventAction {
    const nextEvent = this.findNextEventAt(e.startTime)
    if (nextEvent !== undefined) {
      const i = this.findEventIndexById(nextEvent.eventId)
      this.events.splice(i, 0, e)
    } else {
      this.events.push(e)
    }
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'ADD',
      before: [],
      after: [ clone(e) ]
    }
  }

  /** Generate and insert a fresh Event at a certain time. */
  addEvent(atTime: number, length = 1): HistoryEventAction {
    const nextEvent = this.findNextEventAt(atTime)
    const newId = EventService.makeEventId()
    const newEvent: TranscriptEvent = {
      startTime: atTime,
      endTime: atTime + length,
      eventId: newId,
      speakerEvents: {}
      // OR: _.mapValues(transcript.meta.speakers, () => makeSpeakerEvent(newId))
    }
    if (nextEvent !== undefined) {
      const i = this.findEventIndexById(nextEvent.eventId)
      this.events.splice(i, 0, newEvent)
    } else {
      this.events.push(newEvent)
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

  /** Conditionally prepend an event at a certain time. Selects the event, if there’s already one there. */
  prependEmptyEventAt(t: number): HistoryEventAction|undefined {
    const eventAt = this.findEventAt(t)
    // can’t insert event when theres already one there, so just select it.
    if (eventAt !== undefined) {
      this.selectEvent(eventAt)
    } else {
      const prev = this.findPreviousEventAt(t)
      const next = this.findNextEventAt(t)
      if (prev !== undefined) {
        return this.addEvent(Math.max(t - 2, prev.endTime), next ? Math.min(2, next.startTime - t) : 2)
      } else {
        return this.addEvent(t, 2)
      }
    }
  }

  /** Conditionally append an event at a certain time. Selects the event, if there’s already one there. */
  appendEmptyEventAt(t: number): HistoryEventAction|undefined {
    const eventAt = this.findEventAt(t)
    // can’t insert event when theres already one there, so just select it.
    if (eventAt !== undefined) {
      this.selectEvent(eventAt)
    } else {
      const next = this.findNextEventAt(t)
      if (next !== undefined) {
        return this.addEvent(t, Math.min(2, next.startTime - t))
      } else {
        return this.addEvent(t, 2)
      }
    }
  }

  /** Same as appendEmptyEventAt, but dependent on a previous event. */
  appendEmptyEventAfter(e: TranscriptEvent|undefined): HistoryEventAction|undefined {
    // an event is selected
    if (e !== undefined) {
      const next = this.findNextEventAt(e.endTime)
      // there is one after it.
      if (next !== undefined) {
        if (EventService.isEventDockedToEvent([e, next], settings.eventDockingInterval)) {
          // it’s docked, so there’s nothing to do
          return undefined
        } else {
          // there is room, so we add one
          return this.addEvent(e.endTime, Math.min(2, next.startTime - e.endTime))
        }
      } else {
        return this.addEvent(e.endTime, 2)
      }
    }
  }

  /** Same as prependEmptyEventAt, but dependent on a previous event. */
  prependEmptyEventBefore(e: TranscriptEvent|undefined): HistoryEventAction|undefined {
    if (e !== undefined) {
      const prev = this.findPreviousEventAt(e.endTime)
      if (prev !== undefined) {
        if (EventService.isEventDockedToEvent([prev, e], settings.eventDockingInterval)) {
          return undefined
        } else {
          return this.addEvent(Math.max(prev.endTime, e.startTime - 2), Math.min(2, e.startTime - prev.endTime))
        }
      } else {
        return this.addEvent(Math.max(0, e.startTime - 2), Math.min(e.startTime, 2))
      }
    }
  }

  deleteSelectedEvents(): HistoryEventAction {
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'DELETE',
      before: _(this.uiState.selectedEventIds).map((id) => this.deleteEventById(id)).flatMap(a => a.before).value(),
      after: []
    }
  }

  deleteEvent(event: TranscriptEvent): HistoryEventAction {
    console.log('deleteEvent', this)
    const i = this.findEventIndexById(event.eventId)
    const e = clone(this.events[i])
    this.events.splice(i, 1)
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'DELETE',
      before: [ e ],
      after: []
    }
  }

  /** Shift a range of characters of an Event to the previous Event */
  shiftCharsLeft(eventId: number, speakerId: number, start: number, end: number): HistoryEventAction {
    return this.shiftCharsAcrossEvents(eventId, speakerId, start, end, -1)
  }

  /** Shift a range of characters of an Event to the next Event */
  shiftCharsRight(eventId: number, speakerId: number, start: number, end: number): HistoryEventAction {
    return this.shiftCharsAcrossEvents(eventId, speakerId, start, end, 1)
  }

  static collectTokensViaOffsets(
    tokens: TranscriptToken[],
    t: Transcript,
    start:
    number,
    end: number
  ): Array<Pastable<TranscriptToken>> {
    // start and end are not necessarily from left to right
    const [left, right] = [start, end].sort((a, b) => a - b)
    // init cursor
    let cursor = 0
    // reduce to relevant tokens and mark partiality
    return tokens.reduce((m, e, i) => {
      // get range for token
      const tokenStart = cursor
      const tokenEnd = cursor + e.tiers[ t.meta.defaultTier ].text.length
      // move cursor to the end of the token and account for whitespace
      cursor = tokenEnd + 1
      // decide whether it’s in the range
      if (left <= tokenStart && right >= tokenEnd) {
        // token is fully in collection range, not partial
        return m.concat({ ...e, partial: false, index: i })
      } else if (left > tokenEnd || right <= tokenStart) {
        // token is outside of collection range -> do nothing
        return m
      } else {
        // token is partly in collection range, not fully
        if (right < tokenEnd) {
          // only take the left part (it’s the start)
          return m.concat([{
            ...Transcript.getTokenPartWithMetadata(e, t.meta.defaultTier, 0, right - tokenStart),
            index: i,
            partial: true
          }])
        } else {
          // only take the right part (it’s the end)
          return m.concat([{
            ...Transcript.getTokenPart(e, t.meta.defaultTier, left - tokenStart),
            index: i,
            partial: true
          }])
        }
      }
    }, [] as Array<Pastable<TranscriptToken>>)
  }

  static getTokenPartWithMetadata(
    e: TranscriptToken,
    defaultTier: TokenTierType,
    range1: number,
    range2?: number
  ): TranscriptToken {
    return {
      // old token id and all tiers
      ...e,
      tiers: {
        // leave the other tiers untouched
        ...e.tiers,
        // edit the defaultTier text, so it only contains the selected text
        [ defaultTier ]: {
          ...e.tiers[ defaultTier ],
          text: e.tiers[ defaultTier ].text.substring(range1, range2) + '='
        }
      }
    }
  }

  static getTokenPart(
    e: TranscriptToken,
    defaultTier: TokenTierType,
    range1: number,
    range2?: number
  ): TranscriptToken {
    // new token id and only the default tier
    return {
      ...e,
      id: Transcript.makeTokenId(),
      tiers: {
        ortho: { text: '', type: -1 },
        phon: { text: '', type: -1 },
        text: { text: '', type: -1 },
        [ defaultTier ]: {
          ...e.tiers[ defaultTier ],
          text: e.tiers[ defaultTier ].text.substring(range1, range2)
        }
      }
    }
  }

  /** Utility function to move characters / tokens from one event to an adjacent event. */
  private shiftCharsAcrossEvents(
    eventId: number,
    speakerId: number,
    start: number,
    end: number,
    direction: 1|-1
  ): HistoryEventAction {
    const [ left, right ] = [ start, end ].sort((a, b) => a - b)
    const i = this.findEventIndexById(eventId)
    const e = this.events[ i ]
    const targetE = this.events[ i + direction ]
    // it exists, and there’s also one to the left of it and the selection is collapsed.
    if (e !== undefined && targetE !== undefined) {
      const ts = e.speakerEvents[speakerId].tokens
      const text = EventService.getTextFromTokens(ts, this.meta.defaultTier)
      const sourceTokens = Transcript.collectTokensViaOffsets(
        e.speakerEvents[speakerId].tokens,
        this,
        //                 keep right  : keep left
        direction === -1 ? right : 0,
        direction === -1 ? text.length : left
      )
      const targetTokens = (() => {
        // append
        if (direction === -1) {
          return [
            ...targetE.speakerEvents[speakerId] ? targetE.speakerEvents[speakerId].tokens : [],
            ...Transcript.collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, this, 0, right)
          ]
        // prepend
        } else {
          return [
            ...Transcript.collectTokensViaOffsets(e.speakerEvents[speakerId].tokens, this, left, text.length),
            ...targetE.speakerEvents[speakerId] ? targetE.speakerEvents[speakerId].tokens : []
          ]
        }
      })()
      const historyEvent = this.updateSpeakerEvents([ e, targetE ], speakerId, [
        // changed source event
        sourceTokens,
        // changed target event
        targetTokens
      ])
      return historyEvent
    } else {
      throw new Error('Move tokens: source or target event not found.')
    }
  }

  /** Split an event at a certain offset. Also splits the token list. */
  splitEvent(event: TranscriptEvent, splitTime: number): HistoryEventAction {
    const i = this.findEventIndexById(event.eventId)
    const before = clone(this.events[i])
    const eventLength = event.endTime - event.startTime
    const cutAtProgressFactor = splitTime / eventLength
    const newEventId = EventService.makeEventId()
    const leftEvent: TranscriptEvent = {
      ...event,
      speakerEvents: {
        ..._(event.speakerEvents).mapValues(se => {
          return {
            ...se,
            tokens: EventService.splitTokensAtFactor(se.tokens, cutAtProgressFactor)[0]
          }
        }).value()
      },
      endTime: event.startTime + splitTime
    }
    const rightEvent: TranscriptEvent = {
      startTime: event.startTime + splitTime,
      endTime: event.endTime,
      eventId: newEventId,
      speakerEvents: {
        ..._(event.speakerEvents).mapValues(se => {
          return {
            ...se,
            speakerEventId: newEventId,
            tokens: EventService.splitTokensAtFactor(se.tokens, cutAtProgressFactor)[1]
          }
        }).value()
      }
    }
    this.events.splice(i, 1, leftEvent, rightEvent)
    return {
      id: _.uniqueId(),
      time: new Date(),
      apply: true,
      type: 'SPLIT',
      before: [ before ],
      after: [ clone(leftEvent), clone(rightEvent) ]
    }
  }

  /** Split an event at a character offset. Guesses the new start and end times based on the character offset. */
  splitEventAtChar(
    eventId: number,
    speakerId: number,
    start: number,
    end: number
  ): HistoryEventAction[] {
    const [ left, right ] = [start, end].sort((a, b) => a - b)
    const i = this.findEventIndexById(eventId)
    // event exists
    if (i !== -1) {
      const e = this.events[i]
      const before = clone(e)
      const tokens = e.speakerEvents[speakerId] !== undefined ? e.speakerEvents[speakerId].tokens : []
      const segmentCharacters = EventService.getTextFromTokens(tokens, this.meta.defaultTier).length
      // selection is collapsed and not at beginning or end: split into two
      // console.log({right, segmentCharacters})
      if (left === right && left !== 0 && right !== segmentCharacters) {
        const splitFactor = left / segmentCharacters
        const splitTime = splitFactor * (e.endTime - e.startTime)
        const newEventId = EventService.makeEventId()
        const leftEvent: TranscriptEvent = {
          ...e,
          speakerEvents: {
            ..._(e.speakerEvents).mapValues((se, sid) => ({
              ...se,
              tokens: Transcript.collectTokensViaOffsets(e.speakerEvents[sid].tokens, this, 0, left)
            })).value()
          },
          endTime: e.startTime + splitTime
        }
        const rightEvent: TranscriptEvent = {
          startTime: e.startTime + splitTime,
          endTime: e.endTime,
          eventId: newEventId,
          speakerEvents: {
            ..._(e.speakerEvents).mapValues((se, sid) => ({
              ...se,
              speakerEventId: newEventId,
              tokens: Transcript.collectTokensViaOffsets(e.speakerEvents[sid].tokens, this, left, segmentCharacters)
            })).value()
          }
        }
        this.events.splice(i, 1, leftEvent, rightEvent)
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

  /** Join (or merge) two events */
  joinEvents(eventIds: number[]): HistoryEventAction {
    const events = this.getEventsByIds(eventIds)
    const speakerIds = EventService.getSpeakersFromEvents(events)
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
          }, {} as TranscriptSpeakerEventTiers),
          speakerEventId: EventService.makeEventId(),
          tokens: events.reduce((ts, ev) => {
            if (ev.speakerEvents[speakerId]) {
              ts = ts.concat(ev.speakerEvents[speakerId].tokens)
              return ts
            } else {
              return ts
            }
          }, [] as TranscriptToken[])
        }
        return speakerEvents
      }, {} as TranscriptEvent['speakerEvents'])
    }
    this.replaceEvents(events, [ joinedEvent ])
    this.uiState.selectedEventIds = [ joinedEvent.eventId ]
    return {
      id: _.uniqueId(),
      time: new Date(),
      type: 'JOIN',
      apply: true,
      before: clone(events),
      after: [ clone(joinedEvent) ]
    }
  }

  findNextEventAt(seconds: number, events = this.events): TranscriptEvent|undefined {
    return _(events).sortBy(e => e.startTime).find((e) => e.startTime >= seconds)
  }

  findPreviousEventAt(seconds: number, events = this.events): TranscriptEvent|undefined {
    const i = _(events).sortBy(e => e.startTime).findLastIndex((e) => e.endTime < seconds)
    return events[i]
  }

  findEventAt(seconds: number, events = this.events): TranscriptEvent|undefined {
    return _(events).find((e) => e.startTime <= seconds && e.endTime >= seconds)
  }

  findEventIndexAt(seconds: number, events = this.events): number {
    return _(events).findIndex((e) => e.startTime <= seconds && e.endTime >= seconds)
  }

  findNextSpeakerEvent(speaker: string, eventId: number): number {
    const i = this.findEventIndexById(eventId)
    return _(this.events).findIndex((e, eventIndex) => eventIndex > i && e.speakerEvents[speaker] !== undefined)
  }

  getNextEvent(id: number): TranscriptEvent|undefined {
    const sorted = EventService.sortEvents(this.events)
    const index = sorted.findIndex(e => e.eventId === id) + 1
    return sorted[index]
  }

  deleteEventById(id: number) {
    const i = this.findEventIndexById(id)
    return this.deleteEvent(this.events[i])
  }

  getEventById(id: number): TranscriptEvent|undefined {
    return this.events[this.findEventIndexById(id)]
  }

  private getEventsByIds(ids: number[]): TranscriptEvent[] {
    return _(ids)
      .map(id => this.events[this.findEventIndexById(id)])
      .compact()
      .sortBy(e => e.startTime)
      .value()
  }

  replaceEvents(oldEvents: TranscriptEvent[], newEvents: TranscriptEvent[]) {
    oldEvents.forEach(e => this.deleteEvent(e))
    newEvents.forEach(e => this.insertEvent(e))
  }

  isEventSelected(id: number): boolean {
    return this.uiState.selectedEventIds.indexOf(id) > -1
  }

  isMostRecentSelection(id: number) {
    return _.last(this.uiState.selectedEventIds) === id
  }

  selectNextEvent(direction: 1|-1 = 1, event?: TranscriptEvent): TranscriptEvent|undefined {
    const id = event ? event.eventId : this.uiState.selectedEventIds[0]
    if (id !== undefined) {
      const i = this.findEventIndexById(id)
      const e = this.events[i + direction]
      return this.selectEvent(e)[0]
    } else {
      return this.events[0]
    }
  }

  selectPreviousEvent(): TranscriptEvent|undefined {
    return this.selectNextEvent(-1)
  }

  deselectEvents() {
    this.uiState.selectedEventIds = []
    return []
  }

  selectEvents(es: TranscriptEvent[]): TranscriptEvent[] {
    this.uiState.selectedEventIds = es.map(e => e.eventId)
    return es
  }

  selectEvent(e: TranscriptEvent): TranscriptEvent[] {
    return this.selectEvents([ e ])
  }

  collectEventsByTimeRange(start: number, end: number): TranscriptEvent[] {
    return this.events.filter((e) => {
      return e.startTime >= start && e.endTime <= end
    })
  }

  selectEventRange(e: TranscriptEvent) {
    const anchorEvent = this.getSelectedEvent()
    if (anchorEvent === undefined) {
      this.selectEvent(e)
    } else {
      this.uiState.selectedEventIds =
        // collect them, from left to right.
        _(this.collectEventsByTimeRange(
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

  selectOrDeselectEvent(e: TranscriptEvent): TranscriptEvent {
    if (this.isEventSelected(e.eventId)) {
      this.removeEventsFromSelection([ e ])
    } else {
      this.addEventsToSelection([ e ])
    }
    return e
  }

  addEventsToSelection(es: TranscriptEvent[]) {
    this.uiState.selectedEventIds = this.uiState.selectedEventIds.concat(es.map(e => e.eventId))
  }

  removeEventsFromSelection(es: TranscriptEvent[]) {
    const eIds = es.map(e => e.eventId)
    this.uiState.selectedEventIds = this.uiState.selectedEventIds.filter((eId) => eIds.indexOf(eId) === -1)
  }

  getSelectedEvents(): TranscriptEvent[] {
    return this.getEventsByIds(this.uiState.selectedEventIds)
  }

  getSelectedEvent(): TranscriptEvent|undefined {
    return _.find(this.events, (e) => e.eventId === this.uiState.selectedEventIds[0])
  }
}














