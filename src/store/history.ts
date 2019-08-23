import _ from 'lodash'

import {
  LocalTranscriptEvent,
  replaceEvents,
  selectEvents,
  scrollToAudioEvent,
  scrollToTranscriptEvent
} from './transcript'

import {
  isUndoOrRedo
} from '../util'

import {
  isWaveformEventVisible
} from '../service/events-dom'

export interface HistoryEventAction {
  id: string
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'|'JOIN'|'INSERT'|'SPLIT'
  apply: boolean
  time: Date
  before: LocalTranscriptEvent[]
  after: LocalTranscriptEvent[]
}

export let history = {
  actions: [] as HistoryEventAction[]
}

async function undoRedoHandler(e: KeyboardEvent) {
  const d = isUndoOrRedo(e)
  if (d.undo === true) {
    e.stopPropagation()
    e.preventDefault()
    const action = undo()
    if (action !== undefined) {
      selectEvents(action.before)
      if (!await isWaveformEventVisible(action.before[0])) {
        scrollToAudioEvent(action.before[0])
        scrollToTranscriptEvent(action.before[0])
      }
    }
  } else if (d.redo === true) {
    e.stopPropagation()
    e.preventDefault()
    const action = redo()
    if (action !== undefined) {
      selectEvents(action.after)
      if (!await isWaveformEventVisible(action.after[0])) {
        scrollToAudioEvent(action.after[0])
        scrollToTranscriptEvent(action.after[0])
      }
    }
  }
}

export function startListening() {
  document.addEventListener('keydown', undoRedoHandler)
}

export function stopListening() {
  document.removeEventListener('keydown', undoRedoHandler)
}

export function canUndo(): boolean {
  // there is an applied undoable action.
  return history.actions.find(a => a.apply === true) !== undefined
}

export function goToInitialState() {
  jumpToStateIndex(-1)
}

function applyOrUnApplyUntil(si: number) {
  return (a: HistoryEventAction, i: number) => {
    if (si >= i && a.apply === false) {
      redoAction(a)
    } else if (si < i && a.apply === true) {
      undoAction(a)
    }
  }
}

function jumpToStateIndex(target: number) {
  if (target > - 1) {
    const lastAppliedActionIndex = _.findLastIndex(history.actions, a => a.apply === true)
    if (target < lastAppliedActionIndex) {
      // undo: right to left, latest to oldest
      _(history.actions).forEachRight(applyOrUnApplyUntil(target))
    } else {
      // redo: left to right, oldest to latest
      _(history.actions).forEach(applyOrUnApplyUntil(target))
    }
    history.actions = history.actions.map((a, i) => ({ ...a,  apply: i <= target}))
  } else {
    // target is <= -1, go to initial state
    _(history.actions).forEachRight(applyOrUnApplyUntil(target))
    history.actions = history.actions.map((a, i) => ({ ...a,  apply: false}))
  }
}

export function jumpToState(action: HistoryEventAction) {
  const ai = history.actions.findIndex((a) => a.id === action.id)
  // if the index was found.
  jumpToStateIndex(ai)
}

function undoAction(a: HistoryEventAction) {
  replaceEvents(a.after, a.before)
}

function redoAction(a: HistoryEventAction) {
  replaceEvents(a.before, a.after)
}

export function undo(): HistoryEventAction|undefined {
  // the last action that is not yet undone.
  const a = _.last(history.actions.filter(x => x.apply === true))
  if (a !== undefined) {
    undoAction(a)
    a.apply = false
    return a
  } else {
    // nothing has been done, so we can’t undo anything
  }
}

export function redo(): HistoryEventAction|undefined {
  // find the most recent undone action.
  const a = history.actions.find(ac => ac.apply === false)
  if (a !== undefined) {
    redoAction(a)
    a.apply = true
    return a
  } else {
    // nothing has been undone, so we can’t redo anything
  }
}

export function undoable(action: HistoryEventAction|HistoryEventAction[]): LocalTranscriptEvent[] {
  // when doing an undoable thing,
  // all things that have been undone before
  // are not re-doable anymore, and are deleted.
  // the new undoable action is appended.
  history.actions = history.actions
    .filter(a => a.apply === true)
    .concat(action)
  if (_.isArray(action)) {
    return _(action).flatMap(a => a.after).value()
  } else {
    return action.after
  }
}
