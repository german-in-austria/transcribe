import { LocalTranscriptEvent, eventStore, ServerTranscript, LocalTranscript, timeToSeconds } from '@store/transcript'
import * as _ from 'lodash'

function getMetadataFromServerTranscript(res: ServerTranscript) {
  return {
    speakers: res.aInformanten!,
    tokenTypes: res.aTokenTypes!,
    transcriptName: res.aTranskript!.n,
    audioUrl: 'https://dissdb.dioe.at/private-media'
      + res.aEinzelErhebung!.dp.split('\\').join('/')
      + res.aEinzelErhebung!.af
      + '.ogg'
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
                      // TODO: not "text_in_ortho", but "ortho".
                      text: s.aTokens[id].to,
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

    const res = await (await fetch(`https://dissdb.dioe.at/routes/transcript/${ id }/${ chunk }`, {
      credentials: 'include'
    })).json() as ServerTranscript

    if (res.aNr === 0) {
      eventStore.metadata = getMetadataFromServerTranscript(res)
      eventStore.status = 'loading'
    }

    eventStore.events = buffer.concat(serverTranscriptToLocal(res))

    if (onProgress !== undefined && totalSteps !== undefined) {
      onProgress(res.aNr / totalSteps, eventStore.events)
    }

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
