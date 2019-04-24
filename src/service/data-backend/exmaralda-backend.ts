import parseTree, { ParsedExmaraldaXML } from '../exmaralda-parser'
import { makeEventId } from '../../store/transcript'
import * as parseXML from '@rgrove/parse-xml'
import _ from 'lodash'

interface Segment {
  color?: string
  editable?: boolean
  startTime: number
  endTime: number
  id: number
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

let transcript: Transcript|null = null

export function loadExmaraldaFile(fileName: string, xml: string): ParsedExmaraldaXML {
  return parseTree(parseXML(xml))
}

export function transcriptTreeToTranscribable(tree: ParsedExmaraldaXML, name: string): Transcript {
  console.log({tree})
  const speakers = _(tree.speakers).map((v, k) => k).value()
  const segments = _(tree.speakers)
    .map(tiers => _.map(tiers, tier => _.map(tier.events, event => ({
      id: makeEventId(),
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
