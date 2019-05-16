import _ from 'lodash'
import {
  ServerInformant,
  makeEventId,
  makeTokenId,
  ServerEvent,
  ServerSurvey,
  ServerToken,
  ServerTranscript,
  ServerTranscriptInformants,
  timeFromSeconds,
  tokenize
} from '@store/transcript'

import settings from '../store/settings'
import * as parseXML from '@rgrove/parse-xml'
import { padEnd } from '@util/index'

interface BasicNode {
  attributes: object
  children?: BasicNode[]
  name?: string
  parent: BasicNode | null
  toJSON: () => string
  type: string
  text?: string
}
interface EventNode extends BasicNode {
  name: 'event'
  attributes: {
    start: string
    end: string
  }
  type: 'element'
  children: BasicNode[]
}
interface TierNode extends BasicNode {
  name: 'tier'
  attributes: {
    category: string
    'display-name': string
    id: string
    speaker: string
    type: string
  }
  type: 'element'
  children: EventNode[] | BasicNode[]
}

interface TliNode extends BasicNode {
  name: 'tli'
  attributes: {
    id: string
    time: string
  }
  type: 'element'
  children: never[]
}

interface TierEvent {
  start: string
  end: string
  startTime: string
  endTime: string
  text: string
}

interface Tier {
  category: string
  display_name: string
  events: TierEvent[]
  type: string
}

export interface SpeakerTierImportable extends Tier {
  speaker_name: string
  select_for_import: boolean
  to_tier_type: string|null
  to_speaker: ServerInformant|null
  to_tier_name: string|null,
  default_tier_type: null|'text'|'ortho'
}

interface Tiers {
  [key: string]: Tier
}

interface Timeline {
  [key: string]: any
}

interface Speakers {
  [key: string]: Tiers
}

export interface ParsedExmaraldaXML {
  timeline: Timeline
  speakers: Speakers
  speakerTiers: SpeakerTierImportable[]
}

export function exmaraldaToImportable(fileName: string, xml: string): ParsedExmaraldaXML {
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
          // TODO: for Default Tiers and Tokenized Tiers,
          // this should happen on a per speaker basis,
          // not per speaker tier, as to unify all tiers
          // into the same token.
          const eventTokenIds = _(tokenize(text))
            .filter((t) => t !== '')
            .map((t: string, tokenIndex): number => {
              const tokenId = makeTokenId()
              const token = {
                // TODO: see above
                t: speakerTier.default_tier_type === 'text' ? t : '',
                o: speakerTier.default_tier_type === 'ortho' ? t : '',

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

export default function parseTree(xmlTree: BasicNode): ParsedExmaraldaXML {

  if (xmlTree.children && xmlTree.children[0] && xmlTree.children[0].children) {
    const basicBody = _(xmlTree.children[0].children).find({ name: 'basic-body' })
    if (basicBody !== undefined) {
      const commonTimeline = _(basicBody.children).find({ name: 'common-timeline' })
      const tiers = _(basicBody.children).filter((t) => t.name === 'tier').value() as TierNode[]
      if (commonTimeline !== undefined) {

        const commonTimelineByTli = _(commonTimeline.children)
          .filter((t) => t.name === 'tli')
          .keyBy((t: TliNode) => t.attributes.id)
          .mapValues((t: TliNode) => t.attributes.time)
          .value()

        const tiersBySpeakers = _(tiers)
          .groupBy(t => t.attributes.speaker)
          .mapValues(speakerTiers => {
            return _(speakerTiers)
              .keyBy(t => t.attributes.id)
              .mapValues(tier => {
                return {
                  type: tier.attributes.type,
                  category: tier.attributes.category,
                  display_name: tier.attributes['display-name'],
                  events: (tier.children as BasicNode[])
                    .filter((t): t is EventNode => t.name === 'event')
                    .map((t) => {
                      return {
                        start: t.attributes.start,
                        end: t.attributes.end,
                        startTime: String(commonTimelineByTli[t.attributes.start]),
                        endTime: String(commonTimelineByTli[t.attributes.end]),
                        text: t.children && t.children[0] ? t.children[0].text : null
                      } as TierEvent
                    })
                }
              })
              .value()
          })
          .value()
        return {
          timeline: commonTimelineByTli,
          speakers: tiersBySpeakers,
          speakerTiers: _(tiersBySpeakers).reduce((m, el, i, l) => {
            return m.concat(_(el).map(v => ({
              speaker_name: i,
              select_for_import: true,
              to_speaker: null,
              to_tier_type: null,
              to_tier_name: null,
              default_tier_type: null,
              ...v
            })).value())
          }, [] as any[])
        }
      } else {
        throw new Error('cannot parse xml')
      }
    } else {
      throw new Error('cannot parse xml')
    }
  } else {
    throw new Error('cannot parse xml')
  }

}
