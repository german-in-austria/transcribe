import * as parseXML from '@rgrove/parse-xml'
import * as fs from 'fs'
import _ from 'lodash'

const files = fs.readdirSync('../data/exbs')

interface BasicNode {
  attributes: object
  children?: BasicNode[]
  name?: string
  parent: BasicNode | null
  toJSON: () => string
  type: string
  text?: string
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

let durTotal = 0

files.forEach((f: string) => {
  const x = fs.readFileSync('../data/exbs/' + f, 'utf8')
  // console.log(x)
  const xml = parseXML(x)
  const bb = xml.children[0].children.find(e => e.name === 'basic-body')
  const commonTimeline = _(bb.children).find({ name: 'common-timeline' })
  const y =_(commonTimeline.children)
    .filter((t) => t.name === 'tli')
    .map(t => t.attributes.time)
    .compact()
    .value()
  const [high, low] =  [Math.max(...y), Math.min(...y)]
  const durationHours = (high - low)/60/60
  if (!_.isNaN(durationHours)) {
    durTotal = durTotal + durationHours
  } else {
    console.log(f, durationHours)
    console.log(commonTimeline, y)
  }
})

console.log('durTotal', durTotal)
