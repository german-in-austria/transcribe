
import _ from 'lodash'

import { makeGradient, Color } from '../lib/gradient'
import { platform, setNumberInBounds } from '../util'
import { undoable } from '../store/history'
import Vue from 'vue'

import {
  eventStore,
  splitEvent,
  findEventAt,
  addEvent,
  deleteSelectedEvents,
  selectEvents,
  deselectEvents,
  joinEvents,
  selectPreviousEvent,
  selectNextEvent,
  getSelectedEvent,
  playEvents,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  LocalTranscriptEvent
} from './transcript'
import eventBus from '../service/event-bus';

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
  tokenTypes: Array<{
    name: string
    regex: RegExp
    color: string
    id: number
  }>
  keyboardShortcuts: {
    [action: string]: {
      // can be more than one
      modifier: Array<'alt'|'ctrl'|'shift'|'ctrlOrCmd'|null>
      // some shortcuts can’t work in text fields
      ignoreInTextField: boolean
      key: KeyboardEvent['key']
      name: string
      description: string
      action: (e: KeyboardEvent) => any
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

async function focusEventElement(e: LocalTranscriptEvent) {
  await Vue.nextTick()
  setTimeout(() => {
    const el = (
      // either the previously selected one, or the first.
      document.querySelector('.segment.selected') ||
      document.querySelector('.segment')
    )
    if (el instanceof HTMLElement) {
      el.focus()
    }
  }, 0)
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
      color: '#000088',
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
  keyboardShortcuts: {
    split: {
      ignoreInTextField: true,
      modifier: [],
      key: 's',
      name: 'Split Event',
      description: 'Split an Event at the current play-head position.',
      action: () => {
        const eventUnderPlayHead = findEventAt(eventStore.currentTime)
        if (eventUnderPlayHead === undefined) {
          const e = undoable(addEvent(eventStore.currentTime))
          selectEvents(e)
        } else {
          const splitAt = eventStore.currentTime - eventUnderPlayHead.startTime
          undoable(splitEvent(eventUnderPlayHead, splitAt))
        }
      }
    },
    deleteEvents: {
      ignoreInTextField: true,
      modifier: [],
      key: 'Backspace',
      name: 'Delete Events',
      description: 'Delete selected Events',
      action: () => {
        undoable(deleteSelectedEvents())
        deselectEvents()
      }
    },
    joinEvents: {
      ignoreInTextField: false,
      modifier: ['ctrlOrCmd'],
      key: 'j',
      name: 'Join Events',
      description: 'Join selected Events',
      action: () => {
        if (eventStore.selectedEventIds.length > 1) {
          undoable(joinEvents(eventStore.selectedEventIds))
        }
      }
    },
    focusSearch: {
      ignoreInTextField: false,
      modifier: ['ctrlOrCmd'],
      key: 'f',
      name: 'Search',
      description: 'Focus the Search Field',
      action: () => {
        eventBus.$emit('focusSearch')
      }
    },
    selectPreviousEvent: {
      ignoreInTextField: true,
      modifier: [],
      key: 'ArrowLeft',
      name: 'Select Previous Event',
      description: 'Select the Event before the currently selected Event',
      action: async () => {
        const e = selectPreviousEvent()
        if (e !== undefined) {
          focusEventElement(e)
        }
      }
    },
    selectNextEvent: {
      ignoreInTextField: true,
      modifier: [],
      key: 'ArrowRight',
      name: 'Select Next Event',
      description: 'Select the Event after the currently selected Event',
      action: async () => {
        const e = selectNextEvent()
        if (e !== undefined) {
          focusEventElement(e)
        }
      }
    },
    playPause: {
      ignoreInTextField: false,
      modifier: [ 'ctrlOrCmd' ],
      key: 'Enter',
      name: 'Play/Pause',
      description: 'Play or Pause the currently selected Event',
      action: () => {
        const e = getSelectedEvent()
        if (e !== undefined) {
          playEvents([ e ])
        }
      }
    },
    scrollToEvent: {
      ignoreInTextField: true,
      modifier: [],
      key: 'Enter',
      name: 'Scroll to Event',
      description: 'Scroll to the selected Event',
      action: () => {
        const e = getSelectedEvent()
        if (e !== undefined) {
          scrollToAudioEvent(e)
          scrollToTranscriptEvent(e)
        }
      }
    }
  }
}

function isInputElement(t: EventTarget|null): boolean {
  return (
    t !== null &&
    t instanceof HTMLElement && (
      t.isContentEditable === true ||
      t.tagName.toLowerCase() === 'input'
    )
  )
}

// FIXME: combined modifiers.
export async function handleGlobalShortcut(e: KeyboardEvent) {
  _(settings.keyboardShortcuts).forEach(async (sc) => {
    if (
      // the shortcut is allowed in text fields OR we’re not in one.
      (sc.ignoreInTextField === false || !isInputElement(e.target)) &&
      // the required key was pressed
      (e.key === sc.key) &&
      // check modifiers:
      (
        // no modifiers are required and none are present
        (sc.modifier.length === 0 && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) ||
        // ctrl is present and required
        (e.ctrlKey === true && sc.modifier.find((m) => m === 'ctrl' || m === 'ctrlOrCmd')) ||
        // alt key is present and required
        (e.altKey === true && sc.modifier.find(m => m === 'alt')) ||
        // shift key is present and required
        (e.shiftKey === true && sc.modifier.find(m => m === 'shift')) ||
        // we’re on a mac and cmd is present and required
        (platform() === 'mac' && e.metaKey === true && sc.modifier.find((m) => m === 'ctrlOrCmd'))
      )
    ) {
      e.preventDefault()
      await sc.action(e)
      // break the loop when it was found.
      return false
    }
  })
}

export default settings
