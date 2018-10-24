
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
    events?: LocalTranscriptEvent[]
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
  interface ServerTranscriptListItem {
    pk: number
    ut: string
    n: string
  }
}

interface ServerTranscript {
  aTokens: {
    [token_id: string]: ServerToken
  }
  aEinzelErhebung?: {
    af: string
    d: string
    dp: string
    e: number
    pk: number
    trId: number
  }
  aInformanten?: {
    [speaker_id: number]: {
      ka: string // name anonymized
      k: string // name
    }
  }
  aTranscript?: {
    n: string // name
    pk: number
    ut: string
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

interface LocalTranscriptTokeTier {
  text: string
  type: number|null
}

interface LocalTranscriptToken {
  id: number
  tiers: {
    default: LocalTranscriptTokeTier
    [tier: string]: LocalTranscriptTokeTier
  }
}

interface LocalTranscriptEvent {
  eventId: number
  startTime: number
  endTime: number,
  speakerEvents: {
    [speakerId: string]: LocalTranscriptToken[]
  }
}

export type LocalTranscript = LocalTranscriptEvent[]

interface Action {
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'
  segment: Segment
  speakerEvents?: SpeakerEvent[]
}

let transcript: Transcript|null = null
export const history: Action[] = []

function transcriptTreeToTranscribable(tree: ParsedXML, name: string): Transcript {
  console.log({tree})
  const speakers = _(tree.speakers).map((v, k) => k).value()
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

  const speakerEvents = _(tree.speakers)
    .map((tiers, key) => {
      // only the first tier for now
      return _.toArray(tiers)[0].events.map(e => {
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
    if (transcript.speakerEvents[segment.id][speaker]) {
      transcript.speakerEvents[segment.id][speaker].tokens = tokens
    }
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

function timeToSeconds(time: string) {
  const chunks = _.map(time.split(':'), Number)
  return (
      chunks[0] * 60 * 60 // hours
    + chunks[1] * 60      // minutes
    + chunks[2]           // seconds
  )
}

function serverTranscriptToTranscript(s: ServerTranscript, t: Transcript): Transcript {
  const speakers = _.map(s.aInformanten || [], (i, k) => String(k))
  const audioUrl = (() => {
    if (s.aEinzelErhebung) {
      return `https://dissdb.dioe.at/private-media${
        s.aEinzelErhebung.dp.split('\\').join('/')
      }${
        s.aEinzelErhebung.af
      }.ogg`
    } else {
      return t.audioUrl
    }
  })()
  const segments = _.map(s.aEvents, (e) => {
    return {
      id: String(e.pk),
      startTime: timeToSeconds(e.s),
      endTime: timeToSeconds(e.e)
    }
  })
  const speakerEvents = _(s.aEvents)
    .keyBy('pk')
    .mapValues((e) => {
      return _(e.tid).mapValues((ts) => {
        return {
          tokens: _(ts).map(ti => s.aTokens[ti].t).value()
        }
      }).value()
    })
    .value()
  console.log('combined speaker events:', {
    ...t.speakerEvents,
    ...speakerEvents
  })
  return {
    audioUrl,
    name: t.name || (s.aTranscript ? s.aTranscript.n : ''),
    speakers: speakers.length > 0 ? speakers : t.speakers,
    segments: t.segments.concat(segments),
    speakerEvents: {
      ...t.speakerEvents,
      ...speakerEvents
    }
  }
}

function serverTranscriptToLocal(s: ServerTranscript): LocalTranscript {
  const x = _.map(s.aEvents, (e) => {
    return {
      eventId: e.pk,
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
                text: s.aTokens[id].to,
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

export async function getTranscriptNew(
  id: number,
  onProgress = (v: number): any => v,
  chunk = 0,
  buffer: LocalTranscript = [],
  totalSteps?: number,
): Promise<LocalTranscript> {
  try {

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps)
    }
    // console.log(serverTranscriptToLocal(res))
    if (res.nNr > res.aNr)  {
      return getTranscriptNew(
        id,
        onProgress,
        chunk + 1,
        buffer.concat(serverTranscriptToLocal(res)),
        totalSteps || res.aTmNr
      )
    } else {
      return buffer
    }
  } catch (e) {
    return buffer
  }
}

export async function getTranscript(
  id: number,
  onProgress: (p: number, t: Transcript|null) => any,
  chunk = 0,
  totalSteps?: number,
): Promise<Transcript> {
  try {

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps, transcript)
    }
    // console.log(serverTranscriptToLocal(res))
    if (res.nNr > res.aNr)  {
      if (transcript === null) {
        transcript = {
          audioUrl: '',
          name: '',
          segments: [],
          speakerEvents: {},
          speakers: []
        }
      }
      transcript = serverTranscriptToTranscript(res, transcript)
      return getTranscript(
        id,
        onProgress,
        chunk + 1,
        totalSteps || res.aTmNr,
      )
    } else {
      return transcript!
    }
  } catch (e) {
    return transcript!
  }
}


export default transcript
