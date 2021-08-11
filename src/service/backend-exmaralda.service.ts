import _ from 'lodash'
import * as parseXML from '@rgrove/parse-xml'

import {
  ServerEvent,
  ServerSurvey,
  ServerToken,
  ServerInformant,
  ServerTranscript,
  surveyToServerTranscriptSurvey,
  surveyToServerTranscriptInformants
} from './backend-server.service'
import { TokenTierType } from '../types/transcript'
import { padEnd, timeFromSeconds } from '../util/index'
import settings from '../store/settings.store'
import presets from '../presets'
import Transcript from '../classes/transcript.class'

interface BasicNode {
  attributes: object
  children?: BasicNode[]
  name?: 'event'|'tier'|'tli'|'basic-body'|'common-timeline'
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
  speakerName: string
  selectForImport: boolean
  toTierType: 'tokenized'|'freeText'|'default'|null
  toSpeaker: ServerInformant|null
  toTierName: string|null
  tokenTierType: TokenTierType
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
  return Transcript.getTokenTypeFromToken(t, presets[settings.projectPreset]).id
}

function getTierToken(
  speakerTiers: SpeakerTierImportable[],
  tierType: TokenTierType,
  tierEvent: TierEvent,
  tokenIndex: number
): string {
  const tier = _(speakerTiers).find(t => t.selectForImport === true && t.tokenTierType === tierType)
  // this speaker does not have this type of token tier
  if (tier === undefined) {
    return ''
  } else {
    const event = _(tier.events).find(e => e.startTime === tierEvent.startTime)
    // this event does not exist in this token tier.
    if (event === undefined || event.text === undefined || event.text === null) {
      return ''
    } else {
      return presets[settings.projectPreset].tokenizer(event.text)[tokenIndex] || ''
    }
  }
}

function autoFixExmaraldaText(text: string, tierType: 'tokenized'|'freeText'|'default'|null): string {
  if (presets[settings.projectPreset].importTransformer !== undefined) {
    return presets[settings.projectPreset].importTransformer!(text, tierType).replaceAll(' /', '/')
  }
  // remove the space before canceled expressions
  return text.replaceAll(' /', '/')
}

function isFragmentedEventStart(text: string|null): boolean {
  return text !== null &&
    text !== '' &&
    !text.endsWith(')') &&
    !text.endsWith(']') &&
    !text.endsWith(' ') &&
    !text.endsWith('.') &&
    !text.endsWith('!') &&
    !text.endsWith(',') &&
    !text.endsWith('?')
}

export function importableToServerTranscript(
  importable: ParsedExmaraldaXML,
  name: string,
  selectedSurvey: ServerSurvey,
  defaultTier: TokenTierType
): ServerTranscript {

  const tiersBySpeakers = _(importable.speakerTiers)
    .filter(st => st.selectForImport === true)
    .map(st => {
      return st.toTierType === 'default'
        ? { ...st, tokenTierType: defaultTier }
        : st
    })
    .groupBy(st => st.toSpeaker!.pk)
    .value()

  const tokens: _.Dictionary<ServerToken> = {}
  const tiers: ServerTranscript['aTiers'] = {}

  const eventTimeline = _(tiersBySpeakers).chain()
    .reduce((m, st) => {
      const es = _(st)
        .map(t => t.events)
        .flatten()
        .keyBy(e => e.startTime + '__' + e.endTime)
        .mapValues(Transcript.makeEventId)
        .value()
      m = { ...m, es }
      return m
    }, {} as any)
    .value()
  const events = _(tiersBySpeakers)
    .map(speakerTiers => {
      // console.log({speakerTiers})
      return _(speakerTiers)
        // only the default tier and free text (event_tier) tiers
        .filter(st => st.toTierType === 'default' || st.toTierType === 'freeText')
        .map(speakerTier => {
          let tokenOrder = 0
          if (speakerTier.toSpeaker === null) {
            console.error('No speaker specified', { speakerTier })
            throw new Error('No speaker specified')
          } else {
            let fragmentStartTokenId: number|undefined
            return _(speakerTier.events).map((e, eventIndex): ServerEvent => {
              if (!e.text) {
                console.log('e.text is empty: ', e)
              }
              const eventId = eventTimeline[e.startTime + '__' + e.endTime] || Transcript.makeEventId()
              const text = e.text || ''

              // create event tiers (free text tiers)
              if (speakerTier.toTierType === 'freeText') {
                const tierName = speakerTier.toTierName || speakerTier.toTierType || 'untitled'
                const existingTier = _(tiers).map((t, k) => ({ ...t, id: k })).find(t => t.tier_name === tierName)
                const tierId = existingTier !== undefined ? existingTier.id : Transcript.makeTierId()

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
                    [ speakerTier.toSpeaker!.pk ] : {
                      [ Transcript.makeEventTierId() ]: {
                        t: e.text || '',
                        ti: Number(tierId)
                      }
                    }
                  }
                }
              // create default tiers
              } else {
                const cleanText = autoFixExmaraldaText(text, speakerTier.toTierType)
                const eventTokenIds = _(presets[settings.projectPreset].tokenizer(cleanText))
                  .filter(t => t !== '')
                  .map((t, tokenIndex): number => {
                    const fragmentOf = tokenIndex === 0 ? fragmentStartTokenId : undefined
                    const tokenId = Transcript.makeTokenId()
                    const token: ServerToken = {
                      t: speakerTier.tokenTierType === 'text'
                        ? t
                        : getTierToken(speakerTiers, 'text', e, tokenIndex),
                      o: speakerTier.tokenTierType === 'ortho'
                        ? t
                        : getTierToken(speakerTiers, 'ortho', e, tokenIndex),
                      p: speakerTier.tokenTierType === 'phon'
                        ? t
                        : getTierToken(speakerTiers, 'phon', e, tokenIndex),
                      to: '',
                      tr: tokenOrder++,
                      e: eventId,
                      i: speakerTier.toSpeaker!.pk,
                      s: 0,
                      sr: 0,
                      fo: fragmentOf,
                      tt: getTokenTypeId(t)
                    }
                    // if it’s a fragment, add it to the fragment starting token.
                    if (fragmentOf !== undefined) {
                      tokens[fragmentOf].o = tokens[ fragmentOf ].o + getTierToken(speakerTiers, defaultTier, e, 0)
                    }
                    tokens[tokenId] = token
                    return tokenId
                  }).value()

                if (isFragmentedEventStart(text)) {
                  fragmentStartTokenId = _(eventTokenIds).last()
                } else {
                  fragmentStartTokenId = undefined
                }

                return {
                  pk: eventId,
                  e: padEnd(timeFromSeconds(Number(e.endTime)), 14, '0'),
                  s: padEnd(timeFromSeconds(Number(e.startTime)), 14, '0'),
                  l: 0,
                  tid: {
                    [ speakerTier.toSpeaker!.pk ]: eventTokenIds
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


  return {
    aTiers: tiers,
    aEinzelErhebung: surveyToServerTranscriptSurvey(selectedSurvey),
    aInformanten: surveyToServerTranscriptInformants(selectedSurvey),
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
          .filter((t): t is TliNode => t.name === 'tli')
          .keyBy(t => t.attributes.id)
          .mapValues(t => t.attributes.time)
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
                  events: _(tier.children)
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
                    .value()
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
              return m.concat(_(el)
                .map(v => ({
                  speakerName: i,
                  selectForImport: false,
                  toSpeaker: null,
                  toTierType: null,
                  toTierName: null,
                  tokenTierType: null,
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
