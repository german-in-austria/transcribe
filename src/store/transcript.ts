
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
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'
  segment: Segment
  speakerEvents?: SpeakerEvent[]
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

export function findSpeakerEventById(id: string): SpeakerEvent|null {
  if (transcript !== null) {
    return transcript.speakerEvents[id]
  } else {
    return null
  }
}

export function loadExmeraldaFile(fileName: string, xml: string) {
  return transcriptTreeToTranscribable(parseTree(parseXML(xml)), fileName)
}

export function updateSpeakerTokens(segment: Segment, speaker: string, tokens: string[]) {
  if (transcript !== null) {
    history.push({
      type: 'CHANGE_TOKENS',
      segment: _.clone(segment),
      speakerEvents: [
        {
          [speaker]: _.clone(transcript.speakerEvents[segment.id][speaker])
        }
      ]
    })
    transcript.speakerEvents[segment.id][speaker].tokens = tokens
  }
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
    const i = findSegmentById(segment.id)
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

interface ServerTranscript {
  aTokens: {
    [token_id: string]: ServerToken
  }
  aEvents: ServerEvent[]
  nNr: number
  aNr: number
  aTmNr?: number
}

interface ServerToken {
  tr: number // token reihung
  tt: number // token type
  sr: number // sequence in sentence
  t: string // text
  to: string // text in ortho
  s: number // sentence id
  i: number // inf id
  e: number // event id
}

interface ServerEvent {
  pk: number
  tid: {
    [speaker_id: string]: number[]
  }
  e: string // end
  s: string // start
  l: 0
}

interface TranscriptChunk {
  tokens: {
  }
  events: any[]
}

function timeToSeconds(time: string) {
  const chunks = _.map(time.split(':'), Number)
  return (
      chunks[0] * 60 * 60 // hours
    + chunks[1] * 60      // minutes
    + chunks[2]           // seconds
  )
}

function serverTranscriptToLocal(s: ServerTranscript) {
  const x = _.map(s.aEvents, (e) => {
    return {
      event_id: e.pk,
      startTime: timeToSeconds(e.s),
      endTime: timeToSeconds(e.e),
      speakerEvents: _.mapValues(e.tid, (tokenIds) => {
        return _.map(tokenIds, (id) => {
          return {
            id,
            tiers : {
              default: {
                text: s.aTokens[id].t,
                type: s.aTokens[id].tt
              },
              ortho: {
                // TODO: not "text_in_ortho", but "ortho".
                ortho: s.aTokens[id].to,
                type: null
              }
            }
          }
        })
      })
    }
  })
  return x
}

export async function getTranscript(
  id: number,
  onProgress = (v: number) => v,
  chunk = 0,
  buffer: TranscriptChunk[] = [],
  totalSteps?: number,
): Promise<TranscriptChunk[]> {
  try {

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps)
    }
    console.log(serverTranscriptToLocal(res))
    if (res.nNr > res.aNr)  {
      return getTranscript(id, onProgress, chunk + 1, buffer.concat({
        tokens: res.aTokens,
        events: res.aEvents
      }), totalSteps || res.aTmNr)
    } else {
      return buffer
    }
  } catch (e) {
    console.log(e)
    return buffer
  }
}

export default transcript
