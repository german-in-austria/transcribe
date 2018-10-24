type PrimitiveOrNone = number|null|undefined|string

import * as PromiseWorker from 'promise-worker-transferable'
import Worker from './buffer-concat.worker'
const worker = new Worker('')
const promiseWorker = new PromiseWorker(worker)

export default {
  findAllNotIn<T extends PrimitiveOrNone>(base: T[], find: T[]): T[] {
    const l = find.length
    const b = []
    for (let i = 0; i < l; ++i) {
      if (base.indexOf(find[i]) === -1) {
        b.push(find[i])
      }
    }
    return b
  },
  allInArray<T extends PrimitiveOrNone>(base: T[], find: T[]): boolean {
    return this.findAllNotIn(base, find).length === 0
  },
  range(start: number, end: number) {
    const a = []
    for (let i = start; i <= end; ++i) {
      a.push(i)
    }
    return a
  },
  async concatUint8ArrayAsync(first: Uint8Array, second: Uint8Array): Promise<Uint8Array[]> {
    const [ combined, one, two ] = await promiseWorker.postMessage({
        first   : first.buffer,
        second : second.buffer
      },
      [ first.buffer, second.buffer ]
    )
    return [
      new Uint8Array(combined),
      new Uint8Array(one),
      new Uint8Array(two)
    ]
  },
  concatUint8Array(first: Uint8Array, second: Uint8Array) {
    const arr = new Uint8Array(first.length + second.length)
    arr.set(first, 0)
    arr.set(second, first.length)
    return arr
  }
}
