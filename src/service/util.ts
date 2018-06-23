type PrimitiveOrNone = number|null|undefined|string

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
  concatUint8Array(...arrays: Uint8Array[]) {
    let totalLength = 0
    for (const arr of arrays) {
        totalLength += arr.length
    }
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
        result.set(arr, offset)
        offset += arr.length
    }
    return result
  }
}
