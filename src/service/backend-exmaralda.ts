import _ from 'lodash'
import {
  ServerEvent,
  ServerSurvey,
  ServerToken,
  ServerInformant,
  ServerTranscript,
  ServerTranscriptInformants,
} from '../service/backend-server'

import {
  makeEventId,
  makeTierId,
  makeTokenId,
  timeFromSeconds,
  tokenize,
  TokenTierType,
  tokenTypeFromToken
} from '../store/transcript'

import * as parseXML from '@rgrove/parse-xml'
import { padEnd } from '../util/index'

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
  text: string|null
}

interface Tier {
  id: string
  category: string
  display_name: string
  events: TierEvent[]
  type: string
}

export interface SpeakerTierImportable extends Tier {
  speaker_name: string
  select_for_import: boolean
  to_tier_type: 'tokenized'|'freeText'|'default'|null
  to_speaker: ServerInformant|null
  to_tier_name: string|null
  token_tier_type: TokenTierType
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
  fileName: string
  timeline: Timeline
  speakers: Speakers
  speakerTiers: SpeakerTierImportable[]
}

export function exmaraldaToImportable(fileName: string, xml: string): ParsedExmaraldaXML {
  return parseTree(parseXML(xml), fileName)
}

function getTokenTypeId(t: string): number {
  return tokenTypeFromToken(t).id
}

function getTierToken(
    speakerTiers: SpeakerTierImportable[],
    tierType: TokenTierType,
    tierEvent: TierEvent,
    tokenIndex: number,
  ): string|null {
    const tier = _(speakerTiers).find(t => t.select_for_import === true && t.token_tier_type === tierType)
    // this speaker does not have this type of token tier
    if (tier === undefined) {
      return null
    } else {
      const event = _(tier.events).find(e => e.startTime === tierEvent.startTime)
      // this event does not exist in this token tier.
      if (event === undefined || event.text === undefined || event.text === null) {
        return null
      } else {
        return tokenize(event.text)[tokenIndex] || null
      }
    }
}

export function importableToServerTranscript(
  importable: ParsedExmaraldaXML,
  name: string,
  selectedSurvey: ServerSurvey,
  defaultTier: TokenTierType,
): ServerTranscript {

  const tiersBySpeakers = _(importable.speakerTiers)
    .filter(st => st.select_for_import === true)
    .map(st => {
      return st.to_tier_type === 'default'
        ? {...st, token_tier_type: defaultTier}
        : st
    })
    .groupBy(st => st.to_speaker!.pk)
    .value()

  const tokens: _.Dictionary<ServerToken> = {}
  const tiers: ServerTranscript['aTiers'] = {}

  const events = _(tiersBySpeakers)
    .map(speakerTiers => {
      // console.log({speakerTiers})
      return _(speakerTiers)
        // only the default tier and free text (event_tier) tiers
        .filter(st => st.to_tier_type === 'default' || st.to_tier_type === 'freeText')
        .map(speakerTier => {
          let tokenOrder = 0
          if (speakerTier.to_speaker === null) {
            console.error('No speaker specified', { speakerTier })
            throw new Error('No speaker specified')
          } else {
            return _(speakerTier.events).map((e): ServerEvent => {

              if (!e.text) {
                console.log('e.text is empty: ', e)
              }

              const eventId = makeEventId()
              const text = e.text || ''

              // create event tiers (free text tiers)
              if (speakerTier.to_tier_type === 'freeText') {

                const tierName = speakerTier.to_tier_name || speakerTier.to_tier_type || 'untitled'
                const existingTier = _(tiers).map((t, k) => ({ ...t, id: k })).find(t => t.tier_name === tierName)
                const tierId = existingTier !== undefined ? existingTier.id : makeTierId()

                if (existingTier === undefined) {
                  tiers[tierId] = {
                    tier_name: tierName
                  }
                }

                return {
                  pk: eventId,
                  e: padEnd(timeFromSeconds(Number(e.endTime)), 14, '0'),
                  s: padEnd(timeFromSeconds(Number(e.startTime)), 14, '0'),
                  l: 0 as 0,
                  tid: {},
                  event_tiers: {
                    [speakerTier.to_speaker!.pk] : {
                      [tierId]: {
                        t: e.text || '',
                        ti: String(tierId)
                      }
                    }
                  }
                }
              } else {
                const eventTokenIds = _(tokenize(text))
                  .filter(t => t !== '')
                  .map((t, tokenIndex): number => {
                    const tokenId = makeTokenId()
                    const token = {
                      t: speakerTier.token_tier_type === 'text'
                        ? t
                        : (getTierToken(speakerTiers, 'text', e, tokenIndex) || ''),
                      o: speakerTier.token_tier_type === 'ortho'
                        ? t
                        : (getTierToken(speakerTiers, 'ortho', e, tokenIndex) || ''),
                      p: speakerTier.token_tier_type === 'phon'
                        ? t
                        : (getTierToken(speakerTiers, 'phon', e, tokenIndex) || ''),
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
                  }).value()
                return {
                  pk: eventId,
                  e: padEnd(timeFromSeconds(Number(e.endTime)), 14, '0'),
                  s: padEnd(timeFromSeconds(Number(e.startTime)), 14, '0'),
                  l: 0,
                  tid: {
                    [ speakerTier.to_speaker!.pk ]: eventTokenIds
                  },
                  event_tiers: {}
                }
              }
            }).value()
          }
      }).value()
    })
    .flatten()
    .flatten()
    .value()
  // console.log({ events })
  return {
    aTiers: tiers,
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
      default_tier: defaultTier,
      n: name,
      pk: -1,
      ut: 'now' // TODO:
    },
    aNr: 0,
    nNr: 0
  }
}

export default function parseTree(xmlTree: BasicNode, fileName: string): ParsedExmaraldaXML {

  if (xmlTree.children && xmlTree.children[0] && xmlTree.children[0].children) {
    const basicBody = _(xmlTree.children[0].children).find({ name: 'basic-body' })
    if (basicBody !== undefined) {
      const commonTimeline = _(basicBody.children).find({ name: 'common-timeline' })
      const tiers = _(basicBody.children).filter(t => t.name === 'tier').value() as TierNode[]
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
                  id: tier.attributes.id,
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
          fileName,
          timeline: commonTimelineByTli,
          speakers: tiersBySpeakers,
          speakerTiers: _(tiersBySpeakers)
            .reduce((m, el, i, l) => {
              return m.concat(_(el).map(v => ({
                speaker_name: i,
                select_for_import: false,
                to_speaker: null,
                to_tier_type: null,
                to_tier_name: null,
                token_tier_type: null,
                ...v
              }))
              .sortBy((st) => st.display_name)
              .value())
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
