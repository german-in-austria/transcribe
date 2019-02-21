import {
  LocalTranscriptEvent,
  eventStore,
  ServerTranscript,
  LocalTranscript,
  timeToSeconds,
  timeFromSeconds,
  HistoryEventAction,
  ServerEvent
} from '@store/transcript'

import * as _ from 'lodash'

function getMetadataFromServerTranscript(res: ServerTranscript) {
  return {
    speakers: res.aInformanten!,
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    audioUrl: 'https://dissdb.dioe.at/private-media'
      + res.aEinzelErhebung!.dp.split('\\').join('/')
      + res.aEinzelErhebung!.af
      + '.ogg',
    tiers: [
      {
        name: 'default',
        show: true
      },
      {
        name: 'ortho',
        show: false
      }
    ]
  }
}

// TODO:
function historyToServerTranscript(hs: HistoryEventAction[], s: ServerTranscript): ServerTranscript {
  return {
    ...s,
    aEvents: _(hs).reduce((m, e, i, l) => {
      m.push({
        pk: e.events[0].eventId,
        e: timeFromSeconds(e.events[0].endTime),
        s: timeFromSeconds(e.events[0].startTime),
        l: 0,
        tid: _(e.events[0].speakerEvents).mapValues((v, k) => {
          return v.tokens.map((t) => t.id)
        }).value()
      })
      return m
    }, [] as ServerEvent[]),
    // aTokens: [],
  }
}

function serverTranscriptToLocal(s: ServerTranscript): LocalTranscript {
  const x = _(s.aEvents)
    .groupBy((e) => {
      return e.s + '-' + e.e
    })
    .flatMap((e) => {
      return {
        eventId: e[0].pk,
        startTime: timeToSeconds(e[0].s),
        endTime: timeToSeconds(e[0].e),
        speakerEvents: _.reduce(e, (m, se) => {
          _.map(se.tid, (tokenIds, speakerKey) => {
            m[speakerKey] = {
              speakerEventId: se.pk,
              tokens: _.map(tokenIds, (id) => {
                return {
                  id,
                  tiers : {
                    default: {
                      text: s.aTokens[id].t,
                      type: s.aTokens[id].tt
                    },
                    ortho: {
                      text: s.aTokens[id].o || '',
                      type: null
                    }
                  }
                }
              })
            }
          })
          return m
        }, {} as LocalTranscriptEvent['speakerEvents'])
      }
    }).value()
  return x
}

export async function getTranscript(
  id: number,
  onProgress: (v: number, es: LocalTranscriptEvent[]) => any,
  chunk = 0,
  buffer: LocalTranscript = [],
  totalSteps?: number,
): Promise<LocalTranscript> {
  try {

    // download transcript page
    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    // when it’s the first page
    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
      eventStore.status = 'loading'
    }

    // convert and concat
    eventStore.events = buffer.concat(serverTranscriptToLocal(res))

    // progress callback with data
    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps, eventStore.events)
    }

    // get next (recursion) or finish
    if (res.nNr > res.aNr)  {
      return getTranscript(
        id,
        onProgress,
        chunk + 1,
        eventStore.events,
        totalSteps || res.aTmNr
      )
    } else {
      eventStore.status = 'finished'
      return buffer
    }
  } catch (e) {
    console.error(e)
    return buffer
  }
}
