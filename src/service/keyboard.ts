import Vue from 'vue'
import _ from 'lodash'

import { undoable } from '../store/history'
import { platform } from '../util'

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
} from '../store/transcript'

import eventBus from '../service/event-bus'

export interface KeyboardShortcuts {
  [action: string]: {
    // can be more than one
    modifier: Array<'alt'|'shift'|'ctrlOrCmd'|null>
    // some shortcuts can’t work in text fields
    ignoreInTextField: boolean
    key: KeyboardEvent['key']
    name: string
    description: string
    action: (e: KeyboardEvent) => any
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
  _(keyboardShortcuts).forEach(async (sc) => {
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
        (e.ctrlKey === true && sc.modifier.find((m) => m === 'ctrlOrCmd')) ||
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

export const modifierKeys = [
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

export const specialKeys = [
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

export const keyboardShortcuts: KeyboardShortcuts = {
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
