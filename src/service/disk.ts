/// <reference types="@types/wicg-file-system-access" />

import localForage from 'localforage'
import JSZip from 'jszip'
import _ from 'lodash'

import { convertToServerTranscript, ServerTranscript, ServerTranscriptListItem } from '../service/backend-server'
import { JSONObject, Settings } from '../store/settings'
import { HistoryEventAction } from '../store/history'
import Transcript, { TranscriptMetaData } from './transcript.class'
import { LocalTranscriptEvent } from '@/store/transcript'

const FILE_FORMAT_VERSION = '2'

interface ProjectFile {
  serverTranscript: ServerTranscript
  audioBuffer: Uint8Array
  events: LocalTranscriptEvent[]
  uiState: any,
  meta: TranscriptMetaData,
  overviewSvg: string
  historyActions: HistoryEventAction[]
  settings: Settings
}

export interface LocalTranscriptListItem extends ServerTranscriptListItem {
  fileHandle: FileSystemFileHandle
}

class FileService {
  private readonly indexKeyLocalTranscripts = 'recentLocalTranscripts'
  private _localTranscripts: LocalTranscriptListItem[] = []
  private fileHandle: FileSystemFileHandle|null = null
  private zipFile = new JSZip()

  constructor() {
    this.loadTranscriptList()
  }

  makePrimaryKey() {
    return Number(_.uniqueId())
  }

  get localTranscripts() {
    return this._localTranscripts
  }

  async loadTranscriptList(): Promise<LocalTranscriptListItem[]> {
    const lts: any[] = await localForage.getItem(this.indexKeyLocalTranscripts) || []
    this._localTranscripts.push(...lts)
    return this._localTranscripts
  }

  async addTranscriptToRecents(t: LocalTranscriptListItem) {
    this._localTranscripts.unshift(t)
    localForage.setItem(this.indexKeyLocalTranscripts, this._localTranscripts)
  }

  async openFile(accept: { [mime: string]: string }): Promise<FileSystemFileHandle> {
    const x = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          accept,
          description: 'Transcribe, Ogg/Vorbis, or Exmaralda Files'
        }
      ]
    })
    const fName = x[0].name
    if (fName.endsWith('.transcript')) {
      return this.openTranscriptFile(x[0])
    } else {
      return x[0]
    }
  }

  async getPermission(fh: FileSystemFileHandle): Promise<boolean> {
    if (await fh.queryPermission({ mode: 'readwrite' }) === 'granted') {
      return true
    } else if (await fh.requestPermission({ mode: 'readwrite' }) === 'granted') {
      return true
    } else {
      return false
    }
  }

  async isNewFile(f: FileSystemFileHandle): Promise<boolean> {
    return this.localTranscripts.every(async (l) => !(await l.fileHandle.isSameEntry(f)))
  }

  async openTranscriptFile(f: FileSystemFileHandle): Promise<FileSystemFileHandle> {
    if (await this.isNewFile(f)) {
      this.addTranscriptToRecents({
        fileHandle: f,
        n: f.name,
        pk: this.makePrimaryKey(),
        ut: new Date((await f.getFile()).lastModified).toDateString()
      })
    }
    this.fileHandle = f
    console.log('openTranscriptFile', this.fileHandle)
    return f
  }

  async loadProjectFile(f: FileSystemFileHandle): Promise<ProjectFile> {
    this.fileHandle = f
    await this.zipFile.loadAsync(await f.getFile())
    const audioBuffer = (await this.zipFile.file('audio.ogg')?.async('uint8array')) || new Uint8Array()
    const serverTranscriptFile = await this.zipFile.file('transcript.json')?.async('text')
    const events = await this.zipFile.file('events.json')?.async('text')
    const uiState = await this.zipFile.file('uiState.json')?.async('text')
    const meta = await this.zipFile.file('meta.json')?.async('text')
    const settings = await this.zipFile.file('settings.json')?.async('text')
    const historyActions = await this.zipFile.file('history.json')?.async('text')
    const overviewSvg = await this.zipFile.file('overview.svg')?.async('text')
    const version = await this.zipFile.file('VERSION')?.async('text')
    if (
      serverTranscriptFile !== undefined &&
      events !== undefined &&
      uiState !== undefined &&
      meta !== undefined &&
      settings !== undefined &&
      historyActions !== undefined &&
      overviewSvg !== undefined &&
      version === FILE_FORMAT_VERSION
    ) {
      return {
        serverTranscript: JSON.parse(serverTranscriptFile),
        events: JSON.parse(events),
        uiState: JSON.parse(uiState),
        meta: JSON.parse(meta),
        historyActions: JSON.parse(historyActions),
        settings: JSON.parse(settings),
        audioBuffer,
        overviewSvg
      }
    } else {
      throw new Error('incomplete or incompatible file.')
    }
  }

  async saveFile(
    transcript: Transcript,
    historyActions: HistoryEventAction[]
  ) {
    // we’re only updating the files in the zipFile here.
    this.zipFile.file('events.json', JSON.stringify(transcript.events))
    this.zipFile.file('uiState.json', JSON.stringify(transcript.uiState))
    this.zipFile.file('meta.json', JSON.stringify(transcript.meta))
    this.zipFile.file('history.json', JSON.stringify(historyActions))
    // write to disk
    if (this.fileHandle !== null) {
      const writable = await this.fileHandle.createWritable()
      const blob = await this.zipFile.generateAsync({ type: 'blob' })
      await writable.write(blob)
      await writable.close()
    }
  }

  async generateProjectFile(
    transcript: Transcript,
    overviewWave: string,
    audioBuffer: Uint8Array|null,
    historyActions: HistoryEventAction[]
  ): Promise<Blob> {
    this.zipFile = new JSZip()
    const newServerTranscript = await convertToServerTranscript(transcript.events)
    this.zipFile.file('overview.svg', overviewWave)
    if (audioBuffer !== null) {
      // The ogg file is not zipped, because it’s already compressed.
      // That would waste compute cycles.
      this.zipFile.file('audio.ogg', audioBuffer.buffer, { compression: 'STORE' })
    }
    this.zipFile.file('transcript.json', JSON.stringify(newServerTranscript))
    this.zipFile.file('events.json', JSON.stringify(transcript.events))
    this.zipFile.file('uiState.json', JSON.stringify(transcript.uiState))
    this.zipFile.file('meta.json', JSON.stringify(transcript.meta))
    this.zipFile.file('history.json', JSON.stringify(historyActions))
    this.zipFile.file('VERSION', '2')
    return this.zipFile.generateAsync({ type: 'blob' })
  }
}

export default new FileService()
