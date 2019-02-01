export function clone<T>(t: T): T {
  return JSON.parse(JSON.stringify(t))
}
