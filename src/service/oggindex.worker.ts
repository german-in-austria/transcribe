
const registerPromiseWorker = require('promise-worker-transferable/register')
import { OggIndex, OggHeader, OggPage } from './audio'

let sampleRate: number|null = null

function readU4le(dataView: DataView, i: number) {
  return dataView.byteLength > i + 32 ? dataView.getUint32(i, true) : null
}

export function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return v1 !== null && v2 !== null ? 0x100000000 * v2 + v1 : null
}

export function getOggSampleRate(buffer: ArrayBuffer): number {
  if (sampleRate !== null) {
    return sampleRate
  } else {
    // that’s where the 32 bit integer sits
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    sampleRate = view[0]
    return view[0]
  }
}

// Post data to parent thread
registerPromiseWorker((message: { buffer: ArrayBuffer }): {oggLength: number, oggIndex: OggIndex} => {
  const pages: OggPage[] = []
  const headers: OggHeader[] = []

  const uint8Array = new Uint8Array(message.buffer)
  const length = uint8Array.length
  const dataView = new DataView(message.buffer)
  const rate = getOggSampleRate(message.buffer)
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
  const oggLength = (pages[pages.length - 1] || { timestamp: 0 }).timestamp
  return {oggIndex: { headers, pages }, oggLength}
})
export default null as any
