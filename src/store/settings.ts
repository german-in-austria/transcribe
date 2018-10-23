
import { makeGradient, Color } from '../lib/gradient'

export interface Settings {
  spectogramGradient: number[][]
  spectogramColors: Color[]
  waveFormColors: string[]
  lockScroll: boolean,
  emulateHorizontalScrolling: boolean,
  darkMode: boolean,
  showSegmentBoxes: boolean,
  showSpectograms: boolean,
  useMonoWaveForm: boolean,
  tokenTypes: Array<{
    name: string
    regex: RegExp
    color: string
  }>
  keyboardShortcuts: {
    [action: string]: {
      modifier: string
      key: string
      name: string
      description: string
    }
  }
}

const spectogramColors = [
  {
    at: 0,
    c: [ 5, 0, 11, 0 ]
  },
  {
    at: 10,
    c: [ 30, 0, 30, 1 ]
  },
  {
    at: 28,
    c: [ 86, 1, 87, 1 ]
  },
  {
    at: 40,
    c: [ 135, 2, 120, 1 ]
  },
  {
    at: 60,
    c: [ 198, 11, 56, 1 ]
  },
  {
    at: 80,
    c: [ 254, 32, 0, 1 ]
  },
  {
    at: 100,
    c: [ 255, 137, 1, 1 ]
  },
  {
    at: 120,
    c: [ 255, 211, 10, 1 ]
  },
  {
    at: 140,
    c: [ 255, 251, 29, 1 ]
  },
  {
    at: 160,
    c: [ 207, 223, 32, 1 ]
  },
  {
    at: 180,
    c: [ 155, 188, 32, 1 ]
  },
  {
    at: 200,
    c: [ 128, 191, 110, 1 ]
  },
  {
    at: 220,
    c: [ 106, 199, 195, 1 ]
  },
  {
    at: 240,
    c: [ 190, 231, 233, 1 ]
  },
  {
    at: 255,
    c: [ 253, 255, 255, 1 ]
  }
]

const settings: Settings = {
  spectogramGradient: makeGradient(spectogramColors),
  spectogramColors,
  waveFormColors: [ '#fb7676', '#69c' ],
  lockScroll: false,
  darkMode: true,
  emulateHorizontalScrolling: true,
  showSegmentBoxes: true,
  showSpectograms: false,
  useMonoWaveForm: false,
  tokenTypes: [
    {
      name: 'proper-name',
      regex: /\{(.*?)\}/g,
      color: '#880000'
    },
    {
      name: 'pause',
      regex: /\[[\s\S]{1,}s\]/g,
      color: '#CCCCCC'
    },
    {
      name: 'non-verbal',
      regex: /\(\((.*?)\)\)|\[(.*?)\]/g,
      color: '#008800'
    },
    {
      name: 'delimiter',
      regex: /\B(\?|\.|\,|!)\B/g,
      color: '#000088'
    },
    {
      name: 'interrupted',
      regex: /([\w]{1,}\/)/g,
      color: '#6699CC'
    }
  ],
  keyboardShortcuts: {
    split: {
      modifier: 'meta',
      key: '',
      name: 'Split Segment',
      description: 'Split a segment at the current play-head position.'
    }
  }
}

export default settings
