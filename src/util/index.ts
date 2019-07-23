type PrimitiveOrNone = number|null|undefined|string

import * as PromiseWorker from 'promise-worker-transferable'
import Worker from '../service/buffer-concat.worker'
const worker = new Worker('')
const promiseWorker = new PromiseWorker(worker)

export interface UndoRedo {
  undo: boolean
  redo: boolean
}

interface FileReaderEventTarget extends EventTarget {
  result: ArrayBuffer|string
}

export function setNumberInBounds(n: number, min = 0, max = 1) {
  if (n <= min) {
    return min
  } else if (n >= max) {
    return max
  } else {
    return n
  }
}

export function fileToTextAndName(f: File): Promise<{ t: string, n: string }> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent) => {
        resolve({
          t: ((e.target as FileReaderEventTarget).result as string),
          n: f.name
        })
      }
      reader.readAsText(f, 'UTF-8')
    } catch (e) {
      reject(e)
    }
  })
}

export function isUndoOrRedo(fn: (e: KeyboardEvent, d: UndoRedo) => any) {
  return (e: KeyboardEvent) => {
    if (platform() === 'mac') {
      if (e.metaKey && !e.shiftKey && e.key === 'z') {
        return fn(e, {undo: true, redo: false })
      } else if (e.metaKey && e.shiftKey && e.key === 'z') {
        return fn(e, {undo: false, redo: true })
      }
    } else {
      if (e.ctrlKey && e.key === 'z') {
        return fn(e, {undo: true, redo: false })
      } else if (e.ctrlKey && e.key === 'y') {
        return fn(e, {undo: false, redo: true })
      }
    }
  }
}

export function isCmdOrCtrl(fn: (e: KeyboardEvent) => any) {
  return (e: KeyboardEvent) => {
    if ((platform() === 'mac' && e.metaKey) || (platform() !== 'mac' && e.ctrlKey)) {
      return fn(e)
    }
  }
}

export function fileToUint8ArrayAndName(f: File): Promise<{ b: Uint8Array, n: string }> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent) => {
        resolve({
          b: new Uint8Array((e.target as FileReaderEventTarget).result as ArrayBuffer),
          n: f.name
        })
      }
      reader.readAsArrayBuffer(f)
    } catch (e) {
      reject(e)
    }
  })
}

export function platform(): 'windows'|'mac'|'linux' {
  if (navigator.platform.toLowerCase() === 'win32' || navigator.platform.toLowerCase() === 'win64') {
    return 'windows'
  } else if (navigator.platform.toLowerCase() === 'macintel') {
    return 'mac'
  } else {
    return 'linux'
  }
}

export async function asyncForEach<T>(array: T[], callback: (e: T, i: number, l: T[]) => void) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function easeOutQuad(t: number, b: number, c: number, d: number) {
  t /= d
  return -c * t * (t - 2) + b
}

export function easeInOutQuad(t: number, b: number, c: number, d: number): number {
  t /= d / 2
  if (t < 1) {
    return c / 2 * t * t + b
  }
  t--
  return -c / 2 * ( t * ( t - 2 ) - 1) + b
}

export function padEnd(string: string, targetLength: number, padString: string) {
  // tslint:disable-next-line:no-bitwise
  targetLength = targetLength >> 0
  padString = String((typeof padString !== 'undefined' ? padString : ' '))
  if (string.length > targetLength) {
      return String(string)
  } else {
      targetLength = targetLength - string.length;
      if (targetLength > padString.length) {
          padString += padString.repeat(targetLength / padString.length)
      }
      return String(string) + padString.slice(0, targetLength)
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
