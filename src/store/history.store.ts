import _ from 'lodash'
import { TranscriptEvent } from '../types/transcript'
import { isUndoOrRedo } from '../util'
import { isWaveformEventVisible } from '../service/dom.service'
import { sendMessage } from '../service/socket'
import store from '@/store'
import Transcript from '@/classes/transcript.class'
const transcript = store.transcript || new Transcript()

type HistoryApplicationType = 'UNDO'|'REDO'|'DO'|'JUMPTOSTATE'

export interface HistoryEventAction {
  id: string
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'|'JOIN'|'SPLIT'
  apply: boolean
  time: Date
  before: TranscriptEvent[]
  after: TranscriptEvent[]
}

export type AutoSaver = () => Promise<any>

export let history = {
  actions: [] as HistoryEventAction[],
  autoSaver: (async () => console.log('fake auto-saved.')) as AutoSaver
}

export function handleRemotePeerEvent(data: [string, HistoryEventAction|HistoryEventAction[]|number]) {
  const [t, p] = data
  if (typeof p === 'number') {
    if (t === 'JUMPTOSTATE') {
      jumpToStateIndex(p)
    }
  } else {
    if (t === 'DO') {
      history.actions = history.actions
        .filter(a => a.apply === true)
        .concat(p)
      if (_.isArray(p)) {
        _(p).forEach(a => transcript.replaceEvents(a.before, a.after))
      } else {
        transcript.replaceEvents(p.before, p.after)
      }
    } else if (t === 'UNDO') {
      // if (_.isArray(p)) {
      //   p.forEach(undoAction)
      // } else {
      //   undoAction(p)
      // }
      undo()
    } else if (t === 'REDO') {
      redo()
      // if (_.isArray(p)) {
      //   p.forEach(redoAction)
      // } else {
      //   redoAction(p)
      // }
    }
  }
}

async function undoRedoHandler(e: KeyboardEvent) {
  const d = isUndoOrRedo(e)
  if (d.undo === true) {
    e.stopPropagation()
    e.preventDefault()
    const action = undo(true)
    if (action !== undefined) {
      notifyPeers(action, 'UNDO')
      transcript.selectEvents(action.before)
      if (action.before[0] !== undefined && !await isWaveformEventVisible(action.before[0])) {
        transcript.scrollToAudioEvent(action.before[0])
        transcript.scrollToTranscriptEvent(action.before[0])
      }
    }
  } else if (d.redo === true) {
    e.stopPropagation()
    e.preventDefault()
    const action = redo(true)
    if (action !== undefined) {
      notifyPeers(action, 'REDO')
      transcript.selectEvents(action.after)
      if (action.after[0] !== undefined && !await isWaveformEventVisible(action.after[0])) {
        transcript.scrollToAudioEvent(action.after[0])
        transcript.scrollToTranscriptEvent(action.after[0])
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
  if (target > -1) {
    const lastAppliedActionIndex = _.findLastIndex(history.actions, a => a.apply === true)
    if (target < lastAppliedActionIndex) {
      // undo: right to left, latest to oldest
      _(history.actions).forEachRight(applyOrUnApplyUntil(target))
    } else {
      // redo: left to right, oldest to latest
      _(history.actions).forEach(applyOrUnApplyUntil(target))
    }
    history.actions = history.actions.map((a, i) => ({ ...a,  apply: i <= target }))
  } else {
    // target is <= -1, go to initial state
    _(history.actions).forEachRight(applyOrUnApplyUntil(target))
    history.actions = history.actions.map(a => ({ ...a, apply: false }))
  }
}

export function jumpToState(action: HistoryEventAction, shouldAutoSave?: boolean) {
  const ai = history.actions.findIndex((a) => a.id === action.id)
  // if the index was found.
  if (ai > -1) {
    notifyPeers(ai, 'JUMPTOSTATE')
    jumpToStateIndex(ai)
    if (shouldAutoSave) {
      triggerDebouncedSaver()
    }
  }
}

function notifyPeers(
  a: HistoryEventAction|HistoryEventAction[]|number,
  t: HistoryApplicationType
) {
  if (transcript !== null) {
    sendMessage({
      type: 'transcript_action',
      app: 'transcribe',
      action: [t, a],
      transcript_id: String(transcript.key)
    })
  }
}

function undoAction(a: HistoryEventAction) {
  transcript.replaceEvents(a.after, a.before)
}

function redoAction(a: HistoryEventAction) {
  transcript.replaceEvents(a.before, a.after)
}

export function undo(shouldAutoSave?: boolean): HistoryEventAction|undefined {
  // the last action that is not yet undone.

  const a = _.last(history.actions.filter(x => x.apply === true))
  if (a !== undefined) {
    undoAction(a)
    a.apply = false
    if (shouldAutoSave === true) {
      triggerDebouncedSaver()
    }
    return a
  } else {
    // nothing has been done, so we can’t undo anything
  }
}

export function redo(shouldAutoSave?: boolean): HistoryEventAction|undefined {
  // find the most recently undone action.
  const a = history.actions.find(ac => ac.apply === false)
  if (a !== undefined) {
    redoAction(a)
    a.apply = true
    if (shouldAutoSave === true) {
      triggerDebouncedSaver()
    }
    return a
  } else {
    // nothing has been undone, so we can’t redo anything
  }
}

const autoSaveTimeout = 5000
let debouncer = setTimeout(() => null, 0)

export function triggerDebouncedSaver() {
  clearTimeout(debouncer)
  debouncer = setTimeout(
    history.autoSaver,
    autoSaveTimeout
  )
}

export function mutation(action: HistoryEventAction|HistoryEventAction[]|undefined): TranscriptEvent[] {
  // when doing an undoable thing,
  // all things that have been undone before
  // are not re-doable anymore, and thus are
  // deleted. the new undoable action is appended.
  if (action !== undefined) {
    // trigger de-bouncer
    triggerDebouncedSaver()
    // send to peers
    notifyPeers(action, 'DO')
    // update history
    history.actions = history.actions
      .filter(a => a.apply === true)
      .concat(action)
    // return the new event(s)
    if (_.isArray(action)) {
      return _(action).flatMap(a => a.after).value()
    } else {
      return action.after
    }
  } else {
    return []
  }
}
