import * as registerPromiseWorker from 'promise-worker-transferable/register'
// Post data to parent thread
// tslint:disable-next-line:max-line-length
registerPromiseWorker((message: { first: ArrayBuffer, second: ArrayBuffer }, withTransferList: (...args: any[]) => any) => {
  // console.time('concat array async ' + (message.first.byteLength + message.second.byteLength))
  const arr = new Uint8Array(message.first.byteLength + message.second.byteLength)
  arr.set(new Uint8Array(message.first), 0)
  arr.set(new Uint8Array(message.second), message.first.byteLength)
  // console.timeEnd('concat array async ' + (message.first.byteLength + message.second.byteLength))
  return withTransferList(
    [ arr.buffer, message.first, message.second ],
    [ arr.buffer, message.first, message.second ]
  )
})
export default null as any
