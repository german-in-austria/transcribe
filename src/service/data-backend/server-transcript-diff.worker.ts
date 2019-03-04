const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')
import { ServerToken, ServerTranscript, ServerEvent } from '@store/transcript';
// this is annoying. lodash loses typings when imported in this way,
// but it’s also the only way to get webpack 2 to tree-shake it.
const reduce = require('lodash/reduce')
const keyBy = require('lodash/keyBy')

interface ServerTokenWithStatus extends ServerToken {
  status: 'delete'|'insert'|'update'
}

interface ServerEventWithStatus extends ServerEvent {
  status: 'delete'|'insert'|'update'
}

function hasTokenChanged(l: ServerToken, r: ServerToken): boolean {
  return (
    l.tr !== r.tr ||
    l.tt !== r.tt ||
    l.t  !== r.t ||
    l.i  !== r.i ||
    l.e  !== r.e ||
    l.o  !== r.o
    // || l.fo !== r.fo
  )
}

function hasEventChanged(l: ServerEvent, r: ServerEvent): boolean {
  return (
    l.e !== r.e ||
    l.s !== r.s
  )
}

registerPromiseWorker((message: {oldT: ArrayBuffer, newT: ArrayBuffer}, withTransferList: (...args: any[]) => any) => {
  const { oldT, newT } = message
  const oldTranscript = JSON.parse(textDecoder.decode(oldT)) as ServerTranscript
  const newTranscript = JSON.parse(textDecoder.decode(newT)) as ServerTranscript
  const oldIndexedEvents = keyBy(oldTranscript.aEvents, 'pk')
  const newIndexedEvents = keyBy(newTranscript.aEvents, 'pk')

  console.log(oldTranscript.aTokens, newTranscript.aTokens)

  const tokenUpdatesAndInserts = reduce(newTranscript.aTokens, (
    m: _.Dictionary<ServerTokenWithStatus>,
    t: ServerToken,
    id: string
  ) => {
    if (Number(id) < 0) {
      m[id] = {
        ...t,
        status: 'insert'
      }
    } else if (
      oldTranscript.aTokens[id] !== undefined &&
      hasTokenChanged(t, oldTranscript.aTokens[id])
    ) {
      m[id] = {
        ...t,
        status: 'update'
      }
    }
    return m
  }, {} as _.Dictionary<ServerTokenWithStatus>) as _.Dictionary<ServerTokenWithStatus>

  const tokenDeletions = reduce(oldTranscript.aTokens, (
    m: _.Dictionary<ServerTokenWithStatus>,
    t: ServerToken,
    id: string
  ) => {
    if (newTranscript.aTokens[id] === undefined) {
      m[id] = {
        ...t,
        status: 'delete'
      }
    }
    return m
  }, {} as _.Dictionary<ServerTokenWithStatus>) as _.Dictionary<ServerTokenWithStatus>

  const eventUpdatesAndInserts = reduce(newIndexedEvents, (
    m: ServerEventWithStatus[],
    e: ServerEvent
  ) => {
    if (e.pk < 0) {
      m.push({
        ...e,
        status: 'insert'
      })
    } else if (
      oldIndexedEvents[e.pk] !== undefined &&
      hasEventChanged(e, oldIndexedEvents[e.pk])
    ) {
      m.push({
        ...e,
        status: 'update'
      })
    }
    return m
  }, [] as ServerEventWithStatus[]) as ServerEventWithStatus[]

  const eventDeletions = reduce(oldIndexedEvents, (
    m: ServerEventWithStatus[],
    e: ServerEvent
  ) => {
    if (newIndexedEvents[e.pk] === undefined) {
      m.push({
        ...e,
        status: 'delete'
      })
    }
    return m
  }, [] as ServerEventWithStatus[]) as ServerEventWithStatus[]

  return {
    aTokens: {
      ...tokenDeletions,
      ...tokenUpdatesAndInserts
    },
    aEvents: [
      ...eventDeletions,
      ...eventUpdatesAndInserts
    ]
  }
})

export default null as any
