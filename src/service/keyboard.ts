import Vue from 'vue'
import _ from 'lodash'

import { undoable } from '../store/history'
import { platform } from '../util'
import {
  focusSelectedEventElement, isWaveformEventVisible
} from '../service/events-dom'

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
  getSelectedEvents,
  playEvents,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  moveEventStartTime,
  moveEventEndTime,
  LocalTranscriptEvent,
} from '../store/transcript'

import eventBus from '../service/event-bus'
import settings from '../store/settings';

type KeyboardModifier = 'alt'|'shift'|'ctrlOrCmd'

export interface KeyboardAction {
  // can have more than one modifier
  modifier: KeyboardModifier[]
  // some shortcuts can’t work in text fields
  ignoreInTextField: boolean
  key: KeyboardEvent['key']
  name: string
  description: string
  action: (e: KeyboardEvent) => any
}

export interface KeyboardShortcuts {
  [action: string]: KeyboardAction
}

export interface KeyDescriber {
  name: string
  jsName: string
  displayName: string
}

export const normalKeys: KeyDescriber[] = _('abcdefghijklmnopqrstuvwxyz1234567890+-')
  .split('')
  .map(l => ({ name: l, jsName: l, displayName: l.toUpperCase() }))
  .value()

export const modifierKeys: KeyDescriber[] = [
  {
    name: 'ctrlOrCmd',
    displayName: platform() === 'mac' ? '⌘' : 'ctrl',
    jsName: platform() === 'mac' ? 'metaKey' : 'ctrlKey',
  },
  {
    name: 'alt',
    displayName: platform() === 'mac' ? '⎇' : 'alt',
    jsName: 'altKey'
  },
  {
    name: 'shift',
    displayName: '⇧',
    jsName: 'shiftKey'
  }
]

export const specialKeys: KeyDescriber[] = [
  {
    name: 'Enter',
    jsName: 'Enter',
    displayName: '⏎'
  },
  {
    name: 'Backspace',
    jsName: 'Backspace',
    displayName: '⌫'
  },
  {
    name: 'left',
    jsName: 'ArrowLeft',
    displayName: '←'
  },
  {
    name: 'right',
    jsName: 'ArrowRight',
    displayName: '→'
  }
]

export const keyMap: _.Dictionary<KeyDescriber> = _(normalKeys)
  .concat(specialKeys)
  .concat(modifierKeys)
  .keyBy(t => t.name)
  .value()

function isInputElement(t: EventTarget|null): boolean {
  return (
    t !== null &&
    t instanceof HTMLElement && (
      t.isContentEditable === true ||
      t.tagName.toLowerCase() === 'input'
    )
  )
}

function keyboardEventHasModifier(e: KeyboardEvent, m: KeyboardModifier): boolean {
  return (
    (
      (m === 'ctrlOrCmd' && e.ctrlKey === true) ||
      (m === 'ctrlOrCmd' && platform() === 'mac' && e.metaKey === true)
    ) ||
    (m === 'alt' && e.altKey === true) ||
    (m === 'shift' && e.shiftKey === true)
  )
}

export async function handleGlobalShortcut(e: KeyboardEvent) {
  _(keyboardShortcuts).forEach(sc => {
    if (
      // the shortcut is allowed in text fields OR we’re not in a text field.
      (sc.ignoreInTextField === false || !isInputElement(e.target)) &&
      // the required key was pressed
      (e.key === sc.key) &&
      // check modifiers:
      (
        // no modifiers are required and none are present
        (sc.modifier.length === 0 && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) ||
        // every modifier is present in the event
        sc.modifier.every(m => keyboardEventHasModifier(e, m))
      )
    ) {
      e.preventDefault()
      sc.action(e)
      // break the loop when it was found.
      return false
    }
  })
}

export function displayKeyboardAction(a: KeyboardAction): string {
  return a.modifier
    // resolve modifier
    .map(m => keyMap[m] === undefined ? '' : keyMap[m].displayName)
    // resolve key (including special keys)
    .concat(keyMap[a.key] === undefined ? '' : keyMap[a.key].displayName)
    // join
    .join('')
}

export const keyboardShortcuts: KeyboardShortcuts = {
  split: {
    ignoreInTextField: true,
    modifier: [],
    key: 's',
    name: 'Split Event',
    description: 'Split an Event at the current play-head position.',
    action: async () => {
      const eventUnderPlayHead = findEventAt(eventStore.currentTime)
      if (eventUnderPlayHead === undefined) {
        const e = undoable(addEvent(eventStore.currentTime))
        selectEvents(e)
      } else {
        const splitAt = eventStore.currentTime - eventUnderPlayHead.startTime
        const [leftEvent] = undoable(splitEvent(eventUnderPlayHead, splitAt))
        if (!(await isWaveformEventVisible(leftEvent))) {
          scrollToAudioEvent(leftEvent)
        }
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
  moveEventStartLeft: {
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowLeft',
    name: 'Move event start left',
    description: 'Move the beginning of an event to the left (use Shift to jump)',
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const i = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventStartTime(e, i * -1))
      }
    }
  },
  moveEventStartRight: {
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowRight',
    name: 'Move event start right',
    description: 'Move the beginning of an event to the right (use Shift to jump)',
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const i = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventStartTime(e, i))
      }
    }
  },
  moveEventEndRight: {
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowRight',
    name: 'Move event end right',
    description: 'Move the end of an event to the right (use Shift to jump)',
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const i = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventEndTime(e, i))
      }
    }
  },
  moveEventEndLeft: {
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowLeft',
    name: 'Move event end left',
    description: 'Move the end of an event to the left (use Shift to jump)',
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const i = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventEndTime(e, i * -1))
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
        focusSelectedEventElement(e)
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
        focusSelectedEventElement(e)
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
      const es = getSelectedEvents()
      if (es.length > 0) {
        playEvents(es)
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
  },
  selectAllEvents: {
    ignoreInTextField: true,
    modifier: [ 'ctrlOrCmd' ],
    key: 'a',
    name: 'Select All',
    description: 'Selects all Events',
    action: () => {
      eventStore.selectedEventIds = eventStore.events.map(e => e.eventId)
    }
  },
  selectNone: {
    ignoreInTextField: true,
    modifier: [ 'ctrlOrCmd' ],
    key: 'd',
    name: 'Select none',
    description: 'Selects no Events',
    action: () => {
      eventStore.selectedEventIds = []
    }
  }
}
