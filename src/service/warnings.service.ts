import _ from 'lodash'
import { TranscriptEvent, TokenTierType } from '../types/transcript'
import settings from '../store/settings.store'
import Transcript from '../classes/transcript.class'
import store from '@/store'

interface GapMetadata {
  duration: number
}

type OverlapMetadata = null

type UnknownTokenMetadata = null

type TokenId = any

export interface WarningEvent {
  warning_id: string
  warning_type: 'event_overlap'|'empty_token'|'unknown_token'|'event_gap'
  event: TranscriptEvent
  metadata: GapMetadata|OverlapMetadata|UnknownTokenMetadata|TokenId|null
}

function getEmptyTokens(e: any, defaultTier: any): any {
  // _(e.speakerEvents).map((se) => _(se.tokens).map((t) => t.tiers[ defaultTier ].text.length === 0 ? t.id : null))
  let tokens = [] as any
  _(e.speakerEvents).forEach((se) => {
    _(se.tokens).forEach((t) => {
      if (t.tiers[ defaultTier ].text.length === 0) {
        tokens.push(t.id)
      }
    })
  })
  return tokens
}

export function getWarnings(es: TranscriptEvent[]): WarningEvent[] {
  const defaultTier = store.transcript?.meta.defaultTier || 'text'
  const events = Transcript.sortEvents(es)
  const warnings: WarningEvent[] = ([] as WarningEvent[])
    // find events with overlaps
    .concat(
      settings.showWarnings.eventOverlaps === false
        ? []
        : events.filter((e, i) => {
          return events[i - 1] !== undefined && +e.startTime.toFixed(2) < +events[i - 1].endTime.toFixed(2)
        })
          .map(e => ({
            warning_id: 'overlap_' + e.eventId,
            warning_type: 'event_overlap',
            event: e,
            metadata: null
          } as WarningEvent))
    )
    // find events with empty tokens
    .concat(
      settings.showWarnings.emptyTokens === false
        ? []
        : events.filter((e) => {
          return _(e.speakerEvents).some((se) => {
            return _(se.tokens).some((t) => t.tiers[ defaultTier ].text.length === 0)
          })
        })
          .map(e => ({
            warning_id: 'empty_' + e.eventId,
            warning_type: 'empty_token',
            event: e,
            metadata: getEmptyTokens(e, defaultTier)
          } as WarningEvent))
    )    // find events with unknown types
    .concat(
      settings.showWarnings.unknownTokenTypes === false
        ? []
        : events.filter((e) => {
          return _(e.speakerEvents).some((se) => {
            return _(se.tokens).some((t) => t.tiers[ defaultTier ].type === -1 && t.tiers[ defaultTier ].text.length > 0)
          })
        })
          .map(e => ({
            warning_id: 'unknown_' + e.eventId,
            warning_type: 'unknown_token',
            event: e,
            metadata: null
          } as WarningEvent))
    )
    // find gaps
    .concat(
      settings.showWarnings.eventGaps === false
        ? []
        : es.reduce((m, e, i, l) => {
          const gap = l[i + 1] !== undefined ? l[i + 1].startTime - e.endTime : 0
          if (gap > settings.maxEventGap) {
            m.push({
              warning_id: 'gap_' + e.eventId,
              warning_type: 'event_gap',
              event: e,
              metadata: {
                duration: gap
              }
            } as WarningEvent)
          }
          return m
        }, [] as WarningEvent[])
    )
  // console.log(warnings)
  return _.sortBy(warnings, (e) => e.event.startTime)
}
