import _ from 'lodash'
import Vue from 'vue'
import localForage from 'localforage'

import { makeGradient, Color } from '../lib/gradient'
import { setNumberInBounds, platform } from '../util'
import { KeyboardShortcuts, keyboardShortcuts, KeyboardAction } from '../service/keyboard'
import { eventStore } from './transcript'
import { ProjectPresets } from 'presets'

type JSONValue = string | number | boolean | null | JSONObject | JSONArray

interface JSONObject {
  [property: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> {}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type SerializableSettings = Omit<Settings, 'keyboardShortcuts'> & {
  [key in keyof Settings]: JSONValue
} & {
  keyboardShortcuts: {
    [key in keyof typeof keyboardShortcuts]: Pick<KeyboardAction, 'key' | 'modifier'>
  }
}

export type SidebarItem = null|'edit'|'history'|'warnings'|'search'|'bookmarks'

export interface Settings {
  backEndUrl: string|null
  activeSidebarItem: SidebarItem
  showSettings: boolean
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
  maxEventGap: number
  pixelsPerSecond: number
  playbackSpeed: number,
  playbackVolume: number,
  showDrawer: boolean
  showSegmentBoxes: boolean
  showSpectrograms: boolean
  skipInterval: number
  spectrogramColors: Color[]
  spectrogramGradient: number[][]
  projectPreset: keyof ProjectPresets
  useMonoWaveForm: boolean
  waveFormColors: string[]
  playEventOnAppend: boolean
  scrollSpeed: 1
  showErrors: {
    eventGaps: boolean
    unknownTokenTypes: boolean
    eventOverlaps: boolean
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
  settings.playbackSpeed = setNumberInBounds(s, 0, 1.5)
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

export const defaultPixelsPerSecond = 150
export const minPixelsPerSecond = 30
export const maxPixelsPerSecond = 1000

export function setPixelsPerSecond(newVal: number) {
  settings.pixelsPerSecond = setNumberInBounds(newVal, minPixelsPerSecond, maxPixelsPerSecond)
}

const settings: Settings = {
  backEndUrl: localStorage.getItem('backEndUrl') || null,
  activeSidebarItem: 'edit',
  showSettings: false,
  contrast: 1,
  darkMode: false,
  drawerWidth: 350,
  emulateHorizontalScrolling: platform() === 'windows' || platform() === 'linux',
  eventDockingInterval: 0.05,
  keyboardShortcuts,
  lockPlayHead: true,
  lockScroll: false,
  minimumEventLength: 0.2,
  maxEventGap: 1,
  moveEventTimeByInterval: 0.2,
  moveEventTimeByIntervalSmall: 0.01,
  pixelsPerSecond: defaultPixelsPerSecond,
  playbackSpeed: 1,
  playbackVolume: 1,
  showDrawer: false,
  showSegmentBoxes: true,
  showSpectrograms: false,
  skipInterval: 1,
  spectrogramColors: spectrogramPresets[1].colors,
  spectrogramGradient: makeGradient(spectrogramPresets[1].colors),
  projectPreset: 'PP03',
  useMonoWaveForm: false,
  waveFormColors: [ '#fb7676', '#6699CC' ],
  playEventOnAppend: true,
  scrollSpeed: 1,
  showErrors: {
    eventGaps: true,
    unknownTokenTypes: true,
    eventOverlaps: true
  }
};

(async () => {
  await loadAndMergeLocalSettings()
  updateLocalSettingsOnChange()
})()

function updateLocalSettings(s: Settings) {
  return window.requestIdleCallback(() => localForage.setItem('appSettings', stringifySettings(s)))
}

const debouncedUpdateLocalSettings = _.debounce(updateLocalSettings, 500)

function updateLocalSettingsOnChange() {
  return new Vue({
    data() {
      return { settings }
    },
    watch: {
      settings: {
        deep: true,
        handler: (newV: Settings) => {
          debouncedUpdateLocalSettings(newV)
        }
      }
    }
  })
}

async function loadAndMergeLocalSettings() {
  // tslint:disable-next-line:max-line-length
  const loadedSettings: SerializableSettings|undefined = JSON.parse(await (localForage.getItem('appSettings') as Promise<string>))
  if (loadedSettings !== undefined && loadedSettings !== null) {
    _(loadedSettings).forEach((setting, settingKey) => {
      if (settingKey === 'keyboardShortcuts') {
        settings.keyboardShortcuts = _.mapValues(settings.keyboardShortcuts, (v, k) => {
          if (loadedSettings.keyboardShortcuts[k] !== undefined) {
            return {
              ...v,
              key: loadedSettings.keyboardShortcuts[k].key,
              modifier: loadedSettings.keyboardShortcuts[k].modifier
            }
          } else {
            return v
          }
        })
      } else if (settingKey in settings) {
        (settings as any)[settingKey] = setting
      }
    })
  }
}

function stringifySettings(s: Settings): string {
  const serializedSettings: SerializableSettings = {
    ...s,
    keyboardShortcuts: _.mapValues(s.keyboardShortcuts, sk => ({ key: sk.key, modifier: sk.modifier }))
  }
  return JSON.stringify(serializedSettings)
}

export default settings
