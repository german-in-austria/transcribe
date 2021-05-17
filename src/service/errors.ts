import _ from 'lodash'
import { LocalTranscriptEvent, sortEvents, eventStore } from '../store/transcript'
import settings from '../store/settings'

interface GapMetadata {
  duration: number
}

type OverlapMetadata = null

type UnknownTokenMetadata = null

export interface ErrorEvent {
  error_id: string
  error_type: 'event_overlap'|'unknown_token'|'event_gap'
  event: LocalTranscriptEvent
  metadata: GapMetadata|OverlapMetadata|UnknownTokenMetadata|null
}

export function getErrors(es: LocalTranscriptEvent[]): ErrorEvent[] {
  const events = sortEvents(es)
  const errors: ErrorEvent[] = ([] as ErrorEvent[])
    // find events with overlaps
    .concat(
      settings.showErrors.eventOverlaps === false
        ? []
        : events.filter((e, i) => {
          return events[i - 1] !== undefined && +e.startTime.toFixed(2) < +events[i - 1].endTime.toFixed(2)
        })
          .map(e => ({
            error_id: 'overlap_' + e.eventId,
            error_type: 'event_overlap',
            event: e,
            metadata: null
          } as ErrorEvent))
    )
    // find events with unknown types
    .concat(
      settings.showErrors.unknownTokenTypes === false
        ? []
        : events.filter((e) => {
          return _(e.speakerEvents).some((se) => {
            return _(se.tokens).some((t) => t.tiers[eventStore.metadata.defaultTier].type === -1)
          })
        })
          .map(e => ({
            error_id: 'unknown_' + e.eventId,
            error_type: 'unknown_token',
            event: e,
            metadata: null
          } as ErrorEvent))
    )
    // find gaps
    .concat(
      settings.showErrors.eventGaps === false
        ? []
        : es.reduce((m, e, i, l) => {
          const gap = l[i + 1] !== undefined ? l[i + 1].startTime - e.endTime : 0
          if (gap > settings.maxEventGap) {
            m.push({
              error_id: 'gap_' + e.eventId,
              error_type: 'event_gap',
              event: e,
              metadata: {
                duration: gap
              }
            } as ErrorEvent)
          }
          return m
        }, [] as ErrorEvent[])
    )
  return _.sortBy(errors, (e) => e.event.startTime)
}
