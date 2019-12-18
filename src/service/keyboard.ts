
import _ from 'lodash'

import { undoable, history, undo } from '../store/history'
import { platform } from '../util'
import Vue from 'vue'
import {
  focusSelectedEventElement,
  isWaveformEventVisible,
  getFocusedEvent,
  getFocusedSpeaker
} from './dom-methods'

import {
  eventStore,
  splitEvent,
  splitEventAtChar,
  findEventAt,
  addEvent,
  appendEmptyEventAfter,
  prependEmptyEventBefore,
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
  shiftCharsLeft,
  shiftCharsRight,
  selectEvent,
  playAllFrom,
  pause,
  playEventsStart,
  playEventsEnd,
  timeSelectionIsEmpty,
  playRange
} from '../store/transcript'

import { saveChangesToServer } from '../service/backend-server'

import eventBus from '../service/event-bus'
import settings from '../store/settings';

type KeyboardModifier = 'alt'|'shift'|'ctrlOrCmd'

export interface KeyboardAction {
  // can have more than one modifier
  modifier: KeyboardModifier[]
  // some shortcuts can’t work in text fields
  ignoreInTextField: boolean
  disabled: () => boolean
  key: KeyboardEvent['key']
  name: string
  description: string
  icon: string|null
  action: (e: KeyboardEvent|MouseEvent) => any
  showInMenu: boolean
  // defines whether it captures inputs that have
  // more modifier keys than specified.
  // (useful for modifiable shortcuts, e.g. shift for jumps)
  greedy: boolean
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
  },
  {
    name: 'plus',
    jsName: '+',
    displayName: '＋'
  }
]

export const keyMap: _.Dictionary<KeyDescriber> = {
  ..._(normalKeys)
    .concat(specialKeys)
    .keyBy(t => t.jsName)
    .value(),
  ..._(modifierKeys)
    .keyBy(t => t.name)
    .value()
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

function normalizeKey(key: string) {
  // it’s a mac thing
  if (key === '±') {
    return '+'
  } else if (key === '–') {
    return '-'
  } else {
    return key
  }
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

function doModifiersMatch(ms: KeyboardModifier[], e: KeyboardEvent): boolean {
  return ([ 'alt', 'shift', 'ctrlOrCmd' ] as KeyboardModifier[]).every(mod => {
    return (
      (ms.indexOf(mod) > -1 && keyboardEventHasModifier(e, mod))
      || (ms.indexOf(mod) === -1 && !keyboardEventHasModifier(e, mod))
    )
  })
}

export async function handleGlobalShortcut(e: KeyboardEvent) {
  _(keyboardShortcuts).forEach(sc => {
    if (
      // the function is not disabled
      (sc.disabled === undefined || sc.disabled() === false) &&
      // the shortcut is allowed in text fields OR we’re not in a text field.
      (sc.ignoreInTextField === false || !isInputElement(e.target)) &&
      // the required key was pressed
      (normalizeKey(e.key.toLowerCase()) === sc.key.toLowerCase()) &&
      // check modifiers:
      (
        // no modifiers are required and none are present
        (sc.modifier.length === 0 && !e.ctrlKey && !e.shiftKey && !e.metaKey && !e.altKey) ||
        // the shortcut is greedy, and fires if at least all of the required modifiers are present
        (sc.greedy === true && sc.modifier.length > 0 && sc.modifier.every((m) => keyboardEventHasModifier(e, m))) ||
        // the modifiers specified are exactly the ones present
        (sc.modifier.length !== 0 && doModifiersMatch(sc.modifier, e))
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
    .join(platform() === 'mac' ? '' : '+')
}

export const keyboardShortcuts: KeyboardShortcuts = {
  split: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 's',
    name: 'Split Event',
    description: 'Split an Event at the current play-head position.',
    icon: 'call_split',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: async () => {
      const eventUnderPlayHead = findEventAt(eventStore.currentTime)
      if (eventUnderPlayHead === undefined) {
        const es = undoable(addEvent(eventStore.currentTime))
        selectEvents(es)
      } else {
        const splitAt = eventStore.currentTime - eventUnderPlayHead.startTime
        const [ leftEvent ] = undoable(splitEvent(eventUnderPlayHead, splitAt))
        if (!(await isWaveformEventVisible(leftEvent))) {
          scrollToAudioEvent(leftEvent)
        }
      }
    }
  },
  splitAtChar: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: '1',
    name: 'Split Event At Character',
    description: 'Split an Event at the Text Cursor position',
    icon: 'mdi-arrow-split-vertical',
    disabled: () => false,
    action: async (ev) => {
      const s = document.getSelection()
      const e = ev.target
      console.log({ ev, s, e })
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          console.log({ speakerId, eventId })
          undoable(splitEventAtChar(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
        }
      }
    }
  },
  shiftCharsRight: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'r',
    name: 'Shift Characters Right',
    description: 'Shift characters to the next event',
    icon: 'mdi-format-letter-starts-with',
    disabled: () => false,
    action: async (ev) => {
      ev.preventDefault()
      const s = document.getSelection()
      const e = ev.target
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          undoable(shiftCharsRight(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
        }
      }
    }
  },
  shiftCharsLeft: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'l',
    name: 'Shift Characters Left',
    description: 'Shift characters to the previous event',
    icon: 'mdi-format-letter-ends-with',
    disabled: () => false,
    action: (ev) => {
      ev.preventDefault()
      const s = document.getSelection()
      const e = ev.target
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          undoable(shiftCharsLeft(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
          return false
        }
      }
    }
  },
  appendEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'alt' ],
    key: '+',
    description: 'Append an event after the currently selected event.',
    icon: 'message',
    name: 'Append Event',
    disabled: () => false,
    action: async () => {
      const event = getFocusedEvent() || getSelectedEvent()
      const speaker = getFocusedSpeaker()
      if (event !== undefined) {
        const newEs = undoable(appendEmptyEventAfter(event))
        const es = newEs.length > 0 ? newEs : _.compact([ selectNextEvent(1, event) ])
        if (es.length > 0 && es[0] !== undefined) {
          scrollToTranscriptEvent(es[0], {
            focusSpeaker: speaker !== null ? Number(speaker) : null,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          scrollToAudioEvent(es[0])
          selectEvent(es[0])
          if (settings.playEventOnAppend) {
            playEvents(es)
          }
        }
      }
    }
  },
  prependEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'alt' ],
    key: '-',
    description: 'Prepend an event before the currently selected event.',
    icon: '',
    name: 'Prepend Event',
    disabled: () => false,
    action: async () => {
      const event = getFocusedEvent() || getSelectedEvent()
      const speaker = getFocusedSpeaker()
      if (event !== undefined) {
        const newEs = undoable(prependEmptyEventBefore(event))
        const es = newEs.length > 0 ? newEs : _.compact([ selectNextEvent(-1, event) ])
        if (es.length > 0 && es[0] !== undefined) {
          scrollToTranscriptEvent(es[0], {
            focusSpeaker: speaker !== null ? Number(speaker) : null,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          scrollToAudioEvent(es[0])
          selectEvent(es[0])
          if (settings.playEventOnAppend) {
            playEvents(es)
          }
        }
      }
    }
  },
  deleteEvents: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'Backspace',
    name: 'Delete Events',
    description: 'Delete selected Events',
    icon: 'delete',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: () => {
      undoable(deleteSelectedEvents())
      deselectEvents()
    }
  },
  joinEvents: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'j',
    name: 'Join Events',
    icon: 'merge_type',
    description: 'Join selected Events',
    disabled: () => eventStore.selectedEventIds.length < 2,
    action: () => {
      if (eventStore.selectedEventIds.length > 1) {
        undoable(joinEvents(eventStore.selectedEventIds))
      }
    }
  },
  moveEventStartLeft: {
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowLeft',
    name: 'Move event start left',
    description: 'Move the beginning of an event to the left',
    icon: 'mdi-arrow-expand-left',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventStartTime(e, t * -1))
      }
    }
  },
  moveEventStartRight: {
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowRight',
    name: 'Move event start right',
    description: 'Move the beginning of an event to the right (use Shift to jump)',
    icon: 'mdi-arrow-collapse-right',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventStartTime(e, t))
      }
    }
  },
  moveEventEndRight: {
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowRight',
    name: 'Move event end right',
    icon: 'mdi-arrow-expand-right',
    description: 'Move the end of an event to the right (use Shift to jump)',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventEndTime(e, t))
      }
    }
  },
  moveEventEndLeft: {
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowLeft',
    name: 'Move event end left',
    description: 'Move the end of an event to the left (use Shift to jump)',
    icon: 'mdi-arrow-expand-left',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: (ev) => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        undoable(moveEventEndTime(e, t * -1))
      }
    }
  },
  showEditMenu: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'e',
    name: 'Edit Menu',
    description: 'Show the editing Options',
    icon: 'edit',
    disabled: () => false,
    action: () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'edit') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'edit'
      }
    },
  },
  showHistory: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'h',
    name: 'History',
    description: 'Show the history',
    icon: 'history',
    disabled: () => false,
    action: () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'history') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'history'
      }
    },
  },
  showWarnings: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'e',
    name: 'Warnings',
    description: 'Show Warnings in the Sidebar',
    icon: 'mdi-alert-outline',
    disabled: () => false,
    action: () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'warnings') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'warnings'
      }
    },
  },
  showBookmarks: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'b',
    name: 'Show Bookmarks',
    description: 'Show Bookmarks in the Sidebar',
    icon: 'bookmark_border',
    disabled: () => false,
    action: async () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'bookmarks') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'bookmarks'
      }
    }
  },
  showSearch: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'f',
    name: 'Search',
    description: 'Focus the Search Field',
    icon: 'mdi-magnify',
    disabled: () => false,
    action: async () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'search') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'search'
        await Vue.nextTick()
        eventBus.$emit('focusSearch')
      }
    }
  },
  selectPreviousEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'ArrowLeft',
    name: 'Select Previous Event',
    description: 'Select the Event before the currently selected Event',
    icon: 'mdi-arrow-left',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: async () => {
      const e = selectPreviousEvent()
      if (e !== undefined) {
        focusSelectedEventElement()
      }
    }
  },
  selectNextEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'ArrowRight',
    name: 'Select Next Event',
    description: 'Select the Event after the currently selected Event',
    icon: 'mdi-arrow-right',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: async () => {
      const e = selectNextEvent()
      if (e !== undefined) {
        focusSelectedEventElement()
      }
    }
  },
  playPause: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 'Enter',
    name: 'Play/Pause',
    description: 'Play or Pause the currently selected Event',
    icon: 'mdi-play-pause',
    disabled: () => false,
    action: () => {
      if (eventStore.isPaused === true) {
        const es = getSelectedEvents()
        if (!timeSelectionIsEmpty()) {
          playRange(eventStore.userState.timeSelection.start || 0, eventStore.userState.timeSelection.end || 0)
        } else if (es.length > 0) {
          playEvents(es)
        } else {
          playAllFrom(eventStore.currentTime)
        }
      } else {
        pause()
      }
    }
  },
  playFirstSecondOfEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd', 'alt' ],
    key: 'Enter',
    name: 'Play start of Event',
    description: 'Play the first second of an Event',
    icon: 'mdi-contain-start',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: () => {
      if (eventStore.isPaused === true) {
        const es = getSelectedEvents()
        if (es.length > 0) {
          playEventsStart(es, 1)
        }
      } else {
        pause()
      }
    }
  },
  playLastSecondOfEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd', 'shift' ],
    key: 'Enter',
    name: 'Play end of Event',
    description: 'Play the last second of an Event',
    icon: 'mdi-contain-end',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: () => {
      if (eventStore.isPaused === true) {
        const es = getSelectedEvents()
        if (es.length > 0) {
          playEventsEnd(es, 1)
        }
      } else {
        pause()
      }
    }
  },
  scrollToEvent: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'Enter',
    name: 'Scroll to Event',
    description: 'Scroll to the selected Event',
    icon: 'mdi-eye',
    disabled: () => eventStore.selectedEventIds.length === 0,
    action: () => {
      const e = getSelectedEvent()
      if (e !== undefined) {
        scrollToAudioEvent(e)
        scrollToTranscriptEvent(e)
      }
    }
  },
  selectAllEvents: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [ 'ctrlOrCmd' ],
    key: 'a',
    name: 'Select All',
    description: 'Selects all Events',
    icon: null,
    disabled: () => false,
    action: () => {
      eventStore.selectedEventIds = eventStore.events.map(e => e.eventId)
    }
  },
  selectNone: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [ 'ctrlOrCmd' ],
    key: 'd',
    name: 'Select none',
    description: 'Selects no Events',
    icon: null,
    disabled: () => false,
    action: () => {
      deselectEvents()
      eventStore.userState.timeSelection = { start: null, end: null }
    }
  },
  saveTranscript: {
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 's',
    name: 'Save Transcript',
    description: 'Save the Transcript to the Server',
    disabled: () => history.actions.length === 0,
    icon: 'save_alt',
    action: async () => {
      eventStore.events = await saveChangesToServer(eventStore.events)
    }
  }
}
