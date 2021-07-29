/// <reference types="@types/wicg-file-system-access" />

import { LocalTranscriptEvent, LocalTranscriptTier, LocalTranscriptToken, LocalTranscriptTokenTypes, SearchResult, TokenTierType, LocalTranscriptIndexedToken, LocalTranscriptSpeakerEvent, LocalTranscriptSpeakers } from '@/store/transcript'
import AudioStore from './audio.class'
import { computeTokenTypesForEvents } from './token-types'
import presets, { TokenTypePresetBase } from '../presets'
import _ from 'lodash'
import settings from '@/store/settings'

interface AudioFile extends File {
  type: 'audio/ogg'
}

interface TranscribeFile extends FileSystemFileHandle {
  type: 'application/zip'
}

interface TranscriptMetaData {
  defaultTier: TokenTierType
  speakers: LocalTranscriptSpeakers
  lockedTokens: number[]
  tokenTypes: LocalTranscriptTokenTypes
  transcriptName: string|null
  tiers: LocalTranscriptTier[]
}

export type AudioFileOrUrl = AudioFile | string

export default class Transcript {
  constructor(init: AudioFile | undefined | TranscribeFile | { backEndUrl: string, id: number } | { events: LocalTranscriptEvent[], audio?: AudioFileOrUrl }) {
    if (init === undefined) {
      this.initEmptyTranscript()
    } else if (init instanceof FileSystemHandle && init.type === 'application/zip') {
      this.initTranscriptFromFile(init)
    } else if (init instanceof File && init.type === 'audio/ogg') {
      this.initTranscriptFromAudio(init)
    } else if ('backEndUrl' in init) {
      this.initTranscriptWithBackend(init.id, init.backEndUrl)
    } else if ('events' in init) {
      this.initTranscriptWithData(init.events, init.audio)
    }
  }

  events: LocalTranscriptEvent[] = []
  audio: AudioStore|null = null

  meta: TranscriptMetaData = {
    defaultTier: 'text',
    speakers: {},
    lockedTokens: [],
    tokenTypes: {},
    transcriptName: null,
    tiers: []
  }

  uiState = {
    selectedEventIds: [] as number[],
    selectedSearchResult: null as SearchResult|null,
    highlightedEventIds: [] as number[],
    inspectedEventId: null as number|null,
    searchResults: [] as SearchResult[],
    searchTerm: null as string|null,
    downloadProgress: null as number|null,
    showTranscriptMetaSettings: false,
    timeSpanSelection: {
      start: null as null|number,
      end: null as null|number
    }
  }

  initEmptyTranscript() {
    this.initTranscriptWithData([])
  }

  initTranscriptWithData(es: LocalTranscriptEvent[], audio?: AudioFileOrUrl) {
    if (audio !== undefined) {
      this.audio = new AudioStore(audio)
    }
    // Apply some cautious fixed to the events.
    const fixedEvents = Transcript.sortEvents(
      Transcript.removeBrokenFragmentLinks(
        computeTokenTypesForEvents(es, this.meta.defaultTier, Object.keys(this.meta.speakers))
      )
    )
    this.events = fixedEvents
  }

  /** Compute the type of a Token from its content. */
  static getTokenTypeFromToken(token: string): TokenTypePresetBase {
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

  /** Discriminate between strings that are token tier types and those that are not. */
  static isTokenTier(tier: string): tier is TokenTierType {
    return ['ortho', 'text', 'phon'].indexOf(tier) > -1
  }

  /** Check whether a certain Event contains a certain tier */
  static speakerEventHasTier(e: LocalTranscriptEvent, speakerId: string, tierId: string): boolean {
    return Transcript.isTokenTier(tierId) ||
      e.speakerEvents[speakerId] !== undefined &&
      e.speakerEvents[speakerId].speakerEventTiers[tierId] !== undefined
  }

  /** Check whether a certain Event contains a certain speaker */
  static eventHasSpeaker(e: LocalTranscriptEvent, speakerId: string): boolean {
    return e.speakerEvents[speakerId] !== undefined
  }

  /** Get the concatenated text from an Event tier for a speaker */
  static getTextFromTier(e: LocalTranscriptEvent, tier: string, speaker: string): string {
    if (Transcript.eventHasSpeaker(e, speaker)) {
      if (Transcript.isTokenTier(tier)) {
        return Transcript.getTextFromTokens(e.speakerEvents[speaker].tokens, tier)
      } else if (Transcript.speakerEventHasTier(e, speaker, tier)) {
        return e.speakerEvents[speaker].speakerEventTiers[tier].text
      } else {
        return ''
      }
    } else {
      return ''
    }
  }

  /** Get the concatenated text from a couple of tokens. */
  static getTextFromTokens(ts: LocalTranscriptToken[], defaultTier: TokenTierType): string {
    return ts.map(t => t.tiers[defaultTier].text).join(' ')
  }

  /** See which token occurs at a certain character offset. Returns the index or -1 if there’s no token at the offset. */
  static getTokenIndexByCharacterOffset(tokens: LocalTranscriptToken[], offset: number, tier: TokenTierType): number {
    let currentStart = 0
    return tokens.findIndex(e => {
      const currentEnd = currentStart + e.tiers[tier].text.length
      if (offset >= currentStart && offset <= currentEnd) {
        return true
      } else {
        currentStart = currentEnd + 1
        return false
      }
    })
  }

  /** Create a unique Id */
  static makeEventId() {
    return Number(_.uniqueId()) * -1
  }

  /** Create a unique Id */
  static makeTokenId() {
    return Number(_.uniqueId()) * -1
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

  /** Sort events by their start time. */
  static sortEvents(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
    return _.sortBy(es, (e) => e.startTime)
  }

  /** Generate a Token Hashmap from the Events, to process or look up tokens more quickly */
  static getIndexedTokens(es: LocalTranscriptEvent[]): { [id: number]: LocalTranscriptIndexedToken } {
    // this could be achieved with a reduce function,
    // but this version is currently faster (which matters at this point).
    const indexedTokens: { [id: number]: LocalTranscriptIndexedToken } = {}
    es.forEach((e, i) => {
      _(e.speakerEvents).forEach((se, speakerId) => {
        se.tokens.forEach(t => {
          indexedTokens[t.id] = { token: t, eventIndex: i, eventId: e.eventId, speakerId }
        })
      })
    })
    return indexedTokens
  }

  /** Removes any "fragmentOf" properties that have been orphaned
  (i.e. broken links to other tokens), and returns the clean Events */
  static removeBrokenFragmentLinks(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
    const tokensById = Transcript.getIndexedTokens(es)
    Object.values(tokensById).forEach(t => {
      if (
        // if it points to another token
        t.token.fragmentOf !== null &&
        // and that token doesn’t exist
        tokensById[t.token.fragmentOf] === undefined &&
        // and it’s an an event that exists.
        es[t.eventIndex] !== undefined
      ) {
        // replace the event with one that has the new token
        es[t.eventIndex] = {
          ...es[t.eventIndex],
          speakerEvents: {
            ...es[t.eventIndex].speakerEvents,
            [ t.speakerId ]: {
              ...es[t.eventIndex].speakerEvents[t.speakerId],
              tokens: es[t.eventIndex].speakerEvents[t.speakerId].tokens.map(t2 => {
                console.log('removing broken fragmentOf link', t)
                // replace the token
                if (t2.id === t.token.id) {
                  // remove the fragmentOf link.
                  return { ...t.token, fragmentOf: null }
                } else {
                  return t2
                }
              })
            }
          }
        }
      } else {
        // do nothing.
      }
    })
    return es
  }

  /** Get the last Token of an Event for a speaker. Returns undefined if not found. */
  static getLastTokenOfEvent(event: LocalTranscriptEvent|undefined, speakerId: number): LocalTranscriptToken|undefined {
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

  /** Checks whether this Event ends with a "=" to indicate a fragmented token. */
  static hasNextFragmentMarker(event: LocalTranscriptEvent|undefined, speakerId: number, tier: TokenTierType): boolean {
    if (event === undefined) {
      return false
    } else {
      const lastToken = Transcript.getLastTokenOfEvent(event, speakerId)
      if (lastToken !== undefined) {
        return lastToken.tiers[tier].text.endsWith('=')
      } else {
        return false
      }
    }
  }

  /** Checks whether a Speaker Event has Event Tiers and if there’s any content in those Event Tiers. */
  static hasEventTiers(se: LocalTranscriptSpeakerEvent): boolean {
    return (
      !_.isEmpty(se.speakerEventTiers) &&
      _.some(se.speakerEventTiers, (set) => set.text !== undefined && set.text.trim() !== '')
    )
  }

  /** Finds temporal overlaps of one Event across other Events.
   * Returns Three Arrays:
   * - Events that overlap our Event on the left side of it,
   * - Events that overlap in the middle or the entire thing,
   * - Events that overlap the right side of it */
  static findEventOverlaps(e: LocalTranscriptEvent, events: LocalTranscriptEvent[]): LocalTranscriptEvent[][] {
    const left: LocalTranscriptEvent[] = []
    const middle: LocalTranscriptEvent[] = []
    const right: LocalTranscriptEvent[] = []
    events.forEach(ev => {
      if (ev.eventId !== e.eventId) {
        // left side overlapped
        if (ev.startTime <= e.startTime && ev.endTime > e.startTime && ev.endTime <= e.endTime) {
          left.push(ev)
        } else if (
          (ev.startTime >= e.startTime && ev.endTime <= e.endTime) ||
          (ev.startTime <= e.startTime && ev.endTime >= e.endTime)
        ) {
          // fully overlapped or fully contained.
          middle.push(ev)
        } else if (ev.startTime < e.endTime && ev.startTime >= e.startTime && ev.endTime > e.endTime) {
          // right side overlapped
          right.push(ev)
        }
      }
    })
    return [ left, middle, right ]
  }

  /** Checks if the supplied events all "dock" to each other
   * (i. e. they have gaps between them that are smaller than the given amount.) */
  static isEventDockedToEvent(...es: LocalTranscriptEvent[]): boolean {
    return Transcript.sortEvents(es).every((e, i, l) => {
      return i === 0 || e.startTime - l[ i - 1].endTime <= settings.eventDockingInterval
    })
  }

  /** Returns an empty Speaker Event. */
  static makeSpeakerEvent(id: number): LocalTranscriptSpeakerEvent {
    return {
      speakerEventId: id,
      speakerEventTiers: {},
      tokens: []
    }
  }

  /** Split a list of tokens into two lists, at a graphemic offset factor (percentage between 0 and 1). */
  static splitTokensAtFactor(ts: LocalTranscriptToken[], factor: number): LocalTranscriptToken[][] {
    // _.partition would have been nicer here
    // but typescript keeps getting confused with it.
    return ts.reduce((m, e, i, l) => {
      m[ i / l.length <= factor ? 0 : 1 ].push(e)
      return m
    }, [[], []] as LocalTranscriptToken[][])
  }

  /** Gets a list of Speaker Ids from an Event */
  static getSpeakersFromEvents(es: LocalTranscriptEvent[]): string[] {
    return _(es)
      .flatMap(e => Object.keys(e.speakerEvents))
      .uniq()
      .value()
  }

  /** Finds all temporal gaps or "pauses" between Events that are longer than a certain duration  */
  static findEventGaps(es: LocalTranscriptEvent[], maxGap = .1): Array<{ duration: number, start: number, end: number }> {
    return es.reduce((m, e, i, l) => {
      const gap = l[i + 1] !== undefined ? l[i + 1].startTime - e.endTime : 0
      if (gap > maxGap) {
        m.push({ duration: gap, start: e.endTime, end: l[i + 1].startTime })
      }
      return m
    }, [] as Array<{ duration: number, start: number, end: number }>)
  }

  /** Convert a time string like '01:05:12' to a time offset in seconds */
  static timeToSeconds(time: string): number {
    const a = time.split(':') // split it at the colons
    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    return (+a[0]) * 60 * 60 + (+a[1] || 0) * 60 + (+a[2] || 0)
  }

  /** Convert a time offset in seconds to a string like '01:05:12' */
  static timeFromSeconds(seconds: number, decimalPlaces = 0): string {
    return new Date(seconds * 1000).toISOString().substr(11, 8 + (decimalPlaces > 0 ? decimalPlaces + 1 : 0))
  }

  /** Update the "order" prop of Tokens for a list of Events. In case they get jumbled. */
  static updateTokenOrder(es: LocalTranscriptEvent[]): LocalTranscriptEvent[] {
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

  /** Insert a pre-defined string into every Event that is empty. */
  static insertPlaceholderTokens(es: LocalTranscriptEvent[], defaultTier: TokenTierType): LocalTranscriptEvent[] {
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
                    id: Transcript.makeTokenId(),
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
    return Transcript.updateTokenOrder(newEs)
  }
}

