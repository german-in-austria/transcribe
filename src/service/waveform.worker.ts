
const registerPromiseWorker = require('promise-worker-transferable/register')
// Post data to parent thread
registerPromiseWorker(([buffer, options]: [ ArrayBuffer, string ]) => {
  let upperHalf = ''
  let lowerHalf = ''
  const opts = JSON.parse(options)
  const chanData = new Float32Array(buffer)
  const step = Math.ceil( chanData.length / opts.width )
  const amp = opts.height / 2
  console.time('draw wave async')
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
  console.timeEnd('draw wave async')
  return upperHalf + lowerHalf + 'Z'
})
export default null as any
