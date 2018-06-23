
import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as concatBuffer from 'array-buffer-concat'
// import dummysvg from './dummysvg'
// import Worker from './waveform.worker'

// const worker = new Worker('bla')

// worker.onmessage = (event: any) => {
//   console.log('from worker', event.data.waveform)
// }

export interface OggIndex {
  pages: Array<{ byteOffset: number, granulePosition: number, timestamp: number }>
  headers: Array<{ byteOffset: number }>
}

const ctxClass: any = (window as any).AudioContext || (window as any).webkitAudioContext

// store
const audioContext: AudioContext = new ctxClass()
const uint8Buffer = new Uint8Array(0)
const oggBuffer = uint8Buffer.buffer

let oggPages   = [] as OggIndex['pages']
let oggHeaders = [] as OggIndex['headers']
let oggLength: number|null = null
let sampleRate: number|null = null

function readU4le(dataView: DataView, i: number) {
  return dataView.getUint32(i, true)
}

function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return 0x100000000 * v2 + v1
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
      console.log('page found')
      const granulePosition = readU8le(v, i + 6)
      if (granulePosition === 0 && headerStart === null) {
        headerStart = i
      } else if (granulePosition !== 0 && headerEnd === null) {
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

function getOggIndex(buffer: ArrayBuffer): OggIndex {

  console.time('indexing ogg')
  const pages: OggIndex['pages'] = []
  const headers: OggIndex['headers'] = []

  const uint8Array = new Uint8Array(buffer)
  const length = uint8Array.length
  const dataView = new DataView(buffer)
  const rate = (() => {
    if (sampleRate === null) {
      // that’s where the 32 bit integer sits
      const chunk = buffer.slice(40, 48)
      const view = new Uint32Array(chunk)
      sampleRate = view[0]
      return view[0]
    } else {
      return sampleRate
    }
  })()
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
      const timestamp = granulePosition / rate
      if (granulePosition === 0) {
        headers.push({ byteOffset })
      } else {
        pages.push({ byteOffset, granulePosition, timestamp })
      }
    }
  }
  console.timeEnd('indexing ogg')
  oggLength = (pages[pages.length - 1] || { timestamp: 0 }).timestamp
  console.log({oggLength})
  oggPages = pages
  oggHeaders = headers
  return { headers, pages }
}

function sliceBuffer(buffer: AudioBuffer, start: number, end: number): Promise<AudioBuffer> {
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

function findOggPages(from: number, to: number) {

  console.time('find pages')
  // some timestamps are just too big.
  // checking for them counts as a kind of
  // rudimentary error correction.
  const errorTimestampTooBig = Math.pow(10, 6) // 1 million seconds

  const pages = oggPages
  const countPages = pages.length
  let startPage: any = null
  let endPage: any = null
  let i = 0

  console.log({
    from, to
  })

  while (i <= countPages) {
    if (
      startPage === null &&
      pages[i + 1] &&
      pages[i + 1].timestamp > from &&
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
  return {startPage, endPage}
}

function drawWave(buffer: AudioBuffer, width: number, height: number,  color = '#ccc', channel = 0) {
  // based on drawWave.js
  console.time('draw wave')
  const svgStart = `
    <svg viewBox="0 0 ${ width } ${ height }" height="${ height }" style="display:block;">
      <path fill="${ color }" d="`
  let upperHalf = ''
  let lowerHalf = ''
  const svgEnd = '"/></svg>'
  const chanData = buffer.getChannelData(channel)
  const step = Math.ceil( chanData.length / width )
  const amp = height / 2
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
    // tslint:disable-next-line:max-line-length
    upperHalf = upperHalf + `${ i === 0 ? 'M' : 'L' } ${ i } ${ (1 + min) * amp } `
    lowerHalf = `L ${ i } ${ Math.max(1, (max - min) * amp) + ((1 + min) * amp) } ` + lowerHalf
  }
  console.timeEnd('draw wave')
  return svgStart + upperHalf + lowerHalf + 'Z' + svgEnd
}

async function decodeBufferSegment(fromByte: number, toByte: number, buffer: ArrayBuffer): Promise<AudioBuffer> {
  console.log('uint8Buffer.buffer.byteLength', uint8Buffer.buffer.byteLength)
  const headerBuffer    = getOggHeaderBuffer(buffer)
  const contentBuffer   = buffer.slice(fromByte, toByte)
  const combinedBuffer  = concatBuffer(headerBuffer, contentBuffer)
  const decodedBuffer   = await audioContext.decodeAudioData(combinedBuffer)
  return decodedBuffer
}

async function decodeBufferTimeSlice(from: number, to: number, buffer: ArrayBuffer) {
  console.time('decode buffer segment ' + from)
  // TODO: this is could possible be solved a little better.
  const { startPage, endPage } = findOggPages(from, to + 1)
  // TODO: WHY IS THERE STILL AN OFFSET OF .2?
  const overflowStart    = Math.max(0, from - startPage.timestamp + .2)
  const decodedBuffer   = await decodeBufferSegment(startPage.byteOffset, endPage.byteOffset, buffer)
  const slicedBuffer    = await sliceBuffer(decodedBuffer, overflowStart * 1000, (to - from + overflowStart) * 1000)
  console.timeEnd('decode buffer segment ' + from)
  console.log({slicedDuration: slicedBuffer.duration})
  // console.time('copy to worker ' + from)
  // const frameCount = audioContext.sampleRate * 2 * (to - from)
  // const myArrayBuffer = audioContext.createBuffer(2, frameCount, audioContext.sampleRate)
  // console.log({myArrayBuffer})
  // const anotherArray = new Float32Array(decodedBuffer.length)
  // myArrayBuffer.copyFromChannel(anotherArray, 1)
  // worker.postMessage({b: anotherArray})
  // console.timeEnd('copy to worker ' + from)
  // drawWave(decodedBuffer, 5000, 200)
  return slicedBuffer
}

const audio = {
  store : {
    uint8Buffer,
    oggBuffer,
    oggHeaders,
    oggPages,
    audioContext
  },
  getOggIndex,
  getOggHeaderBuffer,
  sliceBuffer,
  concatBuffer,
  decodeBufferSegment,
  decodeBufferTimeSlice,
  drawWave
}

export default audio
