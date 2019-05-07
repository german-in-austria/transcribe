import parseTree, { ParsedExmaraldaXML } from '../exmaralda-parser'
import { makeEventId, ServerTranscript, ServerToken, makeTokenId, ServerEvent } from '../../store/transcript'
import settings from '../../store/settings'
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

export function loadExmaraldaFile(fileName: string, xml: string): ParsedExmaraldaXML {
  return parseTree(parseXML(xml))
}

export function transcriptTreeToServerTranscript(tree: ParsedExmaraldaXML, name: string): ServerTranscript {
  let tokens: _.Dictionary<ServerToken> = {}
  const events = _(tree.speakerTiers)
    .map((speakerTier) => {
      let tokenOrder = 0
      if (speakerTier.to_speaker === null) {
        console.error('No speaker specified', { speakerTier })
        throw new Error('No speaker specified')
      } else {
        return speakerTier.events.map((e): ServerEvent => {
          const eventId = makeEventId()
          const eventTokens = _(e.text.split(' '))
            .filter((t) => t !== '')
            .map((t: string, tokenIndex): ServerToken => {
              return {
                // TODO: choose between "text" and "ortho"
                // based on default tier selection
                t,
                to: '',

                tr: tokenOrder++,
                e: eventId,
                // TODO: to_speaker should be an object
                // containing the abbrev + the ID, so we
                // can use the ID here
                i: Number(speakerTier.to_speaker), // wrong
                s: 0,
                sr: 0,
                tt: (() => {
                  const type = _(settings.tokenTypes).find((tt) => {
                    return tt.regex.test(t)
                  })
                  return type ? type.id : -1
                })()
              }
            })
            .keyBy(String(makeTokenId()))
            .value()

          tokens = {
            ...tokens,
            ...eventTokens
          }

          return {
            pk: eventId,
            e: e.endTime,
            s: e.startTime,
            l: 0,
            tid: {
              // TODO: to_speaker ID!!
              [ speakerTier.to_speaker! ]: _(eventTokens).map((v, k) => Number(k)).value()
            }
          }
        })
      }
    })
    .flatten()
    .value()

  return {
    aTokens: tokens,
    aEvents: events,
    aNr: 0,
    nNr: 0
  }
}
