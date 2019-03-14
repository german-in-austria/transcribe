
import { makeGradient, Color } from '../lib/gradient'

export interface Settings {
  spectrogramGradient: number[][]
  spectrogramColors: Color[]
  waveFormColors: string[]
  lockScroll: boolean,
  emulateHorizontalScrolling: boolean,
  darkMode: boolean,
  showSegmentBoxes: boolean,
  showSpectrograms: boolean,
  useMonoWaveForm: boolean,
  tokenTypes: Array<{
    name: string
    regex: RegExp
    color: string
    id: number
  }>
  keyboardShortcuts: {
    [action: string]: {
      modifier: 'altKey'|'ctrlKey'|'metaKey'|'shiftKey'|null
      key: string
      name: string
      description: string
    }
  }
}

const spectrogramColors = [
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

const spectrogramPresets = [
  {
    name: 'Color Heat',
    colors: spectrogramColors
  },
  {
    name: 'Redscale',
    colors: [
      {
        at: 0,
        c: [ 255, 0, 0, 0 ]
      },
      {
        at: 255,
        c: [ 255, 0, 0, 1 ]
      }
    ]
  },
  {
    name: 'Greyscale',
    colors: [
      {
        at: 0,
        c: [ 255, 255, 255, 0 ]
      },
      {
        at: 255,
        c: [ 255, 255, 255, 1 ]
      }
    ]
  }
]

const settings: Settings = {
  spectrogramGradient: makeGradient(spectrogramPresets[1].colors),
  spectrogramColors: spectrogramPresets[1].colors,
  waveFormColors: [ '#fb7676', '#6699CC' ],
  lockScroll: false,
  darkMode: true,
  emulateHorizontalScrolling: false, // set to true when finished
  showSegmentBoxes: true,
  showSpectrograms: false,
  useMonoWaveForm: false,
  tokenTypes: [
    {
      name: 'proper-name',
      regex: /\{(.+)\}/u,
      color: '#880000',
      id: 4
    },
    {
      name: 'pause',
      regex: /\[[\s\S]{1,}s\]/u,
      color: '#6B6B6B',
      id: 3
    },
    {
      name: 'non-verbal',
      regex: /\(\((.+)\)\)|\[(.+)\]/u,
      color: '#008800',
      id: 5
    },
    {
      name: 'delimiter',
      regex: /(\?|\.|\,|!)/,
      color: '#000088',
      id: 2
    },
    {
      name: 'interrupted',
      regex: /([\w]{1,}\/)/u,
      color: '#6699CC',
      id: 6
    },
    {
      name: 'word',
      regex: /_?[a-zA-ZÜüÄäÖöß]+_?/u,
      color: 'transparent',
      id: 1
    },
    {
      name: 'incomprehensible',
      regex: /\((.+)\)/u,
      color: '#6f6f6f',
      id: 7
    }
  ],
  keyboardShortcuts: {
    split: {
      modifier: null,
      key: 'S',
      name: 'Split Segment',
      description: 'Split a segment at the current play-head position.'
    }
  }
}

export default settings
