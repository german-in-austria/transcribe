import { LocalTranscriptEvent, replaceEvents } from './transcript'
import _ from 'lodash'

export interface HistoryEventAction {
  id: string
  type: 'RESIZE'|'DELETE'|'CHANGE_TOKENS'|'ADD'|'JOIN'
  apply: boolean
  before: LocalTranscriptEvent[]
  after: LocalTranscriptEvent[]
}

export let history = {
  actions: [] as HistoryEventAction[]
}

export function undo() {
  const e = _.last(history.actions)
  if (e !== undefined) {
    if (e.type === 'CHANGE_TOKENS') {
      replaceEvents(e.after, e.before)
    } else if (e.type === 'JOIN') {
      replaceEvents(e.after, e.before)
    }
    history.actions.pop()
  } else {
    // nothing to undo
  }
}

export function undoable(action: HistoryEventAction|HistoryEventAction[]): LocalTranscriptEvent[] {
  history.actions = history.actions.concat(action)
  if (_.isArray(action)) {
    return _(action).flatMap((a) => a.after).value()
  } else {
    return action.after
  }
}
