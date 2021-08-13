
import { ProjectPreset, TokenTypePresetBase } from '@/presets'
import { TranscriptEvent, TranscriptIndexedToken, TranscriptSpeakerEvent, TranscriptToken, TokenTierType } from '@/types/transcript'
import _ from 'lodash'

/**
 * A class with *static* methods for modifying and
 * analyzing events or lists of events, and no constructor or state.
 */
export default class EventService {
  /** Compute the type of a Token from its content. */
  static getTokenTypeFromToken(
    token: string,
    preset: ProjectPreset
  ): TokenTypePresetBase {
    const type = _(preset.tokenTypes).find((tt) => {
      return tt.type === 'single' && tt.regex.test(token.replace('=', ''))
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

  /** Discriminate between strings that are token tier types and those that are not. */
  static isTokenTier(tier: string): tier is TokenTierType {
    return ['ortho', 'text', 'phon'].indexOf(tier) > -1
  }

  /** Check whether a certain Event contains a certain tier */
  static speakerEventHasTier(e: TranscriptEvent, speakerId: string, tierId: string): boolean {
    return EventService.isTokenTier(tierId) ||
      e.speakerEvents[speakerId] !== undefined &&
      e.speakerEvents[speakerId].speakerEventTiers[tierId] !== undefined
  }

  /** Check whether a certain Event contains a certain speaker */
  static eventHasSpeaker(e: TranscriptEvent, speakerId: string): boolean {
    return e.speakerEvents[speakerId] !== undefined
  }

  /** Get the concatenated text from an Event tier for a speaker */
  static getTextFromTier(e: TranscriptEvent, tier: string, speaker: string): string {
    if (EventService.eventHasSpeaker(e, speaker)) {
      if (EventService.isTokenTier(tier)) {
        return EventService.getTextFromTokens(e.speakerEvents[speaker].tokens, tier)
      } else if (EventService.speakerEventHasTier(e, speaker, tier)) {
        return e.speakerEvents[speaker].speakerEventTiers[tier].text
      } else {
        return ''
      }
    } else {
      return ''
    }
  }

  /** Get the concatenated text from a couple of tokens. */
  static getTextFromTokens(ts: TranscriptToken[], defaultTier: TokenTierType): string {
    return ts.map(t => t.tiers[defaultTier].text).join(' ')
  }

  /** See which token occurs at a certain character offset. Returns the index or -1 if there’s no token at the offset. */
  static getTokenIndexByCharacterOffset(tokens: TranscriptToken[], offset: number, tier: TokenTierType): number {
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

  /** Sort events by their start time. */
  static sortEvents(es: TranscriptEvent[]): TranscriptEvent[] {
    return _.sortBy(es, (e) => e.startTime)
  }

  /** Generate a Token Hashmap from the Events, to process or look up tokens more quickly */
  static getIndexedTokens(es: TranscriptEvent[]): { [id: number]: TranscriptIndexedToken } {
    // this could be achieved with a reduce function,
    // but this version is currently faster (which matters at this point).
    const indexedTokens: { [id: number]: TranscriptIndexedToken } = {}
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
  (i.e. broken links to other tokens), and returns the fixed/cleaned Events */
  static removeBrokenFragmentLinks(es: TranscriptEvent[]): TranscriptEvent[] {
    const tokensById = EventService.getIndexedTokens(es)
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
  static getLastTokenOfEvent(event: TranscriptEvent|undefined, speakerId: number): TranscriptToken|undefined {
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
  static hasNextFragmentMarker(event: TranscriptEvent|undefined, speakerId: number, tier: TokenTierType): boolean {
    if (event === undefined) {
      return false
    } else {
      const lastToken = EventService.getLastTokenOfEvent(event, speakerId)
      if (lastToken !== undefined) {
        return lastToken.tiers[tier].text.endsWith('=')
      } else {
        return false
      }
    }
  }

  /** Checks whether a Speaker Event has Event Tiers and if there’s any content in those Event Tiers. */
  static hasEventTiers(se: TranscriptSpeakerEvent): boolean {
    return (
      !_.isEmpty(se.speakerEventTiers) &&
      _.some(se.speakerEventTiers, (set) => set.text !== undefined && set.text.trim() !== '')
    )
  }

  /** Finds temporal overlaps of one Event across other Events.
   * Returns Three Arrays:
   * - Events that overlap our Event on the left side of it,
   * - Events that overlap in the middle or completely,
   * - Events that overlap the right side of it */
  static findEventOverlaps(e: TranscriptEvent, events: TranscriptEvent[]): TranscriptEvent[][] {
    const left: TranscriptEvent[] = []
    const middle: TranscriptEvent[] = []
    const right: TranscriptEvent[] = []
    events.forEach(ev => {
      if (ev.eventId !== e.eventId) {
        if (ev.startTime <= e.startTime && ev.endTime > e.startTime && ev.endTime <= e.endTime) {
          // left side overlapped
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
  static isEventDockedToEvent(es: TranscriptEvent[], maxDistance: number): boolean {
    return EventService.sortEvents(es).every((e, i, l) => {
      return i === 0 || e.startTime - l[ i - 1].endTime <= maxDistance
    })
  }

  /** Returns an empty Speaker Event. */
  static makeSpeakerEvent(id: number): TranscriptSpeakerEvent {
    return {
      speakerEventId: id,
      speakerEventTiers: {},
      tokens: []
    }
  }

  /** Split a list of tokens into two lists, at a graphemic offset factor (percentage between 0 and 1). */
  static splitTokensAtFactor(ts: TranscriptToken[], factor: number): TranscriptToken[][] {
    // _.partition would have been nicer here
    // but typescript keeps getting confused with it.
    return ts.reduce((m, e, i, l) => {
      m[ i / l.length <= factor ? 0 : 1 ].push(e)
      return m
    }, [[], []] as TranscriptToken[][])
  }

  /** Gets a list of Speaker Ids from an Event */
  static getSpeakersFromEvents(es: TranscriptEvent[]): string[] {
    return _(es)
      .flatMap(e => Object.keys(e.speakerEvents))
      .uniq()
      .value()
  }

  /** Finds all temporal gaps or "pauses" between Events that are longer than a certain duration  */
  static findEventGaps(es: TranscriptEvent[], maxGap = .1): Array<{ duration: number, start: number, end: number }> {
    return es.reduce((m, e, i, l) => {
      const gap = l[i + 1] !== undefined ? l[i + 1].startTime - e.endTime : 0
      if (gap > maxGap) {
        m.push({ duration: gap, start: e.endTime, end: l[i + 1].startTime })
      }
      return m
    }, [] as Array<{ duration: number, start: number, end: number }>)
  }

  /** Update the "order" prop of Tokens for a list of Events. In case they get jumbled. */
  static updateTokenOrder(es: TranscriptEvent[]): TranscriptEvent[] {
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
}
