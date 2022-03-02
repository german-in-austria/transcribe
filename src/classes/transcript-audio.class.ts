// Libraries
import audioBufferToWav from 'audiobuffer-to-wav'
import _ from 'lodash'
import { saveAs } from 'file-saver'
import concatBuffer from 'array-buffer-concat'
import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as PromiseWorker from 'promise-worker-transferable'

import { concatUint8ArrayAsync, isUrl, readU8le, sumChannels } from '@/util'
import { AudioMetaData, OggHeader, OggIndex, OggPage } from '@/types/audio'
import { AudioFileOrUrl } from './transcript.class'
import OggIndexWorker from '@/workers/oggindex.worker'
import { TranscriptEvent } from '@/types/transcript'
import EventService from './event.class'
import settings from '@/store/settings.store'
import bus from '@/service/bus'
const oggIndexWorker = new PromiseWorker(new OggIndexWorker(''))

// account for browser api differences
const CtxClass: any = window.AudioContext || window.webkitAudioContext
const audioContext: AudioContext = new CtxClass()
let bufferSrc = audioContext.createBufferSource()

/**
 * This is a Helper because ReadableStreamDefaultReadResult<Uint8Array>
 * is not available in all TS versions, and subject to change by the standards body.
 */
interface DownloadChunk {
  value?: Uint8Array
  done: boolean
}

export default class TranscriptAudio {
  constructor(a: AudioFileOrUrl, overviewWaveformSvg?: string) {
    if (a instanceof File || a instanceof ArrayBuffer) {
      this.initWithLocalAudio(a)
    } else if (isUrl(a)) {
      this.initWithRemoteAudio(a)
    }
  }

  private audioElement = document.createElement('audio')
  private oggHeaders: OggHeader[] = []
  private oggHeaderBuffer: ArrayBuffer|null = null
  duration = 0 // seconds
  fileSize = 0 // bytes
  currentTime = 0 // seconds
  isPaused: boolean = true
  onChunkAvailable: null|((startTime: number, endTime: number, audioBuffer: AudioBuffer) => any) = null
  buffer = new Uint8Array(0)
  playAllFromTime: number|null = null
  url = ''

  private async initWithLocalAudio(a: File|ArrayBuffer) {
    await this.convertAndLoadUint8(a)
    this.audioElement.src = URL.createObjectURL(new Blob([ this.buffer ]))
    this.url = this.audioElement.src
    this.fileSize = this.buffer.byteLength
    this.audioElement.addEventListener('durationchange', () => {
      this.duration = this.audioElement.duration
    })
    this.decodeBufferProgressively(this.buffer)
  }

  private async initWithRemoteAudio(a: string) {
    this.url = a
    this.downloadAndDecodeBufferProgressively(a, 2048 * 1024)
  }

  public pause() {
    this.audioElement.pause()
    this.playAllFromTime = null
    bus.$emit('pauseAudio', this.currentTime)
    this.pauseCurrentBuffer()
    this.isPaused = true
  }

  private pauseCurrentBuffer() {
    this.audioElement.pause()
    URL.revokeObjectURL(this.audioElement.src)
    bufferSrc.buffer = null
    try {
      bufferSrc.stop()
      bufferSrc.disconnect()
    } catch (e) {
      // console.log(e)
    }
  }

  public playAllFrom(t: number) {
    if (this.isPaused === false) {
      this.pause()
    }
    this.playAllFromTime = t
    this.audioElement.currentTime = t
    this.audioElement.play().then(() => {
      this.isPaused = false
      bus.$emit('playAudio', t)
      this.emitUpdateTimeUntilPaused(
        this.audioElement.currentTime,
        settings.lockScroll && settings.lockPlayHead,
        this.duration,
        true
      )
    })
  }

  /** Plays a list of events */
  public playEvents(events: TranscriptEvent[]) {
    this.pause()
    const sortedEvents = EventService.sortEvents(events)
    const lastEvent = _(sortedEvents).last() as TranscriptEvent
    const firstEvent = _(sortedEvents).first() as TranscriptEvent
    const start = this.currentTime > firstEvent.startTime && this.currentTime < lastEvent.endTime
      ? this.currentTime
      : firstEvent.startTime
    this.playRange(start, lastEvent.endTime)
  }

  /** Plays one event */
  public playEvent(e: TranscriptEvent) {
    this.playEvents([ e ])
  }

  public async playRange(start: number, end: number) {
    if (this.buffer.byteLength === 0) {
      console.log('can’t play, no buffer loaded')
    } else {
      const [ left, right ] = [ start, end ].sort((a, b) => a - b)
      const buffer = await TranscriptAudio.decodeBufferTimeSlice(left, right, this.buffer.buffer)
      if (buffer !== undefined) {
        requestAnimationFrame(() => {
          this.isPaused = false
          this
            .playBuffer(buffer, settings.playbackSpeed)
            .addEventListener('ended', () => this.pause)
          this.emitUpdateTimeUntilPaused(left, false, right, false)
        })
      }
    }
  }

  /** Set audio volume. Between 0 and 1 */
  public setVolume(v: number) {
    this.audioElement.volume = v
  }

  /** Set playback speed. Pitch Corrected.
   * Advisable to keep between .25 and 4.0
   * (see also https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate) */
  public setPlaybackSpeed(v: number) {
    this.audioElement.playbackRate = v
  }

  private emitUpdateTimeUntilPaused(t: number, lockScroll: boolean, maxT: number, useAudioElement: boolean) {
    const startTime = performance.now()
    this.currentTime = t
    bus.$emit('updateTime', t)
    let currentlyPlayingEventId: number|null = null
    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000 * settings.playbackSpeed
      // more than 16 ms have passed
      if (useAudioElement === true) {
        this.currentTime = this.audioElement.currentTime
        bus.$emit('updateTime', this.currentTime)
      } else {
        if (t + elapsed - this.currentTime >= .016) {
          // update and emit.
          this.currentTime = t + elapsed
          bus.$emit('updateTime', this.currentTime)
        }
      }
      // paused or over max t.
      if (
        (maxT !== undefined && this.currentTime >= maxT) ||
        this.isPaused === true
      ) {
        // stop emitting.
        this.isPaused = true
        return false
      } else {
        // sync scroll if locked.
        // TODO: move elsewhere.
        // FIXME:
        if (lockScroll) {
          // const e = findEventAt(this.currentTime)
          // if (e !== undefined && e.eventId !== currentlyPlayingEventId) {
          //   currentlyPlayingEventId = e.eventId
          //   scrollToTranscriptEvent(e)
          // }
        }
        // continue emitting
        return requestAnimationFrame(step)
      }
    }
    return step(performance.now())
  }

  public static getBufferFromAudioBuffer(
    buffer: AudioBuffer,
    channel: number,
    mono: boolean) {
    if (mono === true) {
      return sumChannels(buffer.getChannelData(0), buffer.getChannelData(1)).buffer
    } else {
      // console.time('extracting buffer from channel ' + channel)
      const x = buffer.getChannelData(channel).buffer
      // console.timeEnd('extracting buffer from channel ' + channel)
      return x
    }
  }

  public playEventsStart(events: TranscriptEvent[], duration: number) {
    const sortedEvents = EventService.sortEvents(events)
    const firstEvent = sortedEvents[0]
    const [ start, end ] = [ firstEvent.startTime, Math.min(firstEvent.startTime + duration, firstEvent.endTime) ]
    this.playRange(start, end)
  }

  public playEventsEnd(events: TranscriptEvent[], duration: number) {
    const sortedEvents = EventService.sortEvents(events)
    const lastEvent = _.last(sortedEvents) as TranscriptEvent
    const [ start, end ] = [ Math.max(lastEvent.endTime - duration, lastEvent.startTime), lastEvent.endTime ]
    this.playRange(start, end)
  }

  public scrubAudio(t: number) {
    this.currentTime = t
    bus.$emit('scrubAudio', t)
  }

  public playBuffer(buffer: AudioBuffer, speed = 1, start = 0, offset?: number, duration?: number) {
    if (speed !== 1) {
      const wav = audioBufferToWav(buffer)
      const blob = new Blob([ new Uint8Array(wav) ])
      this.audioElement.src = URL.createObjectURL(blob)
      this.audioElement.playbackRate = speed
      this.audioElement.crossOrigin = 'anonymous'
      this.audioElement.play()
      return this.audioElement
    } else {
      bufferSrc = audioContext.createBufferSource()
      bufferSrc.buffer = buffer
      bufferSrc.connect(audioContext.destination)
      bufferSrc.start(0, offset, duration)
      return bufferSrc
    }
  }

  /** Creates a URL for an audio file that jumps directly to a given time code,
   * like https://server.com/audio.ogg#t=12.20,13.51
   */
  public static createMediaFragmentUrl(audioUrl: string, event: TranscriptEvent) {
    return audioUrl
      + '#t='
      + event.startTime.toFixed(2)
      + ','
      + event.endTime.toFixed(2)
  }

  private async getOrFetchHeaderBuffer(url: string): Promise<ArrayBuffer|null> {
    const kb = 100
    if (this.oggHeaderBuffer === null) {
      console.log('DOWNLOADING HEADER BUFFER')
      try {
        const chunk = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Range: `bytes=0-${ kb * 1024 }`
          }
        })
        const bufferFirstSlice = await chunk.arrayBuffer()
        return TranscriptAudio.getOggHeaderBuffer(bufferFirstSlice)
      } catch (e) {
        console.log(e)
        return null
      }
    } else {
      return this.oggHeaderBuffer
    }
  }

  public async getOrFetchAudioBuffer(
    from: number,
    to: number,
    fileSize: number,
    audioLength: number,
    url: string
  ): Promise<AudioBuffer> {
    if (from > to || audioLength < to) {
      throw new Error('range is not in audio file')
    } else {
      try {
        return await TranscriptAudio.decodeBufferTimeSlice(from, to, this.buffer.buffer)
      } catch (e) {
        console.log('could not find audio range locally, attempting download…', { from, to, audioLength }, e)
        const headerBuffer = await this.getOrFetchHeaderBuffer(url)
        const startByte = Math.max(fileSize * (from / audioLength) - 1024 * 1024, 0).toFixed(0)
        const endByte = Math.min(fileSize * (to / audioLength) + 1024 * 1024, fileSize).toFixed(0)
        // console.log({ startByte, endByte, from, to, fileSize, audioLength, url })
        const buffer = await (await fetch(url, {
          credentials: 'include',
          headers: { Range: `bytes=${startByte}-${endByte}` }
        })).arrayBuffer()
        const { pages } = await TranscriptAudio.getOggIndexAsync(buffer)
        const trimmedBuffer = buffer.slice(pages[0].byteOffset, pages[pages.length - 1].byteOffset)
        const combinedBuffer = concatBuffer(headerBuffer, trimmedBuffer)
        return await TranscriptAudio.decodeBufferTimeSlice(from, to, combinedBuffer)
      }
    }
  }

  private async downloadAndDecodeBufferProgressively(url: string, chunkSize: number) {
    this.fileSize = await this.getRemoteFileSize(url)
    this.audioElement.addEventListener('durationchange', () => {
      this.duration = this.audioElement.duration
    })
    this.audioElement.src = url
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
            .then(async function process(chunk: DownloadChunk): Promise<any> {
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

  private async getRemoteFileSize(url: string): Promise<number> {
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

  /** Finds the time range for the given events, converts
   * them to a WAV buffer and triggers the download.
   * Appends a ".wav" extension to the given file name */
  public async exportEventAudio(
    events: TranscriptEvent[],
    fileName: string
  ) {
    const sortedEvents = EventService.sortEvents(events)
    const [firstEvent, lastEvent] = [_(sortedEvents).first(), _(sortedEvents).last()]
    // console.log({ firstEvent, lastEvent })
    if (firstEvent !== undefined && lastEvent !== undefined) {
      const buffer = await TranscriptAudio.decodeBufferTimeSlice(
        firstEvent.startTime,
        lastEvent.endTime,
        this.buffer.buffer
      )
      const wav = audioBufferToWav(buffer)
      const blob = new Blob([new Uint8Array(wav)])
      saveAs(blob, fileName + '.wav')
    }
  }

  private static async doesServerAcceptRanges(url: string): Promise<boolean> {
    const res = (await fetch(url, { method: 'HEAD', credentials: 'include' }))
    // FIXME: this is often a problem with CORS requests.
    // for now we return true, and continue the Operation
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
    const chunks = _.chunk(pages, 250)
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

  private static async getOggIndexAsync(buffer: ArrayBuffer): Promise<OggIndex> {
    const m = await oggIndexWorker.postMessage({ buffer })
    return m.oggIndex
  }

  private async convertAndLoadUint8(f: File|ArrayBuffer) {
    if (f instanceof File) {
      this.buffer = new Uint8Array(await f.arrayBuffer())
    } else {
      this.buffer = new Uint8Array(f)
    }
  }

  private static getOggSampleRate(buffer: ArrayBuffer): number {
    // this is where the 32 bit integer sits.
    // see the ogg/vorbis spec for more info.
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    return view[0]
  }

  private static getOggNominalBitrate(buffer: ArrayBuffer): number {
    const chunk = buffer.slice(48, 52)
    const dataView = new DataView(chunk).getInt32(0, true)
    return dataView
  }

  private static getOggIndex(buffer: ArrayBuffer): OggIndex {
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

  private static getOggHeaderBuffer(buffer: ArrayBuffer): ArrayBuffer|null {
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

  private static async decodeBufferByteRange(fromByte: number, toByte: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
    const headerBuffer = TranscriptAudio.getOggHeaderBuffer(buffer)
    const contentBuffer = buffer.slice(fromByte, toByte)
    const combinedBuffer = concatBuffer(headerBuffer, contentBuffer)
    const decodedBuffer = await audioContext.decodeAudioData(combinedBuffer)
    return decodedBuffer
  }

  public static async decodeBufferTimeSlice(startTime: number, endTime: number, b: ArrayBuffer): Promise<AudioBuffer> {
    const adHocIndex = TranscriptAudio.getOggIndex(b).pages
    const pages = TranscriptAudio.findOggPages(startTime, endTime + 1, adHocIndex)
    const startPage = pages.startPage
    const endPage = pages.endPage
    if (startPage === null || endPage === null) {
      // console.log({ startPage, endPage })
      throw new Error('Could not find all required pages')
    } else {
      const decodedBuffer = await TranscriptAudio.decodeBufferByteRange(startPage.byteOffset, endPage.byteOffset, b)
      // FIXME: WHY .2 SECONDS?
      const overflowStart = Math.max(0, startTime - startPage.timestamp + .2)
      const overflowEnd = Math.min(endTime - startTime + overflowStart, decodedBuffer.duration - overflowStart)
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

  private static sliceAudioBuffer(buffer: AudioBuffer, start: number, end: number): Promise<AudioBuffer> {
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

  /** finds the first and last Ogg-Page for a given time range. */
  private static findOggPages(from: number, to: number, pages: OggIndex['pages']): { startPage: OggPage|null, endPage: OggPage|null } {
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
    // console.timeEnd('find pages')
    // console.log({ startPage, endPage })
    return { startPage, endPage }
  }
}
