
import * as _ from 'lodash'
import parseTree, { ParsedXML } from '../service/transcript-parser'
import * as parseXML from '@rgrove/parse-xml'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
    peaks: any
  }
  interface Segment {
    color?: string
    editable?: boolean
    startTime: number
    endTime: number
    id: string
    labelText?: string
  }
  interface Transcript {
    name: string
    audioUrl?: string
    speakers: string[]
    segments: Segment[]
    speakerEvents: _.Dictionary<SpeakerEvent>
  }
  interface SegmentMetadata {
    tokens: string[]
  }
  interface SpeakerEvent {
    [key: string]: {
      tokens: string[]
    }
  }
}

interface Action {
  type: 'RESIZE'|'DELETE'|'CHANGE_TEXT'|'ADD'
  segment: Segment
}

let transcript: Transcript|null = null
export const history: Action[] = []

function transcriptTreeToTranscribable(tree: ParsedXML, name: string): Transcript {
  const segments = _(tree.speakers)
    .map(tiers => _.map(tiers, tier => _.map(tier.events, event => ({
      id: `${event.start}-${event.end}`,
      startTime: Number(event.startTime),
      endTime: Number(event.endTime)
    }) )))
    .flatten()
    .flatten()
    .flatten()
    .uniqBy(s => s.id)
    .orderBy(s => s.startTime)
    .value()
  const speakers = _(tree.speakers).map((t, v) => v).value()
  const speakerEvents = _(tree.speakers)
    .map((t, key) => {
      // only the first tier for now
      return _.toArray(t)[0].events.map(e => {
        return {
          start  : e.start,
          end    : e.end,
          tokens : e.text !== null ? e.text.trim().split(' ') : [],
          speaker: key
        }
      })
    })
    .flatten()
    .groupBy(e => `${e.start}-${e.end}`)
    .mapValues(spe => _.keyBy(spe, 'speaker'))
    .value()
  transcript = {
    name,
    audioUrl: '',
    speakerEvents,
    segments,
    speakers
  }
  // console.log(segments)
  return transcript
}

export function findSegmentById(id: string) {
  if (transcript !== null) {
    return _(transcript.segments).findIndex(s => s.id === id)
  } else {
    return  -1
  }
}

export function loadExmeraldaFile(fileName: string, xml: string) {
  return transcriptTreeToTranscribable(parseTree(parseXML(xml)), fileName)
}

export function resizeSegment(id: string, startTime: number, endTime: number) {
  if (transcript !== null) {
    const i = findSegmentById(id)
    history.push({
      type: 'RESIZE',
      segment: _.clone(transcript.segments[i])
    })
    transcript.segments[i].startTime = startTime
    transcript.segments[i].endTime = endTime
  }
}

export function addSegment(atTime: number) {
  if (transcript !== null) {
    const newSegment: Segment = {
      startTime: atTime,
      endTime: atTime + 1,
      labelText: '',
      id: _.uniqueId('user-segment-')
    }
    history.push({
      type: 'ADD',
      segment: newSegment
    })
    transcript.segments.push(newSegment)
    return newSegment
  }
}

export function deleteSegment(segment: Segment) {
  if (transcript !== null) {
    console.log(segment)
    const i = findSegmentById(segment.id)
    history.push({
      type: 'DELETE',
      segment: _.clone(transcript.segments[i])
    })
    transcript.segments.splice(i, 1)
  }
}

export function splitSegment(segment: Segment, splitAt: number): Segment[] {
  if (transcript !== null) {
    const i = _(transcript.segments).findIndex(s => s.id === segment.id)
    const oldEndTime = segment.endTime
    const newSegment: Segment = {
      startTime: segment.startTime + splitAt,
      endTime: oldEndTime,
      labelText: segment.labelText,
      id: _.uniqueId('user-segment-')
    }
    segment.endTime = segment.startTime + splitAt
    transcript.segments.splice(i + 1, 0, newSegment)
    return [ segment, newSegment ]
  } else {
    return []
  }
}

export function findSegmentAt(seconds: number): Segment|undefined {
  if (transcript !== null) {
    return _(transcript.segments).find((s) => {
      return s.startTime <= seconds && s.endTime >= seconds
    })
  }
}

export default transcript
