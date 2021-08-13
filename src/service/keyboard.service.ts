
import _ from 'lodash'
import Vue from 'vue'

import { mutation, history } from '../store/history.store'
import { platform } from '../util'

import {
  focusSelectedEventElement,
  isWaveformEventVisible,
  getFocusedEvent,
  getFocusedSpeaker
} from './dom.service'

import { saveChangesToServer } from './backend-server.service'

import bus from './bus'
import store from '@/store'
import { computeTokenTypesForEvents } from './token-types.service'
import kaldiService from './kaldi/kaldiService'
import TranscriptAudio from '../classes/transcript-audio.class'
import settings from '@/store/settings.store'
import Transcript from '@/classes/transcript.class'

console.log({ store })

type KeyboardModifier = 'alt'|'shift'|'ctrlOrCmd'

export interface KeyboardAction {
  // can have more than one modifier
  modifier: KeyboardModifier[]
  // some shortcuts should not apply in text fields
  ignoreInTextField: boolean
  group: string
  disabled: (transcript: Transcript) => boolean
  key: KeyboardEvent['key']
  name: string
  description: string
  icon: string|null
  action: (e: KeyboardEvent|MouseEvent, t: Transcript) => any
  showInMenu: boolean
  // a class that gets added to the icon element.
  iconClass?: string
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

export const alphaNumericKeys: KeyDescriber[] = _('abcdefghijklmnopqrstuvwxyz1234567890+-')
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
  },
  {
    name: 'minus',
    jsName: '-',
    displayName: '﹣'
  }
]

export const keyMap: _.Dictionary<KeyDescriber> = {
  ..._(alphaNumericKeys)
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
  // it’s a mac thing.
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
  _(settings.keyboardShortcuts).forEach(sc => {
    if (
      // the function is not disabled
      (sc.disabled === undefined || sc.disabled(store.transcript!) === false) &&
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
        // this shortcut is not greedy, and the modifiers specified are exactly the ones present
        (sc.modifier.length !== 0 && doModifiersMatch(sc.modifier, e))
      )
    ) {
      if (store.transcript !== null) {
        e.preventDefault()
        sc.action(e, store.transcript)
        // break the loop when it was found.
        return false
      }
    }
  })
}

export function convertKey(a: KeyboardEvent['key']): string {
  return keyMap[a] === undefined ? '' : keyMap[a].displayName
}

export function convertModifier(a: KeyboardModifier[]): string[] {
  return a.map(m => keyMap[m] === undefined ? '' : keyMap[m].displayName)
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
  appendEvent: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'alt' ],
    key: '+',
    description: 'Append an event after the currently selected event.',
    icon: 'mdi-shape-rectangle-plus',
    name: 'Append Event',
    disabled: () => false,
    action: async (e, transcript) => {
      const selectedEvent = getFocusedEvent(transcript) || transcript.getSelectedEvent()
      const speaker = getFocusedSpeaker()
      if (selectedEvent !== undefined) {
        const newEs = mutation(transcript.appendEmptyEventAfter(selectedEvent))
        const es = newEs.length > 0 ? newEs : _.compact([ transcript.selectNextEvent(1, selectedEvent) ])
        if (es.length > 0 && es[0] !== undefined) {
          transcript.scrollToTranscriptEvent(es[0], {
            focusSpeaker: speaker,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          transcript.scrollToAudioEvent(es[0])
          transcript.selectEvent(es[0])
          if (settings.playEventOnAppend && transcript.audio !== null) {
            transcript.audio.playEvents(es)
          }
        }
      } else {
        const action = transcript.appendEmptyEventAt(transcript.audio!.currentTime)
        if (action !== undefined && action.after[0] !== undefined) {
          const e = action.after[0]
          transcript.scrollToTranscriptEvent(e, {
            focusSpeaker: speaker,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          transcript.scrollToAudioEvent(e)
          transcript.selectEvent(e)
          if (settings.playEventOnAppend && transcript.audio !== null) {
            transcript.audio.playEvents([ e ])
          }
        }
      }
    }
  },
  prependEvent: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'alt' ],
    key: '-',
    description: 'Prepend an event before the currently selected event.',
    icon: 'mdi-shape-rectangle-plus',
    iconClass: 'mirror-horizontal',
    name: 'Prepend Event',
    disabled: () => false,
    action: async (e, transcript) => {
      const event = getFocusedEvent(transcript) || transcript.getSelectedEvent()
      const speaker = getFocusedSpeaker()
      if (event !== undefined) {
        const newEs = mutation(transcript.prependEmptyEventBefore(event))
        const es = newEs.length > 0 ? newEs : _.compact([ transcript.selectNextEvent(-1, event) ])
        if (es.length > 0 && es[0] !== undefined) {
          transcript.scrollToTranscriptEvent(es[0], {
            focusSpeaker: speaker,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          transcript.scrollToAudioEvent(es[0])
          transcript.selectEvent(es[0])
          if (settings.playEventOnAppend && transcript.audio !== null) {
            transcript.audio.playEvents(es)
          }
        }
      } else if (transcript.audio !== null) {
        const action = transcript.prependEmptyEventAt(transcript.audio.currentTime)
        if (action !== undefined && action.after[0] !== undefined) {
          const e = action.after[0]
          transcript.scrollToTranscriptEvent(e, {
            focusSpeaker: speaker,
            animate: false,
            focusTier: null,
            focusRight: false
          })
          transcript.scrollToAudioEvent(e)
          transcript.selectEvent(e)
          if (settings.playEventOnAppend) {
            transcript.audio.playEvents([ e ])
          }
        }
      }
    }
  },
  deleteEvents: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'Backspace',
    name: 'Delete Events',
    description: 'Delete selected Events',
    icon: 'mdi-trash-can-outline',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      mutation(transcript.deleteSelectedEvents())
      transcript.deselectEvents()
    }
  },
  split: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 's',
    name: 'Split Event',
    description: 'Split an Event at the current play-head position.',
    icon: 'call_split',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: async (e, transcript) => {
      if (transcript.audio !== null) {
        const eventUnderPlayHead = transcript.findEventAt(transcript.audio.currentTime)
        if (eventUnderPlayHead === undefined) {
          const es = mutation(transcript.addEvent(transcript.audio.currentTime))
          transcript.selectEvents(es)
        } else {
          const splitAt = transcript.audio.currentTime - eventUnderPlayHead.startTime
          const [ leftEvent ] = mutation(transcript.splitEvent(eventUnderPlayHead, splitAt))
          if (!(await isWaveformEventVisible(leftEvent))) {
            transcript.scrollToAudioEvent(leftEvent)
          }
        }
      }
    }
  },
  splitAtChar: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: '1',
    name: 'Split Event At Character',
    description: 'Split an Event at the Text Cursor position',
    icon: 'mdi-arrow-split-vertical',
    disabled: () => false,
    action: async (ev, transcript) => {
      const s = document.getSelection()
      const e = ev.target
      console.log({ ev, s, e })
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          // console.log({ speakerId, eventId })
          mutation(transcript.splitEventAtChar(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
          // tslint:disable-next-line:max-line-length
          transcript.events = computeTokenTypesForEvents(transcript.events, transcript.meta.defaultTier, [ speakerId ])
        }
      }
    }
  },
  shiftCharsRight: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'r',
    name: 'Shift Characters Right',
    description: 'Shift characters to the next event',
    icon: 'mdi-format-letter-starts-with',
    disabled: () => false,
    action: async (ev, transcript) => {
      ev.preventDefault()
      const s = document.getSelection()
      const e = ev.target
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          mutation(transcript.shiftCharsRight(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
        }
      }
    }
  },
  shiftCharsLeft: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'l',
    name: 'Shift Characters Left',
    description: 'Shift characters to the previous event',
    icon: 'mdi-format-letter-ends-with',
    disabled: () => false,
    action: (ev, transcript) => {
      ev.preventDefault()
      const s = document.getSelection()
      const e = ev.target
      if (s !== null && e instanceof HTMLElement) {
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          mutation(transcript.shiftCharsLeft(Number(eventId), Number(speakerId), (s as any).baseOffset, (s as any).extentOffset))
          return false
        }
      }
    }
  },
  insertPause: {
    group: 'Editing',
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 'p',
    name: 'Insert Pause',
    description: 'Insert a pause at the current cursor position',
    icon: 'pause_circle_outline',
    disabled: (transcript) => transcript.uiState.timeSpanSelection.start === null,
    action: async (ev, transcript) => {
      ev.preventDefault()
      const s = document.getSelection()
      const e = ev.target
      if (
        s !== null &&
        e instanceof HTMLElement &&
        transcript.uiState.timeSpanSelection.start !== null &&
        transcript.uiState.timeSpanSelection.end !== null
      ) {
        const length = Math.abs(
          transcript.uiState.timeSpanSelection.start - transcript.uiState.timeSpanSelection.end
        )
        const speakerId = e.getAttribute('data-speaker-id')
        const eventId = e.getAttribute('data-event-id')
        if (speakerId !== null && eventId !== null) {
          // tslint:disable-next-line:max-line-length
          const [ left, right ] = [ (s as any).baseOffset, (s as any).extentOffset ].sort((a, b) => a - b)
          const oldText = e.innerText
          const leftPart = oldText.substr(0, left)
          const rightPart = oldText.substr(right)
          const insertText = `((${ length.toFixed(1).replace('.', ',') }s))`
          const text = leftPart
            + (leftPart.endsWith(' ') || leftPart.length === 0 ? '' : ' ')
            + insertText
            + (rightPart.startsWith(' ') || rightPart.length === 0 ? '' : ' ')
            + rightPart
          bus.$emit('updateSpeakerEventText', { eventId, speakerId, text })
          return false
        }
      }
    }
  },
  autoTranscribeEvent: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd', 'shift' ],
    key: 'k',
    description: 'Automatically Transcribe an Audio Segement',
    icon: 'mdi-text-to-speech',
    name: 'Auto-Transcribe Event',
    disabled: () => store.transcript?.uiState.selectedEventIds.length === 0,
    action: async (ev, transcript) => {
      if (transcript.audio !== null) {
        ev.preventDefault()
        const e = transcript.getSelectedEvent()
        if (e !== undefined) {
          const buffer = await TranscriptAudio.decodeBufferTimeSlice(e.startTime, e.endTime, transcript.audio.buffer.buffer)
          const result = await kaldiService.transcribeAudio(
            window.location.origin + '/kaldi-models/german.zip',
            buffer,
            () => null)
          const cleanResult = result.replaceAll(/\d\.\d\d\s/g, '')
          bus.$emit('updateSpeakerEventText', {
            eventId: e.eventId,
            // TODO: 0
            speakerId: Object.keys(transcript.meta.speakers)[0],
            text: cleanResult
          })
        }
      }
    }
  },
  joinEvents: {
    group: 'Editing',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'j',
    name: 'Join Events',
    icon: 'merge_type',
    description: 'Join selected Events',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length < 2,
    action: (e, transcript) => {
      if (transcript.uiState.selectedEventIds.length > 1) {
        mutation(transcript.joinEvents(transcript.uiState.selectedEventIds))
      }
    }
  },
  moveEventStartLeft: {
    group: 'Editing',
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowLeft',
    name: 'Move event start left',
    description: 'Move the beginning of an event to the left',
    icon: 'mdi-arrow-expand-left',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const e = transcript.getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey ? settings.moveEventTimeByInterval : settings.moveEventTimeByIntervalSmall
        mutation(transcript.moveEventStartTime(e, t * -1))
      }
    }
  },
  moveEventStartRight: {
    group: 'Editing',
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['alt'],
    key: 'ArrowRight',
    name: 'Move event start right',
    description: 'Move the beginning of an event to the right (use Shift to jump)',
    icon: 'mdi-arrow-collapse-right',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const e = transcript.getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey
          ? settings.moveEventTimeByInterval
          : settings.moveEventTimeByIntervalSmall
        mutation(transcript.moveEventStartTime(e, t))
      }
    }
  },
  moveEventEndRight: {
    group: 'Editing',
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowRight',
    name: 'Move event end right',
    icon: 'mdi-arrow-expand-right',
    description: 'Move the end of an event to the right (use Shift to jump)',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const e = transcript.getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey
          ? settings.moveEventTimeByInterval
          : settings.moveEventTimeByIntervalSmall
        mutation(transcript.moveEventEndTime(e, t))
      }
    }
  },
  moveEventEndLeft: {
    group: 'Editing',
    greedy: true,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'ArrowLeft',
    name: 'Move event end left',
    description: 'Move the end of an event to the left (use Shift to jump)',
    icon: 'mdi-arrow-expand-left',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const e = transcript.getSelectedEvent()
      if (e !== undefined) {
        const t = ev.shiftKey
          ? settings.moveEventTimeByInterval
          : settings.moveEventTimeByIntervalSmall
        mutation(transcript.moveEventEndTime(e, t * -1))
      }
    }
  },
  showEditMenu: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'e',
    name: 'Show Edit Menu',
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
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'h',
    name: 'Show History',
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
    }
  },
  showWarnings: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'e',
    name: 'Show Warnings',
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
  showTags: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd', 'shift'],
    key: 'b',
    name: 'Show Tags',
    description: 'Show Tags in the Sidebar',
    icon: 'bookmark_border',
    disabled: () => false,
    action: async () => {
      if (settings.showDrawer === true && settings.activeSidebarItem === 'tags') {
        settings.showDrawer = false
      } else {
        settings.showDrawer = true
        settings.activeSidebarItem = 'tags'
      }
    }
  },
  showSearch: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: ['ctrlOrCmd'],
    key: 'f',
    name: 'Show Search',
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
        bus.$emit('focusSearch')
      }
    }
  },
  selectPreviousEvent: {
    group: 'Selection',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'ArrowLeft',
    name: 'Select Previous Event',
    description: 'Select the Event before the currently selected Event',
    icon: 'mdi-arrow-left',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: async (ev, transcript) => {
      const e = transcript.selectPreviousEvent()
      if (e !== undefined) {
        focusSelectedEventElement()
      }
    }
  },
  selectNextEvent: {
    group: 'Selection',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'ArrowRight',
    name: 'Select Next Event',
    description: 'Select the Event after the currently selected Event',
    icon: 'mdi-arrow-right',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: async (ev, transcript) => {
      const e = transcript.selectNextEvent()
      if (e !== undefined) {
        focusSelectedEventElement()
      }
    }
  },
  playPause: {
    group: 'Playback',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 'Enter',
    name: 'Play/Pause',
    description: 'Play or Pause the currently selected Event',
    icon: 'mdi-play-pause',
    disabled: () => false,
    action: (ev, transcript) => {
      if (transcript.audio !== null) {
        if (transcript.audio.isPaused === true) {
          const es = transcript.getSelectedEvents()
          if (!transcript.isTimeSpanSelectionEmpty()) {
            transcript.audio.playRange(transcript.uiState.timeSpanSelection.start || 0, transcript.uiState.timeSpanSelection.end || 0)
          } else if (es.length > 0) {
            transcript.audio.playEvents(es)
          } else {
            transcript.audio.playAllFrom(transcript.audio.currentTime)
          }
        } else {
          transcript.audio.pause()
        }
      }
    }
  },
  playFirstSecondOfEvent: {
    group: 'Playback',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd', 'alt' ],
    key: 'Enter',
    name: 'Play start of Event',
    description: 'Play the first second of an Event',
    icon: 'mdi-contain-start',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      if (transcript.audio) {
        if (transcript.audio.isPaused === true) {
          const es = transcript.getSelectedEvents()
          if (es.length > 0) {
            transcript.audio.playEventsStart(es, 1)
          }
        } else {
          transcript.audio.pause()
        }
      }
    }
  },
  playLastSecondOfEvent: {
    group: 'Playback',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd', 'shift' ],
    key: 'Enter',
    name: 'Play end of Event',
    description: 'Play the last second of an Event',
    icon: 'mdi-contain-end',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      if (transcript.audio) {
        if (transcript.audio.isPaused === true) {
          const es = transcript.getSelectedEvents()
          if (es.length > 0) {
            transcript.audio.playEventsEnd(es, 1)
          }
        } else {
          transcript.audio.pause()
        }
      }
    }
  },
  scrollToEvent: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [],
    key: 'Enter',
    name: 'Scroll to Event',
    description: 'Scroll to the selected Event',
    icon: 'mdi-eye',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const e = transcript.getSelectedEvent()
      if (e !== undefined) {
        transcript.scrollToAudioEvent(e)
        transcript.scrollToTranscriptEvent(e)
      }
    }
  },
  inspectEvent: {
    group: 'Navigation',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 'i',
    name: 'Inspect Event…',
    description: 'View audio analysis and event details',
    icon: 'mdi-sine-wave',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (ev, transcript) => {
      const selectedEvent = transcript.getSelectedEvent()
      if (selectedEvent !== undefined) {
        transcript.uiState.inspectedEventId = selectedEvent.eventId
      }
    }
  },
  selectAllEvents: {
    group: 'Selection',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: true,
    modifier: [ 'ctrlOrCmd' ],
    key: 'a',
    name: 'Select All',
    description: 'Selects all Events',
    icon: 'mdi-checkbox-marked-circle-outline',
    disabled: () => false,
    action: (ev, transcript) => {
      transcript.uiState.selectedEventIds = transcript.events.map(e => e.eventId)
    }
  },
  selectNone: {
    group: 'Selection',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 'd',
    name: 'Select none',
    description: 'Selects no Events',
    icon: 'mdi-checkbox-blank-circle-outline',
    disabled: (transcript) => transcript.uiState.selectedEventIds.length === 0,
    action: (e, transcript) => {
      transcript.deselectEvents()
      transcript.uiState.timeSpanSelection = { start: null, end: null }
    }
  },
  saveTranscript: {
    group: 'File',
    greedy: false,
    showInMenu: true,
    ignoreInTextField: false,
    modifier: [ 'ctrlOrCmd' ],
    key: 's',
    name: 'Save Transcript',
    description: 'Save the Transcript to the Server',
    disabled: () => history.actions.length === 0,
    icon: 'save_alt',
    action: async (e, transcript) => {
      transcript.events = await saveChangesToServer(transcript)
    }
  }
}
