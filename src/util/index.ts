type PrimitiveOrNone = number|null|undefined|string

import * as PromiseWorker from 'promise-worker-transferable'
import Worker from '../service/buffer-concat.worker'
const worker = new Worker('')
const promiseWorker = new PromiseWorker(worker)

export async function asyncForEach<T>(array: T[], callback: (e: T, i: number, l: T[]) => void) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function requestFrameAsync(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame((time) => {
      resolve(time)
    })
  })
}

export function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t))
}

export function isEqualDeep(one: any, two: any): boolean {
  return JSON.stringify(one) === JSON.stringify(two)
}

export function findAllNotIn<T extends PrimitiveOrNone>(base: T[], find: T[]): T[] {
  const l = find.length
  const b = []
  for (let i = 0; i < l; ++i) {
    if (base.indexOf(find[i]) === -1) {
      b.push(find[i])
    }
  }
  return b
}

export function allInArray<T extends PrimitiveOrNone>(base: T[], find: T[]): boolean {
  return findAllNotIn(base, find).length === 0
}

export function range(start: number, end: number) {
  const a = []
  for (let i = start; i <= end; ++i) {
    a.push(i)
  }
  return a
}

export async function concatUint8ArrayAsync(first: Uint8Array, second: Uint8Array): Promise<Uint8Array[]> {
  const b1 = first.buffer
  const b2 = second.buffer
  const [ combined, one, two ] = await promiseWorker.postMessage({
      first   : b1,
      second : b2
    },
    [ b1, b2 ]
  )
  return [
    new Uint8Array(combined),
    new Uint8Array(one),
    new Uint8Array(two)
  ]
}

export function concatUint8Array(first: Uint8Array, second: Uint8Array) {
  const arr = new Uint8Array(first.length + second.length)
  arr.set(first, 0)
  arr.set(second, first.length)
  return arr
}
