const registerPromiseWorker = require('promise-worker/register')
// import { heatMap } from './heat-map'

// // tslint:disable:no-bitwise
// const heatMapRgb = heatMap.map((hex) => {
//   const bigint = parseInt(hex, 16)
//   return [
//     (bigint >> 16) & 255,
//     (bigint >> 8) & 255,
//     bigint & 255
//   ]
// })

interface FFT {
  bufferSize: number
  sampleRate: number
  bandwidth: number
  sinTable: Float32Array
  cosTable: Float32Array
  windowValues: Float32Array
  reverseTable: Uint32Array
  peakBand: number
  peak: number
  calculateSpectrum(buffer: Float32Array): Float32Array
}

const FFT = function(this: FFT, bufferSize: number, sampleRate: number, windowFunc: string, alpha?: number) {

  this.bufferSize = bufferSize;
  this.sampleRate = sampleRate;
  this.bandwidth = (2 / bufferSize) * (sampleRate / 2);

  this.sinTable = new Float32Array(bufferSize);
  this.cosTable = new Float32Array(bufferSize);
  this.windowValues = new Float32Array(bufferSize);
  this.reverseTable = new Uint32Array(bufferSize);

  this.peakBand = 0;
  this.peak = 0;

  switch (windowFunc) {
      case 'bartlett':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  (2 / (bufferSize - 1)) *
                  ((bufferSize - 1) / 2 - Math.abs(i - (bufferSize - 1) / 2));
          }
          break;
      case 'bartlettHann':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  0.62 -
                  0.48 * Math.abs(i / (bufferSize - 1) - 0.5) -
                  0.38 * Math.cos((Math.PI * 2 * i) / (bufferSize - 1));
          }
          break;
      case 'blackman':
          alpha = alpha || 0.16;
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  (1 - alpha) / 2 -
                  0.5 * Math.cos((Math.PI * 2 * i) / (bufferSize - 1)) +
                  (alpha / 2) *
                      Math.cos((4 * Math.PI * i) / (bufferSize - 1));
          }
          break;
      case 'cosine':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] = Math.cos(
                  (Math.PI * i) / (bufferSize - 1) - Math.PI / 2
              );
          }
          break;
      case 'gauss':
          alpha = alpha || 0.25;
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] = Math.pow(
                  Math.E,
                  -0.5 *
                      Math.pow(
                          (i - (bufferSize - 1) / 2) /
                              ((alpha * (bufferSize - 1)) / 2),
                          2
                      )
              );
          }
          break;
      case 'hamming':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  (0.54 - 0.46) *
                  Math.cos((Math.PI * 2 * i) / (bufferSize - 1));
          }
          break;
      case 'hann':
      case undefined:
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  0.5 * (1 - Math.cos((Math.PI * 2 * i) / (bufferSize - 1)));
          }
          break;
      case 'lanczoz':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  Math.sin(Math.PI * ((2 * i) / (bufferSize - 1) - 1)) /
                  (Math.PI * ((2 * i) / (bufferSize - 1) - 1));
          }
          break;
      case 'rectangular':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] = 1;
          }
          break;
      case 'triangular':
          // tslint:disable-next-line:no-shadowed-variable
          for (let i = 0; i < bufferSize; i++) {
              this.windowValues[i] =
                  (2 / bufferSize) *
                  (bufferSize / 2 - Math.abs(i - (bufferSize - 1) / 2));
          }
          break;
      default:
          throw Error('No such window function \'' + windowFunc + '\'')
  }

  let limit = 1;
  // tslint:disable-next-line:no-bitwise
  let bit = bufferSize >> 1;

  let i;

  while (limit < bufferSize) {
      for (i = 0; i < limit; i++) {
          this.reverseTable[i + limit] = this.reverseTable[i] + bit;
      }

      // tslint:disable-next-line:no-bitwise
      limit = limit << 1;
      // tslint:disable-next-line:no-bitwise
      bit = bit >> 1;
  }

  for (i = 0; i < bufferSize; i++) {
      this.sinTable[i] = Math.sin(-Math.PI / i);
      this.cosTable[i] = Math.cos(-Math.PI / i);
  }

  this.calculateSpectrum = function(buffer: Float32Array) {
      // Locally scope variables for speed up
      // tslint:disable-next-line:no-shadowed-variable
      const bufferSize = this.bufferSize
      const cosTable = this.cosTable
      const sinTable = this.sinTable
      const reverseTable = this.reverseTable
      const real = new Float32Array(bufferSize)
      const imag = new Float32Array(bufferSize)
      const bSi = 2 / this.bufferSize
      const sqrt = Math.sqrt
      let rval
      let ival
      let mag
      const spectrum = new Float32Array(bufferSize / 2);

      const k = Math.floor(Math.log(bufferSize) / Math.LN2);

      if (Math.pow(2, k) !== bufferSize) {
          throw new Error('Invalid buffer size, must be a power of 2.')
      }
      if (bufferSize !== buffer.length) {
          throw new Error('Supplied buffer is not the same size as defined FFT. FFT Size: ' +
            bufferSize + ' Buffer Size: ' + buffer.length)
      }

      let halfSize = 1
      let phaseShiftStepReal
      let phaseShiftStepImag
      let currentPhaseShiftReal
      let currentPhaseShiftImag
      let off
      let tr
      let ti
      let tmpReal

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
          mag = bSi * sqrt(rval * rval + ival * ival);

          if (mag > this.peak) {
              this.peakBand = i;
              this.peak = mag;
          }
          spectrum[i] = mag;
      }
      return spectrum;
  }
} as any as { new (bufferSize: number, sampleRate: number, windowFunc: string, alpha?: number): FFT }

function makeImage(f: Uint8Array[], gradient: number[][]) {
  console.log({ gradient })
  const image = new ImageData(f.length, f[0].length)
  for (let i = 0; i < image.data.length; i += 4) {
    const j = i / 4
    const x = j % f.length
    const y = Math.floor(j / f.length)
    image.data[i]     = gradient[f[x][y]][0]
    image.data[i + 1] = gradient[f[x][y]][1]
    image.data[i + 2] = gradient[f[x][y]][2]
    image.data[i + 3] = gradient[f[x][y]][3] * 255
    // image.data[i]     = 255
    // image.data[i + 1] = 255
    // image.data[i + 2] = 255
    // image.data[i + 3] = f[x][y]
  }
  return image
}

function resample(oldMatrix: Uint8Array[], width: number) {
  const columnsNumber = width
  const newMatrix = []

  const oldPiece = 1 / oldMatrix.length
  const newPiece = 1 / columnsNumber
  let i;

  for (i = 0; i < columnsNumber; i++) {
    const column = new Array(oldMatrix[0].length);
    let j;

    for (j = 0; j < oldMatrix.length; j++) {
      const oldStart = j * oldPiece;
      const oldEnd = oldStart + oldPiece;
      const newStart = i * newPiece;
      const newEnd = newStart + newPiece;

      const overlap = oldEnd <= newStart || newEnd <= oldStart
        ? 0
        : Math.min(
              Math.max(oldEnd, newStart),
              Math.max(newEnd, oldStart)
          ) -
          Math.max(
              Math.min(oldEnd, newStart),
              Math.min(newEnd, oldStart)
          );
      let k;
      /* eslint-disable max-depth */
      if (overlap > 0) {
        for (k = 0; k < oldMatrix[0].length; k++) {
          if (column[k] == null) {
            column[k] = 0;
          }
          column[k] += (overlap / newPiece) * oldMatrix[j][k];
        }
      }
    }
    const intColumn = new Uint8Array(oldMatrix[0].length);
    let m;

    for (m = 0; m < oldMatrix[0].length; m++) {
      intColumn[m] = column[m];
    }
    newMatrix.push(intColumn);
  }

  return newMatrix;
}

function getFrequencies({fftSamples, buffer, length, sampleRate, width, gradient}: {
  fftSamples: number,
  buffer: ArrayBuffer,
  length: number,
  sampleRate: number,
  width: number,
  gradient: number[][]
}) {
  const channelOne = new Float32Array(buffer)
  const frequencies = []

  if (!channelOne) {
    throw new Error('Web Audio buffer is not available')
  }

  const uniqueSamplesPerPx = length / width;
  const nOverlap = Math.max(0, Math.round(fftSamples - uniqueSamplesPerPx))

  const fft = new FFT(fftSamples, sampleRate, 'gauss', .05)
  let currentOffset = 0

  while (currentOffset + fftSamples < length) {
    const segment = channelOne.slice(currentOffset, currentOffset + fftSamples)
    const spectrum = fft.calculateSpectrum(segment)
    const array = new Uint8Array(fftSamples / 2)
    let j
    for (j = 0; j < fftSamples / 2; j++) {
        array[j] = Math.max(-255, Math.log10(spectrum[j]) * 45)
    }
    frequencies.push(array.reverse())
    currentOffset += fftSamples - nOverlap
  }
  // const resampled = resample(frequencies, width)
  return [frequencies, makeImage(frequencies, gradient)]
}

registerPromiseWorker(getFrequencies)

export default null as any
