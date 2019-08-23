import { makeGradient, Color } from '../lib/gradient'
import { setNumberInBounds, platform } from '../util'
import { KeyboardShortcuts, keyboardShortcuts } from '../service/keyboard'

import { eventStore } from './transcript'

export interface Settings {
  showDrawer: boolean
  contrast: number
  spectrogramGradient: number[][]
  spectrogramColors: Color[]
  waveFormColors: string[]
  lockScroll: boolean
  lockPlayHead: boolean
  playbackSpeed: number,
  playbackVolume: number,
  pixelsPerSecond: number
  emulateHorizontalScrolling: boolean
  darkMode: boolean
  showSegmentBoxes: boolean
  showSpectrograms: boolean
  useMonoWaveForm: boolean
  moveEventTimeByInterval: number
  moveEventTimeByIntervalSmall: number
  tokenTypes: Array<{
    name: string
    regex: RegExp
    color: string
    id: number
  }>
  keyboardShortcuts: KeyboardShortcuts
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
        c: [31, 234, 234, 1]
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

const settings: Settings = {
  showDrawer: false,
  contrast: 1,
  spectrogramGradient: makeGradient(spectrogramPresets[1].colors),
  spectrogramColors: spectrogramPresets[1].colors,
  waveFormColors: [ '#fb7676', '#6699CC' ],
  lockScroll: false,
  lockPlayHead: true,
  playbackSpeed: 1,
  playbackVolume: 1,
  darkMode: true,
  pixelsPerSecond: 150,
  emulateHorizontalScrolling: platform() === 'windows' || platform() === 'linux',
  showSegmentBoxes: true,
  showSpectrograms: false,
  useMonoWaveForm: false,
  moveEventTimeByInterval: 0.2,
  moveEventTimeByIntervalSmall: 0.01,
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
      regex: /^(\?|\.|\,|!)/,
      color: '#1717FB',
      id: 2
    },
    {
      name: 'interrupted',
      regex: /([a-zA-ZÜüÄäÖöß]+\/)/u,
      color: '#6699CC',
      id: 6
    },
    {
      name: 'contraction',
      regex: /_[a-zA-ZÜüÄäÖöß]+|[a-zA-ZÜüÄäÖöß]+_/,
      color: '#d47d0f',
      id: 8
    },
    {
      name: 'incomprehensible',
      regex: /\((.+)\)/u,
      color: '#6f6f6f',
      id: 7
    },
    {
      name: 'word',
      regex: /^[a-zA-ZÜüÄäÖöß]+/u,
      color: 'transparent',
      id: 1
    },
  ],
  keyboardShortcuts
}

export default settings
