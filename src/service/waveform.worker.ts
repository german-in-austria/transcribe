
const registerPromiseWorker = require('promise-worker/register')
// Post data to parent thread
registerPromiseWorker((message: { buffer: ArrayBuffer, width: number, height: number, offsetLeft: number }) => {
  let upperHalf = ''
  let lowerHalf = ''
  const chanData = new Float32Array(message.buffer)
  const step = Math.ceil( chanData.length / message.width )
  const amp = message.height / 2
  console.time('draw wave async')
  for (let i = 0; i < message.width; i++) {
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
    upperHalf = upperHalf + `${ i === 0 ? 'M' : 'L' } ${ i + message.offsetLeft } ${ (1 + min) * amp } `
    lowerHalf = `L ${ i + message.offsetLeft } ${ Math.max(1, (max - min) * amp) + ((1 + min) * amp) } ` + lowerHalf
  }
  console.timeEnd('draw wave async')
  return upperHalf + lowerHalf + 'Z'
})
export default null as any
