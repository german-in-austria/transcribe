// WASM

import 'allocator/arena';

export { memory };

const E: f32 = <f32>2.718281828459045

// import { heatMap } from '../heat-map'

// tslint:disable:no-bitwise
// const heatMapRgb = <string[]>heatMap.map((hex: string): i8[] => {
//   const bigint = parseInt(hex, 16)
//   return [
//     (bigint >> 16) & 255,
//     (bigint >> 8) & 255,
//     bigint & 255
//   ]
// })

// interface FFT {
//   bufferSize: number
//   sampleRate: number
//   sinTable: f32
//   cosTable: Float32Array
//   windowValues: Float32Array
//   reverseTable: Uint32Array
//   peakBand: number
//   peak: number
//   calculateSpectrum(buffer: Float32Array): Float32Array
// }

class FFT {
  bufferSize: i32
  sampleRate: i32
  sinTable: f32[]
  cosTable: f32[]
  windowValues: f32[]
  reverseTable: i32[]
  peakBand: i32
  peak: f32

  constructor(bufferSize: i32, sampleRate: i32, alpha: f32) {
    this.bufferSize = bufferSize
    this.sampleRate = sampleRate
    this.sinTable = []
    this.cosTable = []
    this.windowValues = []
    this.reverseTable = []
    this.peakBand = 0
    this.peak = 0
    const s = <f32>bufferSize
        // tslint:disable-next-line:no-shadowed-variable
    for (let i: i32 = 0; i < bufferSize; i++) {
      this.windowValues[i] = <f32>(E ** (
        <f32>-0.5 * <f32>(
          (
            <f32>i - (s - <f32>1) / <f32>2
          ) /
          (
            (alpha * (s - <f32>1)) / <f32>2
          ) ** <f32>2
        )
      ))
    }

    let limit = 1;
    // tslint:disable-next-line:no-bitwise
    let bit = bufferSize >> 1;

    while (limit < bufferSize) {
      for (let i = 0; i < limit; i++) {
        this.reverseTable[i + limit] = this.reverseTable[i] + bit;
      }

      // tslint:disable-next-line:no-bitwise
      limit = limit << 1;
      // tslint:disable-next-line:no-bitwise
      bit = bit >> 1;
    }

    for (let i = 0; i < bufferSize; i++) {
      this.sinTable[i] = <f32>Math.sin(<f32>-Math.PI / <f32>i);
      this.cosTable[i] = <f32>Math.cos(<f32>-Math.PI / <f32>i);
    }
  }

  calculateSpectrum(buffer: f32[]): f32[] {
    // Locally scope variables for speed up
    // tslint:disable-next-line:no-shadowed-variable
    const bufferSize = this.bufferSize
    const cosTable = this.cosTable
    const sinTable = this.sinTable
    const reverseTable = this.reverseTable
    const real: f32[] = []
    const imag: f32[] = []
    const bSi = 2 / this.bufferSize

    let rval: f32
    let ival: f32
    let mag: f32

    const spectrum: f32[] = []

    // if (Math.pow(2, k) !== bufferSize) {
    //   throw new Error('Invalid buffer size, must be a power of 2.')
    // }
    // if (bufferSize !== buffer.length) {
    //   throw new Error('Supplied buffer is not the same size as defined FFT. FFT Size: ' +
    //     bufferSize + ' Buffer Size: ' + buffer.length)
    // }

    let halfSize = 1
    let phaseShiftStepReal: f32
    let phaseShiftStepImag: f32
    let currentPhaseShiftReal: f32
    let currentPhaseShiftImag: f32
    let off: i32
    let tr: f32
    let ti: f32
    let tmpReal: f32

    // tslint:disable-next-line:no-shadowed-variable
    for (let i = 0; i < bufferSize; i++) {
      real[i] =
        buffer[reverseTable[i]] * this.windowValues[reverseTable[i]];
      imag[i] = 0;
    }

    while (halfSize < bufferSize) {
      phaseShiftStepReal = cosTable[halfSize];
      phaseShiftStepImag = sinTable[halfSize];

      currentPhaseShiftReal = 1;
      currentPhaseShiftImag = 0;

      for (let fftStep = 0; fftStep < halfSize; fftStep++) {
        // tslint:disable-next-line:no-shadowed-variable
        let i = fftStep;

        while (i < bufferSize) {
          off = i + halfSize;
          tr =
              currentPhaseShiftReal * real[off] -
              currentPhaseShiftImag * imag[off];
          ti =
              currentPhaseShiftReal * imag[off] +
              currentPhaseShiftImag * real[off];

          real[off] = real[i] - tr;
          imag[off] = imag[i] - ti;
          real[i] += tr;
          imag[i] += ti;

          // tslint:disable-next-line:no-bitwise
          i += halfSize << 1
        }

        tmpReal = currentPhaseShiftReal;
        currentPhaseShiftReal =
          tmpReal * phaseShiftStepReal -
          currentPhaseShiftImag * phaseShiftStepImag;
        currentPhaseShiftImag =
          tmpReal * phaseShiftStepImag +
          currentPhaseShiftImag * phaseShiftStepReal;
      }

      // tslint:disable-next-line:no-bitwise
      halfSize = halfSize << 1
    }

    // tslint:disable-next-line:no-shadowed-variable
    for (let i = 0, N = bufferSize / 2; i < N; i++) {
      rval = real[i];
      ival = imag[i];
      mag = <f32>bSi * <f32>Math.sqrt(rval * rval + ival * ival);

      if (mag > this.peak) {
          this.peakBand = i;
          this.peak = mag;
      }
      spectrum[i] = mag;
    }
    return spectrum;
  }
}

// function makeImage(f: Uint8Array[]) {
//   const image = new ImageData(f.length, f[0].length)
//   for (let i = 0; i < image.data.length; i += 4) {
//     const j = i / 4
//     const x = j % f.length
//     const y = Math.floor(j / f.length)
//     image.data[i]     = heatMapRgb[f[x][y]][0]
//     image.data[i + 1] = heatMapRgb[f[x][y]][1]
//     image.data[i + 2] = heatMapRgb[f[x][y]][2]
//     image.data[i + 3] = f[x][y] <= 2 ? 0 : 255
//   }
//   return image
// }

export function getFrequencies(fftSamples: i32, channelOne: f32[], length: i32, sampleRate: i32, width: i32, frequencies: u8[]): u8[] {

  if (!channelOne) {
    throw new Error('Web Audio buffer is not available')
  }

  const uniqueSamplesPerPx = length / width;
  const nOverlap = <i32>Math.max(0, Math.round(<f32>fftSamples - <f32>uniqueSamplesPerPx))

  const fft = new FFT(fftSamples, sampleRate, .05)
  let currentOffset: i32 = 0

  while (currentOffset + fftSamples < length) {
    const segment = channelOne.slice(
        currentOffset,
        currentOffset + fftSamples
    )
    const spectrum = fft.calculateSpectrum(segment)
    for (let j: i32 = 0; j < fftSamples / 2; j++) {
        frequencies[j * (currentOffset + 1)] = <u8>Math.max(-255, Math.log10(spectrum[j]) * 45)
    }
    currentOffset += fftSamples - nOverlap
  }
  // const resampled = resample(frequencies, width)
  return frequencies
}
