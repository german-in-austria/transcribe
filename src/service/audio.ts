
import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as concatBuffer from 'array-buffer-concat'
import * as audioBufferToWav from 'audiobuffer-to-wav'

import util from './util'
import settings from '../store/settings'
import * as PromiseWorker from 'promise-worker'
import * as PromiseWorkerTransferable from 'promise-worker-transferable'
import WaveformWorker from './waveform.worker'
const waveformWorker = new PromiseWorkerTransferable(new WaveformWorker(''))
// import MultiWorker from '../lib/worker-loader'
// const waveformWorkerPar = new MultiWorker(new WaveformWorker(''))
import GetFrequenciesWorker from './get-frequencies.worker'
const getFrequenciesWorker = new PromiseWorker(new GetFrequenciesWorker(''))
import OggIndexWorker from './oggindex.worker'
const oggIndexWorker = new PromiseWorker(new OggIndexWorker(''))
// import drawWaveWasm from './wasm/module.untouched.wasm'
// import getSpectogramWasm from './wasm/module2.untouched.wasm'
// const loader = require('../lib/as-loader')

export interface OggIndex {
  pages: Array<{ byteOffset: number, granulePosition: number, timestamp: number }>
  headers: Array<{ byteOffset: number }>
}

const ctxClass: any = (window as any).AudioContext || (window as any).webkitAudioContext

// store
const audioContext: AudioContext = new ctxClass()
const uint8Buffer = new Uint8Array(0)
// const oggBuffer = uint8Buffer.buffer

const isLocalFile             = false
let   oggPages                = [] as OggIndex['pages']
let   oggHeaders              = [] as OggIndex['headers']
let   oggLength: number|null  = null
let   sampleRate: number|null = null
const isBufferComplete        = false
let   oggHeaderBuffer: ArrayBuffer|null = null

function readU4le(dataView: DataView, i: number) {
  return dataView.byteLength > i + 32 ? dataView.getUint32(i, true) : null
}

export function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return v1 !== null && v2 !== null ? 0x100000000 * v2 + v1 : null
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
  console.log(m)
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

async function cacheOggIndex(buffer: ArrayBuffer) {
  const {pages, headers} = await getOggIndexAsync(buffer)
  oggHeaders = headers
  oggPages = pages
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

function findOggPages(from: number, to: number, pages: OggIndex['pages']) {

  console.time('find pages')
  // some timestamps are just too big.
  // checking for them counts as a kind of
  // rudimentary error correction.
  const errorTimestampTooBig = Math.pow(10, 6) // 1 million seconds

  const countPages = pages.length
  let startPage: any = null
  let endPage: any = null
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
      i === countPages
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

// let spectogramWasmModule: any

// async function drawSpectogramWasm(buffer: AudioBuffer, width: number, height: number): Promise<HTMLCanvasElement> {
//   if (spectogramWasmModule) {
//     const b = buffer.getChannelData(0)
//     const spectogramBuffer = new Uint8Array(width * 512)
//     const outPtr = spectogramWasmModule.newArray(spectogramBuffer)
//     const inPtr = spectogramWasmModule.newArray(b)
//     const p = spectogramWasmModule.getFrequencies(1024, inPtr, b.length, buffer.sampleRate, width, outPtr)
//     console.log(wasmModule.getArray(Uint8Array, outPtr))
//     spectogramWasmModule.freeArray(outPtr)
//     spectogramWasmModule.freeArray(inPtr)
//     return document.createElement('canvas')
//   } else {
//     const module = await WebAssembly.compile(getSpectogramWasm)
//     spectogramWasmModule = await loader.instantiate(module, {
//       memory: new WebAssembly.Memory({
//         initial: 100
//       }),
//       env: {
//         abort: () => { throw new Error('overflow'); },
//         table: new (window as any).WebAssembly.Table({initial: 0, element: 'anyfunc'})
//       }
//     })
//     console.log(wasmModule)
//     return drawSpectogramWasm(buffer, width, height)
//   }
// }

async function drawSpectogramAsync(buffer: AudioBuffer, width: number, height: number): Promise<HTMLCanvasElement> {
  const b = sumChannels(buffer.getChannelData(0), buffer.getChannelData(1)).buffer
  const [f, i] = await getFrequenciesWorker.postMessage({
    fftSamples: 1024,
    buffer: b,
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    width,
    gradient: settings.spectogramGradient
  }, [ b ])

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const fakeCanvas = document.createElement('canvas')
  fakeCanvas.width = i.width
  fakeCanvas.height = i.height;
  (fakeCanvas.getContext('2d') as CanvasRenderingContext2D).putImageData(i, 0, 0)
  // ctx.scale(1, height / (i as ImageData).height)
  ctx.scale(1, height / i.height)
  ctx.drawImage(fakeCanvas, 0, 0)
  console.log(f.length)
  console.log(f[0].length)
  return canvas
}

function sumChannels(first: Float32Array, second: Float32Array): Float32Array {
  const sum = new Float32Array(first.length)
  first.forEach((v: number, i: number) => {
    sum[i] = v + second[i]
  })
  return sum
}

async function drawWavePathAsync(
  buffer: AudioBuffer,
  width: number,
  height: number,
  channel = 0,
  offsetLeft = 0,
  mono = false
): Promise<string> {
  const b = (() => {
    if (mono === true) {
      return sumChannels(
        buffer.getChannelData(0),
        buffer.getChannelData(1)
      ).buffer
    } else {
      return buffer.getChannelData(channel).buffer
    }
  })()
  return await waveformWorker.postMessage([
    b,
    JSON.stringify({
      width,
      height,
      offsetLeft
    })
  ], [ b ])
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
  // tslint:disable-next-line:max-line-length
  const svgStart = `<svg viewBox="0 0 ${ width.toFixed(0) } ${ height }" height="${ height }" width="${ width.toFixed(0) }"><path fill="${ color }" d="`
  const svgEnd = '" /></svg>'
  return svgStart + await drawWavePathAsync(buffer, width, height, channel, 0, mono) + svgEnd
}

// tslint:disable-next-line:max-line-length
async function decodeBufferSegment(fromByte: number, toByte: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
  const headerBuffer    = getOggHeaderBuffer(buffer)
  const contentBuffer   = buffer.slice(fromByte, toByte)
  const combinedBuffer  = concatBuffer(headerBuffer, contentBuffer)
  const decodedBuffer   = await audioContext.decodeAudioData(combinedBuffer)
  return decodedBuffer
}

async function decodeBufferTimeSlice(from: number, to: number, buffer: ArrayBuffer) {
  console.time('decode buffer segment from ' + from + ' to ' + to)
  // TODO: this is could possible be solved a little better.
  let startPage
  let endPage
  if (oggPages.length === 0) {
    const adHocIndex = (await getOggIndexAsync(buffer)).pages
    console.log({ adHocIndex })
    const pages = findOggPages(from, to + 1, adHocIndex)
    startPage = pages.startPage
    endPage = pages.endPage
  } else {
    console.log({oggPages})
    const pages = findOggPages(from, to + 1, oggPages)
    startPage = pages.startPage
    endPage = pages.endPage
  }
  // TODO: WHY IS THERE STILL AN OFFSET OF .2?
  const overflowStart = Math.max(0, from - startPage.timestamp + .2)
  console.log({
    pageDuration: endPage.timestamp - startPage.timestamp,
    start: overflowStart,
    end: to - from + overflowStart,
    duration: to - from
  })
  console.log('bytes', endPage.byteOffset - startPage.byteOffset)
  const decodedBuffer = await decodeBufferSegment(startPage.byteOffset, endPage.byteOffset, buffer)
  console.log('decoded buffer duration', decodedBuffer.duration)
  // tslint:disable-next-line:max-line-length
  console.log('start end', overflowStart * 1000, (to - from + overflowStart) * 1000)
  const slicedBuffer = await sliceAudioBuffer(decodedBuffer, overflowStart * 1000, (to - from + overflowStart) * 1000)
  console.timeEnd('decode buffer segment from ' + from + ' to ' + to)
  console.log({slicedDuration: slicedBuffer.duration})
  return slicedBuffer
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
  try {
    return await audio.decodeBufferTimeSlice(from, to, audio.store.uint8Buffer.buffer)
  } catch (e) {
    console.log(e)
    const headerBuffer = await getOrFetchHeaderBuffer(url)
    const startByte = Math.max(fileSize * (from / audioLength) - 1024 * 1024, 0).toFixed(0)
    const endByte   = Math.min(fileSize * (to / audioLength) + 1024 * 1024, fileSize).toFixed(0)
    console.log('DOWNLOADING AUDIO SEGMENT', {startByte, endByte}, (Number(endByte) - Number(startByte)) / 1024, 'MB')
    console.time('buffer segment download')
    const buffer = await (await fetch(url, {
      credentials: 'include',
      headers: { Range: `bytes=${startByte}-${endByte}` }
    })).arrayBuffer()
    console.timeEnd('buffer segment download')
    const { pages } = await audio.getOggIndexAsync(buffer)
    const trimmedBuffer = buffer.slice(pages[0].byteOffset, pages[pages.length - 1].byteOffset)
    console.log({ headerBuffer, trimmedBuffer })
    const combinedBuffer = audio.concatBuffer(headerBuffer, trimmedBuffer)
    return await audio.decodeBufferTimeSlice(from, to, combinedBuffer)
  }
}

async function serverAcceptsRanges(url: string): Promise<boolean> {
  const res = (await fetch(url, {method: 'HEAD', mode: 'cors', credentials: 'include'}))
  // return res.headers.has('Accept-Ranges')
  return true
}

async function getAudioMetadata(url: string): Promise<any> {
  const kb = 100
  if ((await serverAcceptsRanges(url)) === false) {
    throw new Error('server doesn’t accept ranges')
  } else {
    const chunk = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Range: `bytes=0-${ kb * 1024 }`}
    })
    const fileSize = (await fetch(url, {
      credentials: 'include',
      method: 'HEAD'
    })).headers.get('Content-Length')
    const bufferFirstSlice   = await chunk.arrayBuffer()
    const sr                 = audio.getOggSampleRate(bufferFirstSlice)
    const bitRate            = audio.getOggNominalBitrate(bufferFirstSlice)
    const headerBuffer       = audio.getOggHeaderBuffer(bufferFirstSlice)
    const { headers, pages } = await audio.getOggIndexAsync(bufferFirstSlice)
    return {
      sampleRate: sr,
      headers,
      pages,
      fileSize: Number(fileSize),
      headerBuffer,
    }
  }
}

async function downloadAudioStream({
    url,
    onStart,
    onProgress
  }: {
    url: string,
    onStart: (metadata: any) => any,
    onProgress: (chunk: AudioBuffer, from: number, to: number) => any
  }
) {
  const metadata = await getAudioMetadata(url)
  const x = await fetch(url, { credentials: 'include' }).then((res) => {
    onStart(metadata)
    let preBuffer = new Uint8Array(0)
    if (res.body instanceof ReadableStream) {
      const reader = res.body.getReader()
      console.log('total length in bytes', res.headers.get('Content-Length'))
      reader.read().then(async function process(chunk: {value: Uint8Array, done: boolean}): Promise<any> {
        if (chunk.value && chunk.value.buffer instanceof ArrayBuffer) {
          [ preBuffer ] = await util.concatUint8ArrayAsync(preBuffer, chunk.value)
          if (preBuffer.byteLength > 2048 * 1024) {
            const {headers, pages} = await audio.getOggIndexAsync(preBuffer.buffer)
            const buffers = await util.concatUint8ArrayAsync(audio.store.uint8Buffer, preBuffer)
            audio.store.uint8Buffer = buffers[0]
            preBuffer = new Uint8Array(0)
            // reset buffer
            // console.log(audio.store.uint8Buffer.byteLength, 'bytes loaded')
            // store headers
            if (headers.length > 0) {
              audio.store.oggHeaders = audio.store.oggHeaders.concat(headers)
            }
            if (pages.length > 0) {
              const firstPage = pages[0]
              const lastPage = pages[pages.length - 1]
              if (firstPage && lastPage && audio.store.uint8Buffer.byteLength > 0) {
                const decoded = await audio.decodeBufferSegment(
                  audio.store.uint8Buffer.byteLength - lastPage.byteOffset,
                  audio.store.uint8Buffer.byteLength,
                  audio.store.uint8Buffer.buffer
                )
                onProgress(decoded, firstPage.timestamp, lastPage.timestamp)
              }
            }
          }
        } else {
          console.log('received non-buffer', chunk)
        }
        if (chunk.done === false) {
          return reader.read().then(process)
        } else {
          console.log('DONE.')
          audio.store.isBufferComplete = true
          audio.cacheOggIndex(audio.store.uint8Buffer.buffer)
        }
      })
    }
    return res
  })
}

const audio = {
  store : {
    uint8Buffer,
    isLocalFile,
    oggHeaderBuffer,
    oggHeaders,
    oggPages,
    audioContext,
    isBufferComplete
  },
  cacheOggIndex,
  getOrFetchAudioBuffer,
  getOggSampleRate,
  getOggNominalBitrate,
  audioBufferToWav,
  // getOggIndex,
  getOggIndexAsync,
  getOggHeaderBuffer,
  sliceAudioBuffer,
  concatBuffer,
  decodeBufferSegment,
  decodeBufferTimeSlice,
  drawWave,
  drawWavePath,
  drawWavePathAsync,
  // drawSpectogram,
  downloadAudioStream,
  drawSpectogramAsync,
  // drawSpectogramWasm
}

;
(window as any)._audio = audio

export default audio
