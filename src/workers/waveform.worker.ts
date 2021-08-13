
const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')

// Post data to parent thread
// tslint:disable-next-line:max-line-length
registerPromiseWorker((message: {buffer: ArrayBuffer, options: ArrayBuffer}, withTransferList: (...args: any[]) => any) => {
  /** This algo is adapted from DrawWave.js (https://github.com/meandavejustice/draw-wave)
   * The main difference is that this is _WAY_ faster (like 30 times), because it doesn’t
   * manipulate in-memory DOM Elements, but instead only concatenates a string.
  */
 // console.time('draw wave async')
  let upperHalf = ''
  let lowerHalf = ''
  const {options, buffer} = message
  const opts = JSON.parse(textDecoder.decode(options))
  const chanData = new Float32Array(buffer)
  const step = Math.floor( chanData.length / opts.width )
  const amp = opts.height / 2
  // console.time('draw wave async')
  for (let i = 0; i < opts.width; i++) {
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
    upperHalf = upperHalf + `${ i === 0 ? 'M' : 'L' } ${ i + opts.offsetLeft } ${ (1 + min) * amp } `
    lowerHalf = `L ${ i + opts.offsetLeft } ${ Math.max(1, (max - min) * amp) + ((1 + min) * amp) } ` + lowerHalf
  }
  // console.timeEnd('draw wave async')
  return upperHalf + lowerHalf + 'Z'
})
export default null as any
