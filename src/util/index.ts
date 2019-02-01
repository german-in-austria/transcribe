export function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t))
}
export function isEqualDeep(one: any, two: any): boolean {
  return JSON.stringify(one) === JSON.stringify(two)
}
