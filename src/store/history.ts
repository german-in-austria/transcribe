import { LocalTranscriptEvent, replaceEvents } from './transcript'
import _ from 'lodash'

export interface HistoryEventAction {
  id: string
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'|'JOIN'|'INSERT'
  apply: boolean
  before: LocalTranscriptEvent[]
  after: LocalTranscriptEvent[]
}

export let history = {
  actions: [] as HistoryEventAction[]
}

export function jumpToState(action: HistoryEventAction) {
  const ai = history.actions.findIndex((a) => a.id === action.id)
  // if the index was found.
  if (ai > - 1) {
    history.actions = history.actions.map((a, hi) => {
      // everything before this action must
      // be applied
      if (ai >= hi) {
        // side effect
        if (a.apply === false) {
          redoAction(a)
        }
        // mark applied in history
        return { ...a, apply: true }
      // everything after this action
      // must NOT be applied
      } else {
        // side effect
        if (a.apply === true) {
          undoAction(a)
        }
        // mark UNapplied in history
        return { ...a, apply: false }
      }
    })
  } else {
    // can’t jump to state that’s not on record.
  }
}

function undoAction(a: HistoryEventAction) {
  replaceEvents(a.after, a.before)
}

function redoAction(a: HistoryEventAction) {
  replaceEvents(a.before, a.after)
}

export function undo() {
  // the last action that is not yet undone.
  const a = _.last(history.actions.filter(x => x.apply === true))
  if (a !== undefined) {
    undoAction(a)
    a.apply = false
  } else {
    // nothing has been done, so we can’t undo anything
  }
}

export function redo() {
  // find the most recent undone action.
  const a = history.actions.find(ac => ac.apply === false)
  if (a !== undefined) {
    redoAction(a)
    a.apply = true
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
