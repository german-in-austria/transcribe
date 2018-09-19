
const registerPromiseWorker = require('promise-worker/register')
// Post data to parent thread
registerPromiseWorker((message: { first: ArrayBuffer, second: ArrayBuffer }) => {
  // console.time('concat array async ' + (message.first.byteLength + message.second.byteLength))
  const arr = new Uint8Array(message.first.byteLength + message.second.byteLength)
  arr.set(new Uint8Array(message.first), 0)
  arr.set(new Uint8Array(message.second), message.first.byteLength)
  // console.timeEnd('concat array async ' + (message.first.byteLength + message.second.byteLength))
  return arr
})
export default null as any
