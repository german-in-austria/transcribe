import { makeGradient, Color } from '../lib/gradient'
import { setNumberInBounds, platform } from '../util'
import { KeyboardShortcuts, keyboardShortcuts } from '../service/keyboard'

import { eventStore } from './transcript'

export interface TokenTypePresetBase {
  name: string
  color: string
  id: number
}

type TokenTypePresetName = 'dioeDB'|'dissDB'

export type TokenTypesPreset = {
  [name in TokenTypePresetName]: Array<TokenTypesPresetGroup | TokenTypesPresetSingle>;
}

export interface TokenTypesPresetSingle extends TokenTypePresetBase {
  type: 'single'
  regex: RegExp
}

export interface TokenTypesPresetGroup extends TokenTypePresetBase {
  type: 'group'
  bracketSymbols: [ RegExp, RegExp ]
}

// type AnyJson =  boolean | number | string | null | JsonArray | JsonMap

// interface JsonMap {
//   [key: string]: AnyJson
// }

// interface JsonArray extends Array<AnyJson> {}

export interface Settings {
  contrast: number
  darkMode: boolean
  drawerWidth: number
  emulateHorizontalScrolling: boolean
  eventDockingInterval: number
  keyboardShortcuts: KeyboardShortcuts
  lockPlayHead: boolean
  lockScroll: boolean
  minimumEventLength: number
  moveEventTimeByInterval: number
  moveEventTimeByIntervalSmall: number
  pixelsPerSecond: number
  playbackSpeed: number,
  playbackVolume: number,
  showDrawer: boolean
  showSegmentBoxes: boolean
  showSpectrograms: boolean
  skipInterval: number
  spectrogramColors: Color[]
  spectrogramGradient: number[][]
  tokenTypesPreset: keyof TokenTypesPreset
  useMonoWaveForm: boolean
  waveFormColors: string[]
}

export const tokenTypesPresets: TokenTypesPreset = {
  dioeDB: [
    {
      type: 'single',
      name: 'segments-unclear',
      regex: /(\*)([a-zA-ZÜüÄäÖöß]+)(\*)/,
      color: '#6B6B6B',
      id: 9
    },
    {
      type: 'single',
      name: 'untransferable-lexics',
      regex: /(_)([a-zA-ZÜüÄäÖöß]+)(_)/,
      color: '#FFAF3C',
      id: 8
    },
    // {
    //   name: 'quotation',
    //   regex: /(„|")([a-zA-ZÜüÄäÖöß]+)(“|")/,
    //   color: '',
    //   id: -4
    // },
    {
      type: 'single',
      name: 'interrupted',
      regex: /([a-zA-ZÜüÄäÖöß]+\/$)/u,
      color: '#6699CC',
      id: 6
    },
    {
      type: 'single',
      name: 'pause',
      regex: /\(\((([a-zA-ZÜüÄäÖöß]+)|(\d+(,\d)?s|))\)\)/u,
      color: '#6B6B6B',
      id: 3
    },
    {
      type: 'group',
      name: 'incomprehensible',
      bracketSymbols: [
        /(\(([a-zA-ZÜüÄäÖöß\?]+))/u,
        /((.+)\))/u
      ],
      color: '#ccc',
      id: 7
    },
    {
      type: 'group',
      name: 'anonymized',
      bracketSymbols: [
        /(\[([a-zA-ZÜüÄäÖöß\?]+))/u,
        /(.+\](N|O|Z|S))/,
      ],
      color: '#880000',
      id: 10
    },
    {
      type: 'single',
      name: 'other',
      regex: /\{([a-zA-ZÜüÄäÖöß]+)\}/u,
      color: '#880000',
      id: 4
    },
    {
      type: 'single',
      name: 'delimiter',
      regex: /^(\?|\.|\,|!)"?$/,
      color: '#1717FB',
      id: 2
    },
    {
      type: 'single',
      name: 'word',
      regex: /^([a-zA-ZÜüÄäÖöß"]+$)/u,
      color: 'transparent',
      id: 1
    },
  ],
  dissDB: [
    {
      type: 'single',
      name: 'pause',
      regex: /\[[\s\S]{1,}s\]/u,
      color: '#6B6B6B',
      id: 3
    },
    {
      type: 'group',
      name: 'non-verbal',
      bracketSymbols: [
        /\(\((.+)|\[(.+)/u,
        /(.+)\)\)|(.+)\]/u
      ],
      color: '#008800',
      id: 5
    },
    {
      type: 'single',
      name: 'delimiter',
      regex: /^(\?|\.|\,|!)"?/,
      color: '#1717FB',
      id: 2
    },
    {
      type: 'single',
      name: 'interrupted',
      regex: /([a-zA-ZÜüÄäÖöß]+\/)/u,
      color: '#6699CC',
      id: 6
    },
    {
      type: 'single',
      name: 'contraction',
      regex: /_[a-zA-ZÜüÄäÖöß]+|[a-zA-ZÜüÄäÖöß]+_/,
      color: '#d47d0f',
      id: 8
    },
    {
      type: 'group',
      name: 'proper-name',
      bracketSymbols: [
        /(\{(.+))/u,
        /(\{?(.+)\})/u
      ],
      color: '#880000',
      id: 4
    },
    {
      type: 'group',
      name: 'incomprehensible',
      // regex: /\((.+)\)/u,
      bracketSymbols: [
        /\((.+)/u,
        /\(?(.+)\)/u
        // /(\(([a-zA-ZÜüÄäÖöß\?]+))/u,
        // /(\(?[a-zA-ZÜüÄäÖöß]+\))/u
      ],
      color: '#6f6f6f',
      id: 7
    },
    {
      type: 'single',
      name: 'word',
      regex: /^[a-zA-ZÜüÄäÖöß]+/u,
      color: 'transparent',
      id: 1
    },
  ],
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
    name: 'Color Cool',
    colors: [
      {
        at: 0,
        c: [247, 32, 71, 0]
      },
      {
        at : 128,
        c: [100, 149, 237, 1]
      },
      {
        at: 255,
        c: [255, 210, 0, 1]
      }
    ]
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

export function setPlaybackSpeed(s: number) {
  settings.playbackSpeed = setNumberInBounds(s)
  eventStore.audioElement.playbackRate = settings.playbackSpeed
}

export function increasePlaybackSpeed(by: number) {
  setPlaybackSpeed(settings.playbackSpeed + by)
}

export function decreasePlaybackSpeed(by: number) {
  setPlaybackSpeed(settings.playbackSpeed - by)
}

export function setPlaybackVolume(v: number) {
  settings.playbackVolume = setNumberInBounds(v)
  eventStore.audioElement.volume = settings.playbackVolume
}

export function increaseVolume(by: number) {
  setPlaybackVolume(settings.playbackVolume + by)
}

export function decreaseVolume(by: number) {
  setPlaybackVolume(settings.playbackVolume - by)
}

export function getIsDarkMode(): boolean {
  return JSON.parse(localStorage.getItem('darkMode') || 'false')
}

export function setIsDarkMode(b: boolean) {
  settings.darkMode = b
  localStorage.setItem('darkMode', JSON.stringify(b))
}

const settings: Settings = {
  contrast: 1,
  darkMode: getIsDarkMode(),
  drawerWidth: 300,
  emulateHorizontalScrolling: platform() === 'windows' || platform() === 'linux',
  eventDockingInterval: 0.05,
  keyboardShortcuts,
  lockPlayHead: true,
  lockScroll: false,
  minimumEventLength: 0.2,
  moveEventTimeByInterval: 0.2,
  moveEventTimeByIntervalSmall: 0.01,
  pixelsPerSecond: 150,
  playbackSpeed: 1,
  playbackVolume: 1,
  showDrawer: false,
  showSegmentBoxes: true,
  showSpectrograms: false,
  skipInterval: 1,
  spectrogramColors: spectrogramPresets[1].colors,
  spectrogramGradient: makeGradient(spectrogramPresets[1].colors),
  tokenTypesPreset: 'dioeDB',
  useMonoWaveForm: false,
  waveFormColors: [ '#fb7676', '#6699CC' ],
}

export default settings
