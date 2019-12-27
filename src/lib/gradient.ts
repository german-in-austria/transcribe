
import _ from 'lodash'

export interface Color {
  at: number
  c: number[]
  // this is so we have an index
  // and typescript knows that
  // the key is always a string.
  [key: string]: number|number[]
}

export type Gradient = number[][]

export function makeGradient(colors: Color[]): Gradient {
  return _(colors).reduce((m, e, i, l) => {
    const next = l[i + 1]
    if (next) {
      const steps = next.at - e.at
      const factors = [
        (next.c[0] - e.c[0]) / steps,
        (next.c[1] - e.c[1]) / steps,
        (next.c[2] - e.c[2]) / steps,
        (next.c[3] - e.c[3]) / steps,
      ]
      const cs = _.range(steps).map((v: any, j: number) => {
        return [
          Math.round(e.c[0] + j * factors[0]),
          Math.round(e.c[1] + j * factors[1]),
          Math.round(e.c[2] + j * factors[2]),
          e.c[3] + j * factors[3]
        ]
      })
      return m = m.concat(cs)
    } else {
      return m = m.concat([ e.c ])
    }
  }, [] as number[][])
}
