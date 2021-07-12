import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as concatBuffer from 'array-buffer-concat'
import * as audioBufferToWav from 'audiobuffer-to-wav'
import * as util from '../util'
import * as PromiseWorker from 'promise-worker-transferable'

import settings from '../store/settings'
import GetFrequenciesWorker from './get-frequencies.worker'
import OggIndexWorker from './oggindex.worker'
import { LocalTranscriptEvent } from '../store/transcript'
import _ from 'lodash'

import WaveformWorker from './waveform.worker'

const [waveformWorker1, waveformWorker2] = [
  new PromiseWorker(new WaveformWorker('')), new PromiseWorker(new WaveformWorker(''))
]

const getFrequenciesWorker = new PromiseWorker(new GetFrequenciesWorker(''))

const oggIndexWorker = new PromiseWorker(new OggIndexWorker(''))

const textEncoder = new TextEncoder()
// import drawWaveWasm from './wasm/module.untouched.wasm'
// import getSpectrogramWasm from './wasm/module2.untouched.wasm'
// const loader = require('../lib/as-loader')

export interface AudioMetaData {
  url: string
  sampleRate: number
  headers: OggIndex['headers']
  pages: OggIndex['pages']
  bitRate: number
  fileSize: number
  headerBuffer: ArrayBuffer|null
}

export interface OggPage {
  byteOffset: number
  granulePosition: number
  timestamp: number
}

export interface OggHeader {
  byteOffset: number
}

export interface OggIndex {
  pages: OggPage[]
  headers: OggHeader[]
}

const CtxClass: any = (window as any).AudioContext || (window as any).webkitAudioContext

const audioContext: AudioContext = new CtxClass()
const localAudioElement = document.createElement('audio')
let localBufferSrc = audioContext.createBufferSource()
const uint8Buffer = new Uint8Array(0)

const isLocalFile                       = false
let   oggPages                          = [] as OggIndex['pages']
let   oggHeaders                        = [] as OggIndex['headers']
let   oggLength: number|null            = null
let   sampleRate: number|null           = null
let   metadata: AudioMetaData|null      = null
const isBufferComplete                  = false
let   oggHeaderBuffer: ArrayBuffer|null = null

function readU4le(dataView: DataView, i: number) {
  return dataView.byteLength > i + 32 ? dataView.getUint32(i, true) : null
}

export function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return v1 !== null && v2 !== null ? 0x100000000 * v2 + v1 : null
}

export function createMediaFragmentUrl(audioUrl: string, event: LocalTranscriptEvent) {
  return audioUrl
    + '#t='
    + event.startTime.toFixed(2)
    + ','
    + event.endTime.toFixed(2)
}

function getOggNominalBitrate(buffer: ArrayBuffer): number {
  // that’s where the 32 bit integer sits
  const chunk = buffer.slice(48, 52)
  const dataView = new DataView(chunk).getInt32(0, true)
  return dataView
}

function getOggHeaderBuffer(buffer: ArrayBuffer): ArrayBuffer|null {
  const b = new Uint8Array(buffer)
  const v = new DataView(buffer)
  const l = b.length
  let headerStart: number|null = null
  let headerEnd: number|null = null
  for (let i = 0; i < l; i ++) {
    if (
      b[i]     === 79 &&    // O
      b[i + 1] === 103 &&   // g
      b[i + 2] === 103 &&   // g
      b[i + 3] === 83       // s
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
        break;
      }
    }
  }
  if (headerStart !== null && headerEnd !== null) {
    return buffer.slice(headerStart, headerEnd)
  } else {
    return null
  }
}

export function getOggSampleRate(buffer: ArrayBuffer): number {
  if (sampleRate === null) {
    // that’s where the 32 bit integer sits
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    sampleRate = view[0]
    return view[0]
  } else {
    return sampleRate
  }
}

async function getOggIndexAsync(buffer: ArrayBuffer): Promise<OggIndex> {
  const m = await oggIndexWorker.postMessage({ buffer })
  oggLength = m.oggLength
  return m.oggIndex
}

function getOggIndex(buffer: ArrayBuffer): OggIndex {

  console.time('indexing ogg')
  const pages: OggIndex['pages'] = []
  const headers: OggIndex['headers'] = []

  const uint8Array = new Uint8Array(buffer)
  const length = uint8Array.length
  const dataView = new DataView(buffer)
  const rate = getOggSampleRate(buffer)
  const l = uint8Array
  for (let i = 0; i < length; i ++) {
    if (
      l[i]     === 79 &&    // O
      l[i + 1] === 103 &&   // g
      l[i + 2] === 103 &&   // g
      l[i + 3] === 83       // s
    ) {
      const byteOffset = i
      const granulePosition = readU8le(dataView, i + 6)
      if (granulePosition === null) {
        break;
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
  console.timeEnd('indexing ogg')
  oggLength = (pages[pages.length - 1] || { timestamp: 0 }).timestamp
  return { headers, pages }
}

async function cacheOggIndex(buffer: ArrayBuffer): Promise<OggIndex> {
  const {pages, headers} = await getOggIndexAsync(buffer)
  oggHeaders = headers
  oggPages = pages
  return {pages, headers}
}

function sliceAudioBuffer(buffer: AudioBuffer, start: number, end: number): Promise<AudioBuffer> {
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

function findOggPages(from: number, to: number, pages: OggIndex['pages']): {
  startPage: OggPage|null,
  endPage: OggPage|null
} {

  console.time('find pages')
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
  console.log({startPage, endPage})
  return {startPage, endPage}
}

// let spectrogramWasmModule: any

// async function drawSpectrogramWasm(buffer: AudioBuffer, width: number, height: number): Promise<HTMLCanvasElement> {
//   if (spectrogramWasmModule) {
//     const b = buffer.getChannelData(0)
//     const spectrogramBuffer = new Uint8Array(width * 512)
//     const outPtr = spectrogramWasmModule.newArray(spectrogramBuffer)
//     const inPtr = spectrogramWasmModule.newArray(b)
//     const p = spectrogramWasmModule.getFrequencies(1024, inPtr, b.length, buffer.sampleRate, width, outPtr)
//     console.log(wasmModule.getArray(Uint8Array, outPtr))
//     spectrogramWasmModule.freeArray(outPtr)
//     spectrogramWasmModule.freeArray(inPtr)
//     return document.createElement('canvas')
//   } else {
//     const module = await WebAssembly.compile(getSpectrogramWasm)
//     spectrogramWasmModule = await loader.instantiate(module, {
//       memory: new WebAssembly.Memory({
//         initial: 100
//       }),
//       env: {
//         abort: () => { throw new Error('overflow'); },
//         table: new (window as any).WebAssembly.Table({initial: 0, element: 'anyfunc'})
//       }
//     })
//     console.log(wasmModule)
//     return drawSpectrogramWasm(buffer, width, height)
//   }
// }

export function pauseCurrentBuffer() {
  localAudioElement.pause()
  URL.revokeObjectURL(localAudioElement.src)
  localBufferSrc.buffer = null
  try {
    localBufferSrc.stop()
    localBufferSrc.disconnect()
  } catch (e) {
    console.log(e)
  }
}

export function playBuffer(buffer: AudioBuffer, speed = 1, start = 0, offset?: number, duration?: number) {
  if (speed !== 1) {
    const wav = audio.audioBufferToWav(buffer)
    const blob = new Blob([new Uint8Array(wav)])
    localAudioElement.src = URL.createObjectURL(blob)
    localAudioElement.playbackRate = speed
    localAudioElement.crossOrigin = 'anonymous'
    localAudioElement.play()
    return localAudioElement
  } else {
    localBufferSrc = audioContext.createBufferSource()
    localBufferSrc.buffer = buffer
    localBufferSrc.connect(audio.store.audioContext.destination)
    localBufferSrc.start(0, offset, duration)
    return localBufferSrc
  }
}

async function drawSpectrogramAsync(
  buffer: AudioBuffer,
  width: number,
  height: number,
  channel?: number
): Promise<[HTMLCanvasElement, Uint8Array[]]> {

  const b = channel === undefined
    ? sumChannels(buffer.getChannelData(0), buffer.getChannelData(1)).buffer
    : buffer.getChannelData(channel)

  const [f, i] = await getFrequenciesWorker.postMessage({
    fftSamples: 2048,
    buffer: b,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    width,
    gradient: settings.spectrogramGradient
  }, [ b ])

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const fakeCanvas = document.createElement('canvas') as HTMLCanvasElement
  fakeCanvas.width = i.width
  fakeCanvas.height = i.height;
  (fakeCanvas.getContext('2d') as CanvasRenderingContext2D).putImageData(i, 0, 0)
  ctx.scale(1, height / i.height)
  ctx.drawImage((fakeCanvas as unknown) as CanvasImageSource, 0, 0)
  return [canvas, f]
}

export function sumChannels(first: Float32Array, second: Float32Array): Float32Array {
  const sum = new Float32Array(first.length)
  first.forEach((v: number, i: number) => {
    sum[i] = v + second[i]
  })
  return sum
}

function getBuffer(buffer: AudioBuffer, channel: number, mono: boolean) {
  if (mono === true) {
    return sumChannels(buffer.getChannelData(0), buffer.getChannelData(1)).buffer
  } else {
    console.time('channel ' + channel)
    const x = buffer.getChannelData(channel).buffer
    console.timeEnd('channel ' + channel)
    return x
  }
}

async function drawWavePathAsync(
  buffer: AudioBuffer,
  width: number,
  height: number,
  channel = 0,
  offsetLeft = 0,
  mono = false
): Promise<string> {
  const buf = getBuffer(buffer, channel, mono)
  const options = textEncoder.encode(JSON.stringify({ width, height, offsetLeft })).buffer
  if (channel === 0) {
    return await waveformWorker1.postMessage({ buffer: buf, options }, [ buf, options ])
  } else {
    return await waveformWorker2.postMessage({ buffer: buf, options }, [ buf, options ])
  }
}

// let wasmModule: any

// tslint:disable-next-line:max-line-length
// async function drawWavePathWasm(buffer: AudioBuffer, width: number, height: number, channel = 0, offsetLeft = 0): Promise<string> {
//   if (wasmModule) {
//     const b = buffer.getChannelData(channel)
//     const waveForm = new Float32Array(width * 2)
//     // let mem = new Float32Array(asmInstance.exports.memory.buffer)
//     const ptr = wasmModule.newArray(b)
//     const ptr2 = wasmModule.newArray(waveForm)
//     console.log({ptr, ptr2})
//     console.time('draw wave WASM')
//     const p = wasmModule.drawWavePath(ptr, ptr2, width, height, offsetLeft)
//     console.timeEnd('draw wave WASM')
//     console.log(wasmModule.getArray(Float32Array, ptr2))
//     wasmModule.freeArray(ptr2)
//     wasmModule.freeArray(ptr)
//     return p
//   } else {
//     const module = await WebAssembly.compile(drawWaveWasm)
//     wasmModule = await loader.instantiate(module, {
//       memory: new WebAssembly.Memory({
//         initial: 100
//       }),
//       env: {
//         abort: () => { throw new Error('overflow'); },
//         table: new (window as any).WebAssembly.Table({initial: 0, element: 'anyfunc'})
//       }
//     })
//     console.log(wasmModule)
//     return drawWavePathWasm(buffer, width, height, channel, offsetLeft)
//   }
// }

function drawWavePath(buffer: AudioBuffer, width: number, height: number, channel = 0, offsetLeft = 0) {
  // based on drawWave.js
  let upperHalf = ''
  let lowerHalf = ''
  const chanData = buffer.getChannelData(channel)
  const step = Math.ceil( chanData.length / width )
  const amp = height / 2
  console.time('draw wave')
  for (let i = 0; i < width; i++) {
    let min = 1.0
    let max = -1.0
    for (let j = 0; j < step; j++) {
      const datum = chanData[(i * step) + j]
      if (datum < min) {
        min = datum
      }
      if (datum > max) {
        max = datum
      }
    }
    upperHalf = upperHalf + `${ i === 0 ? 'M' : 'L' } ${ i + offsetLeft } ${ (1 + min) * amp } `
    lowerHalf = `L ${ i + offsetLeft } ${ Math.max(1, (max - min) * amp) + ((1 + min) * amp) } ` + lowerHalf
  }
  console.timeEnd('draw wave')
  return upperHalf + lowerHalf + 'Z'
}

async function drawWave(
  buffer: AudioBuffer,
  width: number,
  height: number,
  color = '#ccc',
  channel = 0,
  mono = false
) {
  return (
    // tslint:disable-next-line:max-line-length
    `<svg viewBox="0 0 ${ width.toFixed(0) } ${ height }" height="${ height }" width="${ width.toFixed(0) }"><path fill="${ color }" d="`
    + await drawWavePathAsync(buffer, width, height, channel, 0, mono)
    + `" /></svg>`
  )
}

// tslint:disable-next-line:max-line-length
async function decodeBufferByteRange(fromByte: number, toByte: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
  const headerBuffer = getOggHeaderBuffer(buffer)
  const contentBuffer = buffer.slice(fromByte, toByte)
  const combinedBuffer = concatBuffer(headerBuffer, contentBuffer)
  const decodedBuffer = await audioContext.decodeAudioData(combinedBuffer)
  return decodedBuffer
}

async function decodeBufferTimeSlice(from: number, to: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
  // console.time('decode buffer segment from ' + from + ' to ' + to)
  // TODO: this is could possible be solved a little better.
  let startPage
  let endPage
  if (oggPages.length === 0) {
    const adHocIndex = (await getOggIndexAsync(buffer)).pages
    const pages = findOggPages(from, to + 1, adHocIndex)
    startPage = pages.startPage
    endPage = pages.endPage
  } else {
    const pages = findOggPages(from, to + 1, oggPages)
    console.log({oggPages, from, to})
    startPage = pages.startPage
    endPage = pages.endPage
  }
  if (startPage === null || endPage === null) {
    console.log({startPage, endPage})
    throw new Error('Could not find all required pages')
  } else {
    const decodedBuffer = await decodeBufferByteRange(startPage.byteOffset, endPage.byteOffset, buffer)
    // TODO: WHY .2?
    const overflowStart = Math.max(0, from - startPage.timestamp + .2)
    const overflowEnd = Math.min(to - from + overflowStart, decodedBuffer.duration - overflowStart)
    console.log('decoded buffer duration', decodedBuffer.duration)
    console.log('start end', overflowStart, overflowEnd)
    try {
      const slicedBuffer = await sliceAudioBuffer(decodedBuffer, overflowStart * 1000, overflowEnd * 1000)
      console.log(slicedBuffer.duration, 'sliced buffer duration for', startPage.timestamp, endPage.timestamp)
      return slicedBuffer
    } catch (e) {
      console.error(e)
      return decodedBuffer
    }
  }
}

async function getOrFetchHeaderBuffer(url: string): Promise<ArrayBuffer|null> {
  const kb = 100
  if (oggHeaderBuffer === null) {
    console.log('DOWNLOADING HEADER BUFFER')
    try {
      const chunk = await fetch(url, {
        method: 'GET', credentials: 'include', headers: { Range: `bytes=0-${ kb * 1024 }`}
      })
      const bufferFirstSlice = await chunk.arrayBuffer()
      oggHeaderBuffer = audio.getOggHeaderBuffer(bufferFirstSlice)
      return oggHeaderBuffer
    } catch (e) {
      console.log(e)
      return null
    }
  } else {
    return oggHeaderBuffer
  }
}

async function getOrFetchAudioBuffer(
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
      return await audio.decodeBufferTimeSlice(from, to, audio.store.uint8Buffer.buffer)
    } catch (e) {
      console.log('could not find audio range locally, attempting download…', {from, to, audioLength}, e)
      const headerBuffer = await getOrFetchHeaderBuffer(url)
      const startByte = Math.max(fileSize * (from / audioLength) - 1024 * 1024, 0).toFixed(0)
      const endByte   = Math.min(fileSize * (to / audioLength) + 1024 * 1024, fileSize).toFixed(0)
      console.log({ startByte, endByte, from, to, fileSize, audioLength, url })
      const buffer = await (await fetch(url, {
        credentials: 'include',
        headers: { Range: `bytes=${startByte}-${endByte}` }
      })).arrayBuffer()
      const { pages } = await audio.getOggIndexAsync(buffer)
      const trimmedBuffer = buffer.slice(pages[0].byteOffset, pages[pages.length - 1].byteOffset)
      const combinedBuffer = audio.concatBuffer(headerBuffer, trimmedBuffer)
      return await audio.decodeBufferTimeSlice(from, to, combinedBuffer)
    }
  }
}

async function serverAcceptsRanges(url: string): Promise<boolean> {
  const res = (await fetch(url, {method: 'HEAD', credentials: 'include'}))
  // return res.headers.has('Accept-Ranges')
  return true
}

async function getAudioMetadata(url: string): Promise<AudioMetaData> {
  if (metadata !== null) {
    return metadata
  } else {
    const limitKb = 100
    if ((await serverAcceptsRanges(url)) === false) {
      throw new Error('server doesn’t accept ranges')
    } else {
      const chunk = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Range: `bytes=0-${ limitKb * 1024 }`}
      })
      const fileSize = (await fetch(url, {
        credentials: 'include',
        method: 'HEAD'
      })).headers.get('Content-Length')
      const bufferFirstSlice = await chunk.arrayBuffer()
      const { headers, pages } = await audio.getOggIndexAsync(bufferFirstSlice)
      metadata = {
        url,
        sampleRate: audio.getOggSampleRate(bufferFirstSlice),
        headers,
        pages,
        bitRate: audio.getOggNominalBitrate(bufferFirstSlice),
        fileSize: Number(fileSize),
        headerBuffer: audio.getOggHeaderBuffer(bufferFirstSlice)
      }
      return metadata
    }
  }
}

async function decodeAudioBufferProgressively({
  buffer,
  onProgress
}: {
  buffer: Uint8Array,
  onProgress: (chunk: AudioBuffer, from: number, to: number) => any
}
) {
  const { pages } = await audio.getOggIndexAsync(buffer.buffer)
  const chunks = _.chunk(pages, 1000)
  for (const chunk of chunks) {
    const firstPage = _.first(chunk)
    const lastPage = _.last(chunk)
    if (firstPage !== undefined && lastPage !== undefined) {
      const decoded = await audio.decodeBufferByteRange(
        firstPage.byteOffset,
        lastPage.byteOffset,
        buffer.buffer
      )
      await onProgress(decoded, firstPage.timestamp, lastPage.timestamp)
    }
  }
}

async function processAndStoreAudioDownloadChunk(
  b: Uint8Array,
  c?: (chunk: AudioBuffer, from: number, to: number) => any
) {
  const {headers, pages} = await audio.getOggIndexAsync(b.buffer)
  const buffers = await util.concatUint8ArrayAsync(audio.store.uint8Buffer, b)
  audio.store.uint8Buffer = buffers[0]
  if (headers.length > 0) {
    audio.store.oggHeaders = audio.store.oggHeaders.concat(headers)
  }
  if (pages.length > 0) {
    const firstPage = pages[0]
    const lastPage = pages[pages.length - 1]
    if (
      firstPage !== undefined &&
      lastPage !== undefined &&
      c !== undefined &&
      audio.store.uint8Buffer.byteLength > 0
    ) {
      try {
        const decoded = await audio.decodeBufferByteRange(
          audio.store.uint8Buffer.byteLength - lastPage.byteOffset,
          audio.store.uint8Buffer.byteLength,
          audio.store.uint8Buffer.buffer
        )
        await c(decoded, firstPage.timestamp, lastPage.timestamp)
      } catch (e) {
        console.log('streaming decoder error', e)
      }
    }
  }
}

async function downloadAudioStream({
  url,
  chunkSize = 2048 * 1024,
  onStart
}: {
  url: string,
  chunkSize?: number,
  onStart: (metadata: AudioMetaData|null) => any,
}) {
  return downloadAndDecodeAudioStream({url, chunkSize, onStart})
}

async function downloadAndDecodeAudioStream({
  url,
  chunkSize = 2048 * 1024,
  onStart,
  onProgress
}: {
  url: string,
  chunkSize?: number,
  onStart: (metadata: AudioMetaData|null) => any,
  onProgress?: (chunk: AudioBuffer, from: number, to: number) => any
}) {
  return new Promise(async (resolve, reject) => {
    metadata = await getAudioMetadata(url)
    fetch(url, { credentials: 'include' }).then(async (res) => {
      onStart(metadata)
      let preBuffer = new Uint8Array(0)
      if (res.body instanceof ReadableStream) {
        const reader = res.body.getReader()
        await reader
          .read()
          .then(async function process(chunk: ReadableStreamReadResult<Uint8Array>): Promise<any> {
            if (chunk.done === false) {
              if (chunk.value && chunk.value.buffer instanceof ArrayBuffer) {
                [ preBuffer ] = await util.concatUint8ArrayAsync(preBuffer, chunk.value)
                if (preBuffer.byteLength > chunkSize) {
                  await processAndStoreAudioDownloadChunk(preBuffer, onProgress)
                  preBuffer = new Uint8Array(0)
                }
              } else {
                // console.log('received non-buffer', chunk)
              }
              // recursion
              return reader.read().then(process)
            } else {
              await processAndStoreAudioDownloadChunk(preBuffer, onProgress)
              audio.store.isBufferComplete = true
              await audio.cacheOggIndex(audio.store.uint8Buffer.buffer)
              // done.
              resolve()
            }
          })
      }
    })
  })
}

const audio = {
  store : {
    audioContext,
    isBufferComplete,
    isLocalFile,
    oggHeaderBuffer,
    oggHeaders,
    oggPages,
    uint8Buffer
  },
  audioBufferToWav,
  cacheOggIndex,
  concatBuffer,
  decodeBufferByteRange,
  decodeBufferTimeSlice,
  decodeAudioBufferProgressively,
  downloadAndDecodeAudioStream,
  downloadAudioStream,
  drawSpectrogramAsync,
  drawWave,
  drawWavePath,
  drawWavePathAsync,
  getOggHeaderBuffer,
  getOggIndexAsync,
  getOggNominalBitrate,
  getOggSampleRate,
  getOrFetchAudioBuffer,
  playBuffer,
  pauseCurrentBuffer,
  sliceAudioBuffer
}

;
(window as any)._audioStore = audio.store

export default audio
