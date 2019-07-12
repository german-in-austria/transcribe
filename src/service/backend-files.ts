
import * as jszip from 'jszip'
import { ServerTranscript, convertToServerTranscript } from '../store/transcript'
import { Settings } from '../store/settings'
import { HistoryEventAction } from '../store/history'

interface ProjectFile {
  serverTranscript: ServerTranscript
  audioBuffer: Uint8Array
  eventStore: any
  overviewSvg: string
  historyActions: HistoryEventAction[]
  settings: Settings
}

export async function parseProjectFile(f: File): Promise<ProjectFile> {
  const zip = new jszip()
  await zip.loadAsync(f)
  const audioBuffer = await zip.file('audio.ogg').async('uint8array')
  const serverTranscriptFile = JSON.parse(await zip.file('transcript.json').async('text')) as ServerTranscript
  const eventStore = JSON.parse(await zip.file('eventStore.json').async('text'))
  const settings = JSON.parse(await zip.file('settings.json').async('text')) as Settings
  const historyActions = JSON.parse(await zip.file('history.json').async('text')) as HistoryEventAction[]
  const overviewSvg = await zip.file('overview.svg').async('text')
  return {
    serverTranscript: serverTranscriptFile,
    audioBuffer,
    eventStore,
    overviewSvg,
    historyActions,
    settings
  }
}

export async function generateProjectFile(
  eventStore: any,
  overviewWave: string,
  settings: Settings,
  audioBuffer: Uint8Array,
  historyActions: HistoryEventAction[],
): Promise<Blob> {
  const zip = new jszip()
  const newServerTranscript = await convertToServerTranscript(eventStore.events)
  zip.file('overview.svg', overviewWave)
  zip.file('settings.json', JSON.stringify(settings))
  zip.file('audio.ogg', audioBuffer.buffer, {compression: 'STORE'})
  zip.file('transcript.json', JSON.stringify(newServerTranscript))
  zip.file('history.json', JSON.stringify(historyActions))
  zip.file('eventStore.json', JSON.stringify(eventStore))
  zip.file('VERSION', '1')
  return zip.generateAsync({ type: 'blob'})
}
