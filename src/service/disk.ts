/// <reference types="@types/wicg-file-system-access" />

import localForage from 'localforage'
import JSZip from 'jszip'
import _ from 'lodash'

import { convertToServerTranscript, ServerTranscript, ServerTranscriptListItem } from '../service/backend-server'
import { Settings } from '../store/settings'
import { HistoryEventAction, history } from '../store/history'
import { eventStore } from '@/store/transcript'

interface ProjectFile {
  serverTranscript: ServerTranscript
  audioBuffer: Uint8Array
  eventStore: any
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
    console.log(this._localTranscripts)
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
          description: 'Transcribe, OGG, or Exmaralda Files'
        }
      ]
    })
    const fName = x[0].name
    console.log(fName)
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
    console.time('zip load')
    this.fileHandle = f
    await this.zipFile.loadAsync(await f.getFile())
    console.timeEnd('zip load')
    console.time('unzip audio')
    const audioBuffer = (await this.zipFile.file('audio.ogg')?.async('uint8array')) || new Uint8Array()
    console.timeEnd('unzip audio')
    const serverTranscriptFile = await this.zipFile.file('transcript.json')?.async('text')
    const eventStore = await this.zipFile.file('eventStore.json')?.async('text')
    const settings = await this.zipFile.file('settings.json')?.async('text')
    const historyActions = await this.zipFile.file('history.json')?.async('text')
    const overviewSvg = await this.zipFile.file('overview.svg')?.async('text')
    if (
      serverTranscriptFile !== undefined &&
      eventStore !== undefined &&
      settings !== undefined &&
      historyActions !== undefined &&
      overviewSvg !== undefined
    ) {
      return {
        serverTranscript: JSON.parse(serverTranscriptFile),
        audioBuffer,
        eventStore: JSON.parse(eventStore),
        overviewSvg,
        historyActions: JSON.parse(historyActions),
        settings: JSON.parse(settings)
      }
    } else {
      throw new Error('incomplete file')
    }
  }

  async saveFile() {
    this.zipFile.file('eventStore.json', JSON.stringify(eventStore))
    this.zipFile.file('history.json', JSON.stringify(history.actions))
    console.log('history actions', history.actions)
    console.log('fileHandle', this.fileHandle)
    if (this.fileHandle !== null) {
      const writable = await this.fileHandle.createWritable()
      console.log('writable', writable)
      const blob = await this.zipFile.generateAsync({ type: 'blob' })
      await writable.write(blob)
      await writable.close()
    }
  }

  async generateProjectFile(
    eventStore: any,
    overviewWave: string,
    audioBuffer: Uint8Array,
    historyActions: HistoryEventAction[]
  ): Promise<Blob> {
    this.zipFile = new JSZip()
    const newServerTranscript = await convertToServerTranscript(eventStore.events)
    console.timeEnd('convert to server transcript')
    console.time('zip')
    this.zipFile.file('overview.svg', overviewWave)
    this.zipFile.file('audio.ogg', audioBuffer.buffer, { compression: 'STORE' })
    this.zipFile.file('transcript.json', JSON.stringify(newServerTranscript))
    this.zipFile.file('history.json', JSON.stringify(historyActions))
    this.zipFile.file('eventStore.json', JSON.stringify(eventStore))
    this.zipFile.file('VERSION', '1')
    console.timeEnd('zip')
    return this.zipFile.generateAsync({ type: 'blob' })
  }
}

export default new FileService()
