import parseTree, { ParsedExmaraldaXML } from '../exmaralda-parser'
import {
  makeEventId,
  makeTokenId,
  ServerEvent,
  ServerSurvey,
  ServerToken,
  ServerTranscript,
  ServerTranscriptInformants,
  timeFromSeconds,
  tokenize
} from '../../store/transcript'
import settings from '../../store/settings'
import * as parseXML from '@rgrove/parse-xml'
import { padEnd } from '@util/index'
import _ from 'lodash'

export function loadExmaraldaFile(fileName: string, xml: string): ParsedExmaraldaXML {
  return parseTree(parseXML(xml))
}

function getTokenTypeId(t: string): number {
  const type = _(settings.tokenTypes).find((tt) => {
    return tt.regex.test(t)
  })
  return type ? type.id : -1
}

export function transcriptTreeToServerTranscript(
  tree: ParsedExmaraldaXML,
  name: string,
  selectedSurvey: ServerSurvey
): ServerTranscript {
  const tokens: _.Dictionary<ServerToken> = {}
  const events = _(tree.speakerTiers)
    .filter(st => st.select_for_import === true)
    .map((speakerTier) => {
      let tokenOrder = 0
      if (speakerTier.to_speaker === null) {
        console.error('No speaker specified', { speakerTier })
        throw new Error('No speaker specified')
      } else {
        return _(speakerTier.events).map((e): ServerEvent => {
          const eventId = makeEventId()
          const text = e.text || ''
          const eventTokenIds = _(tokenize(text))
            .filter((t) => t !== '')
            .map((t: string, tokenIndex): number => {
              const tokenId = makeTokenId()
              const token = {
                // TODO: choose between "text" and "ortho"
                // based on default tier selection
                t,
                o: '',

                to: '',
                tr: tokenOrder++,
                e: eventId,
                i: speakerTier.to_speaker!.pk,
                s: 0,
                sr: 0,
                tt: getTokenTypeId(t)
              }
              tokens[tokenId] = token
              return tokenId
            })
            .value()

          return {
            pk: eventId,
            e: padEnd(timeFromSeconds(Number(e.endTime)), 14, '0'),
            s: padEnd(timeFromSeconds(Number(e.startTime)), 14, '0'),
            l: 0,
            tid: {
              [ speakerTier.to_speaker!.pk ]: eventTokenIds
            }
          }
        })
        .value()
      }
    })
    .flatten()
    .value()

  return {
    aEinzelErhebung: {
      af: selectedSurvey.Audiofile,
      d: selectedSurvey.Datum,
      dp: selectedSurvey.Dateipfad,
      e: selectedSurvey.ID_Erh,
      pk: selectedSurvey.pk,
      trId: -1
    },
    aInformanten: _(selectedSurvey.FX_Informanten).reduce((m, e, i, l) => {
      m[e.pk] = {
        k: e.Kuerzel,
        ka: e.Kuerzel_anonym || ''
      }
      return m
    }, {} as ServerTranscriptInformants),
    aTokens: tokens,
    aEvents: events,
    aTranskript: {
      n: name,
      pk: -1,
      ut: 'now' // TODO:
    },
    aNr: 0,
    nNr: 0
  }
}
