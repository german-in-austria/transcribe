import settings from '@/store/settings'
import * as PromiseWorker from 'promise-worker-transferable'

import GetFrequenciesWorker from './get-frequencies.worker'
import TranscriptAudio from './transcript-audio.class'
import WaveformWorker from './waveform.worker'

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
    ? TranscriptAudio.sumChannels(buffer.getChannelData(0), buffer.getChannelData(1)).buffer
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

async function drawWaveSvg(
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
