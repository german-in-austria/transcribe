import settings from '@/store/settings.store'
import { sumChannels } from '@/util'
import * as PromiseWorker from 'promise-worker-transferable'

import GetFrequenciesWorker from '../workers/get-frequencies.worker'
import TranscriptAudio from '../classes/transcript-audio.class'
import WaveformWorker from '../workers/waveform.worker'

const textEncoder = new TextEncoder()

const [waveformWorker1, waveformWorker2] = [
  new PromiseWorker(new WaveformWorker('')),
  new PromiseWorker(new WaveformWorker(''))
]

const getFrequenciesWorker = new PromiseWorker(new GetFrequenciesWorker(''))

export async function drawSpectrogramAsync(
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

export async function drawWavePathAsync(
  buffer: AudioBuffer,
  width: number,
  height: number,
  channel = 0,
  offsetLeft = 0,
  mono = false
): Promise<string> {
  const buf = TranscriptAudio.getBufferFromAudioBuffer(buffer, channel, mono)
  // We encode the options object to a buffer, because then we can use a shared buffer,
  // and don’t have to copy any data to the other threads.
  // However, this optimization is likely to prove unnecessary in the future.
  const options = textEncoder.encode(JSON.stringify({ width, height, offsetLeft })).buffer
  let path = ''
  if (channel === 0) {
    path = await waveformWorker1.postMessage({ buffer: buf, options }, [ buf, options ])
  } else {
    path = await waveformWorker2.postMessage({ buffer: buf, options }, [ buf, options ])
  }
  // console.log('drawWavePathAsync', path)
  return path && path.length > 2 ? path : ''
}

/**
 * The synchronous version of drawWavePath. Might block the
 * UI for larger SVGs or Buffers. Use the async version if possible.
 */
export function drawWavePath(buffer: AudioBuffer, width: number, height: number, channel = 0, offsetLeft = 0) {
  /** This algo is adapted from DrawWave.js (https://github.com/meandavejustice/draw-wave)
   * The main difference is that this is _WAY_ faster (like 30 times), because it doesn’t
   * manipulate in-memory DOM Elements, but instead only concatenates a string.
  */
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

export async function drawWaveSvg(
  buffer: AudioBuffer,
  width: number,
  height: number,
  color = '#ccc',
  channel = 0,
  mono = false
) {
  return (
    `<svg viewBox="0 0 ${ width.toFixed(0) } ${ height }" height="${ height }" width="${ width.toFixed(0) }"><path fill="${ color }" d="`
    + await drawWavePathAsync(buffer, width, height, channel, 0, mono)
    + '" /></svg>'
  )
}
