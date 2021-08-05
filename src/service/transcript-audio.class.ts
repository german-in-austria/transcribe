import { concatUint8ArrayAsync, isUrl, readU8le } from '@/util'
import { AudioMetaData, OggHeader, OggIndex, OggPage } from './audio'
import * as concatBuffer from 'array-buffer-concat'
import { AudioFileOrUrl } from './transcript.class'
import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as PromiseWorker from 'promise-worker-transferable'
import OggIndexWorker from './oggindex.worker'
import _ from 'lodash'
const oggIndexWorker = new PromiseWorker(new OggIndexWorker(''))

// account for browser api differences
const CtxClass: any = window.AudioContext || window.webkitAudioContext
const audioContext: AudioContext = new CtxClass()
const bufferSrc = audioContext.createBufferSource()

export default class TranscriptAudio {
  constructor(a: AudioFileOrUrl, overviewWaveformSvg?: string) {
    if (a instanceof File || a instanceof ArrayBuffer) {
      this.convertAndLoadUint8(a)
      this.fileSize = this.buffer.byteLength
      this.decodeBufferProgressively(this.buffer)
    } else if (isUrl(a)) {
      this.downloadAndDecodeBufferProgressively(a, 2048 * 1024)
    }
  }

  private audioElement = document.createElement('audio')
  private oggHeaders: OggHeader[] = []

  duration = 0 // seconds
  fileSize = 0 // bytes
  currentTime = 0 // seconds
  isPaused: boolean = true
  onChunkAvailable: null|((startTime: number, endTime: number, audioBuffer: AudioBuffer) => any) = null
  buffer = new Uint8Array(0)
  isLocalFile = false
  url = ''

  private async downloadAndDecodeBufferProgressively(url: string, chunkSize: number) {
    this.fileSize = await this.getFileSize(url)
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      // const metadata = await this.getAudioMetadata(url)
      fetch(url, { credentials: 'include' }).then(async (res) => {
        // onStart(metadata)
        let preBuffer = new Uint8Array(0)
        if (res.body instanceof ReadableStream) {
          const reader = res.body.getReader()
          const that = this
          await reader
            .read()
            .then(async function process(chunk: ReadableStreamReadResult<Uint8Array>): Promise<any> {
              if (chunk.done === false) {
                if (chunk.value && chunk.value.buffer instanceof ArrayBuffer) {
                  [ preBuffer ] = await concatUint8ArrayAsync(preBuffer, chunk.value)
                  if (preBuffer.byteLength > chunkSize) {
                    await that.processAndStoreAudioDownloadChunk(preBuffer, that.onChunkAvailable)
                    preBuffer = new Uint8Array(0)
                  }
                } else {
                  // console.log('received non-buffer', chunk)
                }
                // recursion
                return reader.read().then(process)
              } else {
                await that.processAndStoreAudioDownloadChunk(preBuffer, that.onChunkAvailable)
                // await audio.cacheOggIndex(audio.store.uint8Buffer.buffer)
                // done.
                resolve(undefined)
              }
            })
        }
      })
    })
  }

  async getFileSize(url: string): Promise<number> {
    return Number((await fetch(url, {
      credentials: 'include',
      method: 'HEAD'
    })).headers.get('Content-Length'))
  }

  private async processAndStoreAudioDownloadChunk(
    b: Uint8Array,
    c: ((from: number, to: number, chunk: AudioBuffer) => any)|null
  ) {
    const { headers, pages } = await TranscriptAudio.getOggIndexAsync(b.buffer)
    const buffers = await concatUint8ArrayAsync(this.buffer, b)
    this.buffer = buffers[0]
    if (headers.length > 0) {
      this.oggHeaders = this.oggHeaders.concat(headers)
    }
    if (pages.length > 0) {
      const firstPage = pages[0]
      const lastPage = pages[pages.length - 1]
      if (
        firstPage !== undefined &&
        lastPage !== undefined &&
        c !== null &&
        this.buffer.byteLength > 0
      ) {
        try {
          const decoded = await TranscriptAudio.decodeBufferByteRange(
            this.buffer.byteLength - lastPage.byteOffset,
            this.buffer.byteLength,
            this.buffer.buffer
          )
          await c(firstPage.timestamp, lastPage.timestamp, decoded)
        } catch (e) {
          console.log('streaming decoder error', e)
        }
      }
    }
  }

  private static async doesServerAcceptRanges(url: string): Promise<boolean> {
    const res = (await fetch(url, { method: 'HEAD', credentials: 'include' }))
    // FIXME: this is often a problem with CORS requests.
    // return res.headers.has('Accept-Ranges')
    return true
  }

  private async getAudioMetadata(url: string): Promise<AudioMetaData> {
    const limitKb = 100
    if ((await TranscriptAudio.doesServerAcceptRanges(url)) === false) {
      throw new Error('server doesn’t accept ranges')
    } else {
      const chunk = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Range: `bytes=0-${ limitKb * 1024 }` }
      })
      const fileSize = (await fetch(url, {
        credentials: 'include',
        method: 'HEAD'
      })).headers.get('Content-Length')
      const bufferFirstSlice = await chunk.arrayBuffer()
      const { headers, pages } = await TranscriptAudio.getOggIndexAsync(bufferFirstSlice)
      return {
        url,
        sampleRate: TranscriptAudio.getOggSampleRate(bufferFirstSlice),
        headers,
        pages,
        bitRate: TranscriptAudio.getOggNominalBitrate(bufferFirstSlice),
        fileSize: Number(fileSize),
        headerBuffer: TranscriptAudio.getOggHeaderBuffer(bufferFirstSlice)
      }
    }
  }
  

  private async decodeBufferProgressively(b: Uint8Array) {
    const { pages } = await TranscriptAudio.getOggIndexAsync(b.buffer)
    const chunks = _.chunk(pages, 1000)
    for (const chunk of chunks) {
      const firstPage = _.first(chunk)
      const lastPage = _.last(chunk)
      if (firstPage !== undefined && lastPage !== undefined) {
        const decoded = await TranscriptAudio.decodeBufferByteRange(firstPage.byteOffset, lastPage.byteOffset, b.buffer)
        if (this.onChunkAvailable !== null) {
          await this.onChunkAvailable(firstPage.timestamp, lastPage.timestamp, decoded)
        }
      }
    }
  }

  async static getOggIndexAsync(buffer: ArrayBuffer): Promise<OggIndex> {
    const m = await oggIndexWorker.postMessage({ buffer })
    return m.oggIndex
  }

  async convertAndLoadUint8(f: File|ArrayBuffer) {
    if (f instanceof File) {
      this.buffer = new Uint8Array(await f.arrayBuffer())
    } else {
      this.buffer = new Uint8Array(f)
    }
  }

  private static getOggSampleRate(buffer: ArrayBuffer): number {
    // that’s where the 32 bit integer sits
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    return view[0]
  }

  static getOggIndex(buffer: ArrayBuffer): OggIndex {
    // console.time('indexing ogg')
    const pages: OggIndex['pages'] = []
    const headers: OggIndex['headers'] = []

    const uint8Array = new Uint8Array(buffer)
    const length = uint8Array.length
    const dataView = new DataView(buffer)
    const rate = TranscriptAudio.getOggSampleRate(buffer)
    const l = uint8Array
    for (let i = 0; i < length; i++) {
      if (
        l[i] === 79 && // "O"
        l[i + 1] === 103 && // "g"
        l[i + 2] === 103 && // "g"
        l[i + 3] === 83 // "s"
      ) {
        const byteOffset = i
        const granulePosition = readU8le(dataView, i + 6)
        if (granulePosition === null) {
          break
        } else {
          const timestamp = granulePosition / rate
          if (granulePosition === 0) {
            headers.push({ byteOffset })
          } else {
            pages.push({ byteOffset, granulePosition, timestamp })
          }
        }
      }
    }
    // console.timeEnd('indexing ogg')
    return { headers, pages }
  }

  static getOggHeaderBuffer(buffer: ArrayBuffer): ArrayBuffer|null {
    const b = new Uint8Array(buffer)
    const v = new DataView(buffer)
    const l = b.length
    let headerStart: number|null = null
    let headerEnd: number|null = null
    for (let i = 0; i < l; i++) {
      if (
        b[i] === 79 && // "O"
        b[i + 1] === 103 && // "g"
        b[i + 2] === 103 && // "g"
        b[i + 3] === 83 // "s"
      ) {
        const granulePosition = readU8le(v, i + 6)
        if (granulePosition === null) {
          headerStart = null
          break
        }
        if (granulePosition === 0 && headerStart === null) {
          headerStart = i
        } else if (granulePosition > 0 && headerEnd === null) {
          headerEnd = i
          break
        }
      }
    }
    if (headerStart !== null && headerEnd !== null) {
      return buffer.slice(headerStart, headerEnd)
    } else {
      return null
    }
  }

  static async decodeBufferByteRange(fromByte: number, toByte: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
    const headerBuffer = TranscriptAudio.getOggHeaderBuffer(buffer)
    const contentBuffer = buffer.slice(fromByte, toByte)
    const combinedBuffer = concatBuffer(headerBuffer, contentBuffer)
    const decodedBuffer = await audioContext.decodeAudioData(combinedBuffer)
    return decodedBuffer
  }

  static async decodeBufferTimeSlice(startTime: number, endTime: number, b: ArrayBuffer): Promise<AudioBuffer> {
    const adHocIndex = TranscriptAudio.getOggIndex(b).pages
    const pages = TranscriptAudio.findOggPages(startTime, endTime + 1, adHocIndex)
    const startPage = pages.startPage
    const endPage = pages.endPage
    if (startPage === null || endPage === null) {
      console.log({ startPage, endPage })
      throw new Error('Could not find all required pages')
    } else {
      const decodedBuffer = await TranscriptAudio.decodeBufferByteRange(startPage.byteOffset, endPage.byteOffset, buffer)
      // FIXME: WHY .2 SECONDS?
      const overflowStart = Math.max(0, startTime - startPage.timestamp + .2)
      const overflowEnd = Math.min(endTime - startTime + overflowStart, decodedBuffer.duration - overflowStart)
      // console.log('decoded buffer duration', decodedBuffer.duration)
      // console.log('start end', overflowStart, overflowEnd)
      try {
        const slicedBuffer = await TranscriptAudio.sliceAudioBuffer(decodedBuffer, overflowStart * 1000, overflowEnd * 1000)
        // console.log(slicedBuffer.duration, 'sliced buffer duration for', startPage.timestamp, endPage.timestamp)
        return slicedBuffer
      } catch (e) {
        console.error(e)
        return decodedBuffer
      }
    }
  }

  static sliceAudioBuffer(buffer: AudioBuffer, start: number, end: number): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      sliceAudiobuffer(buffer, start, end, (err: Error, sliced: AudioBuffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(sliced)
        }
      })
    })
  }

  static findOggPages(from: number, to: number, pages: OggIndex['pages']): { startPage: OggPage|null, endPage: OggPage|null } {
    // console.time('find pages')
    // some timestamps are just too big.
    // checking for them counts as a kind of
    // rudimentary error correction.
    const errorTimestampTooBig = Math.pow(10, 6) // 1 million seconds
    const countPages = pages.length
    let startPage: OggPage|null = null
    let endPage: OggPage|null = null
    let i = 0
    while (i < countPages) {
      if (
        startPage === null &&
        pages[i + 1] &&
        pages[i + 1].timestamp >= from &&
        pages[i + 1].timestamp < errorTimestampTooBig
      ) {
        startPage = pages[i]
      }
      if (
        endPage === null &&
        pages[i] &&
        pages[i].timestamp >= to &&
        pages[i].timestamp < errorTimestampTooBig ||
        i + 1 === countPages
      ) {
        endPage = pages[i]
        break
      }
      i++
    }
    console.timeEnd('find pages')
    console.log({ startPage, endPage })
    return { startPage, endPage }
  }

}
