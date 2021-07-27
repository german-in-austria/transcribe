import _ from 'lodash'
import { LocalTranscriptEvent, sortEvents, eventStore } from '../store/transcript'
import settings from '../store/settings'

interface GapMetadata {
  duration: number
}

type OverlapMetadata = null

type UnknownTokenMetadata = null

export interface WarningEvent {
  warning_id: string
  warning_type: 'event_overlap'|'unknown_token'|'event_gap'
  event: LocalTranscriptEvent
  metadata: GapMetadata|OverlapMetadata|UnknownTokenMetadata|null
}

export function getWarnings(es: LocalTranscriptEvent[]): WarningEvent[] {
  const events = sortEvents(es)
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
    // find events with unknown types
    .concat(
      settings.showWarnings.unknownTokenTypes === false
        ? []
        : events.filter((e) => {
          return _(e.speakerEvents).some((se) => {
            return _(se.tokens).some((t) => t.tiers[eventStore.metadata.defaultTier].type === -1)
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
  return _.sortBy(warnings, (e) => e.event.startTime)
}