import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as concatBuffer from 'array-buffer-concat'
import * as audioBufferToWav from 'audiobuffer-to-wav'
import * as util from '../util'
import * as PromiseWorker from 'promise-worker-transferable'

import settings from '../store/settings'
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
const uint8Buffer = new Uint8Array(0)

async function cacheOggIndex(buffer: ArrayBuffer): Promise<OggIndex> {
  const {pages, headers} = await getOggIndexAsync(buffer)
  oggHeaders = headers
  oggPages = pages
  return {pages, headers}
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

// tslint:disable-next-line:max-line-length

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
    isLocalFile, // public
    oggHeaderBuffer,
    oggHeaders,
    oggPages,
    uint8Buffer // public
  },
  audioBufferToWav, // public
  cacheOggIndex,
  concatBuffer,
  decodeBufferByteRange,
  decodeBufferTimeSlice, // public
  decodeAudioBufferProgressively, // public
  downloadAndDecodeAudioStream, // public
  downloadAudioStream, // public
  drawWavePathAsync, // public
  getOggHeaderBuffer,
  getOggIndexAsync,
  getOggNominalBitrate,
  getOggSampleRate,
  getOrFetchAudioBuffer, // public
  playBuffer, // public
  pauseCurrentBuffer, // public
  sliceAudioBuffer
}

;
(window as any)._audioStore = audio.store

export default audio
