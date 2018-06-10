
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
const oggBuffer  = null as ArrayBuffer|null
let oggPages   = [] as OggIndex['pages']
let oggHeaders = [] as OggIndex['headers']

function readU4le(dataView: DataView, i: number) {
  return dataView.getUint32(i, true)
}

function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return 0x100000000 * v2 + v1
}

function getOggIndex(buffer: ArrayBuffer): OggIndex {

  console.time('indexing ogg')
  const pages: OggIndex['pages'] = []
  const headers: OggIndex['headers'] = []

  const uint8Array = new Uint8Array(buffer)
  const length = uint8Array.length
  const dataView = new DataView(buffer)
  const sampleRate = (() => {
    // that’s where the 32 bit integer sits
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    return view[0]
  })()
  const l = uint8Array
  for (let i = 0; i < length; i ++) {
    if (
      l[i]     === 79 &&
      l[1 + 1] === 103 &&
      l[i + 2] === 103 &&
      l[i + 3] === 83
    ) {
      const byteOffset = i
      const granulePosition = readU8le(dataView, i + 6)
      const timestamp = granulePosition / sampleRate
      if (granulePosition === 0) {
        headers.push({ byteOffset })
      } else {
        pages.push({ byteOffset, granulePosition, timestamp })
      }
    }
  }
  // uint8Array.forEach((v, i, l) => {
  // })
  console.timeEnd('indexing ogg')
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

function drawWave(buffer: AudioBuffer, width: number, height: number) {
  // based on drawwave.js
  console.time('draw wave')
  const svgStart = `
    <svg viewBox="0 0 ${ width } ${ height }" width="${width}" height="${height}" style="display:block;">
      <path fill="#fff" d="`
  let upperHalf = ''
  let lowerHalf = ''
  const svgEnd = '"/></svg>'
  const chanData = buffer.getChannelData(0)
  console.log('chanData.length', chanData.length)
  console.log('width', width)
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

async function decodeBufferSegment(from: number, to: number) {
  if (audio.store.oggBuffer !== null) {
    console.time('decode buffer segment ' + from)
    const { startPage, endPage } = findOggPages(from, to)
    const headerBuffer   = audio.store.oggBuffer.slice(oggHeaders[0].byteOffset, oggPages[0].byteOffset)
    const contentBuffer  = audio.store.oggBuffer.slice(startPage.byteOffset, endPage.byteOffset)
    const combinedBuffer = audio.concatBuffer(headerBuffer, contentBuffer)
    const decodedBuffer  = await audioContext.decodeAudioData(combinedBuffer)
    console.timeEnd('decode buffer segment ' + from)
    // console.time('copy to worker ' + from)
    // const frameCount = audioContext.sampleRate * 2 * (to - from)
    // const myArrayBuffer = audioContext.createBuffer(2, frameCount, audioContext.sampleRate)
    // console.log({myArrayBuffer})
    // const anotherArray = new Float32Array(decodedBuffer.length)
    // myArrayBuffer.copyFromChannel(anotherArray, 1)
    // worker.postMessage({b: anotherArray})
    // console.timeEnd('copy to worker ' + from)
    // drawWave(decodedBuffer, 5000, 200)
    return decodedBuffer
  }
}

const audio = {
  store : {
    oggBuffer,
    oggHeaders,
    oggPages,
    audioContext
  },
  getOggIndex,
  sliceBuffer,
  concatBuffer,
  decodeBufferSegment,
  drawWave
}

export default audio
