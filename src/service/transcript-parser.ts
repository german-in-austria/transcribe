import * as _ from 'lodash'

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

export default function parseTree(xmlTree: BasicNode) {

  if (xmlTree.children && xmlTree.children[0] && xmlTree.children[0].children) {
    const basicBody = _(xmlTree.children[0].children).find({ name: 'basic-body' })
    if (basicBody !== undefined) {
      const commonTimeline = _(basicBody.children).find({ name: 'common-timeline' })
      const tiers = _(basicBody.children).filter({ name: 'tier' }).value() as TierNode[]
      if (commonTimeline !== undefined) {
        return _(tiers)
          .groupBy(t => t.attributes.speaker)
          .mapValues(speakerTiers => {
            return _(speakerTiers)
              .keyBy(t => t.attributes.id)
              .mapValues(tier => {
                return {
                  events: _(tier.children)
                    .filter(t => t.name === 'event')
                    .map((t: EventNode) => {
                      return {
                        start: t.attributes.start,
                        end: t.attributes.end,
                        text: t.children && t.children[0] ? t.children[0].text : null
                      }
                    })
                    .value()
                }
              })
              .value()
          })
          .value()
      }
    } else {
      throw new Error('cannot parse xml')
    }
  } else {
    throw new Error('cannot parse xml')
  }

}
