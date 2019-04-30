import _ from 'lodash'

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
  to_speaker: string|null
  to_tier_name: string|null
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
