// import 'assemblyscript/std/assembly/index'
// const loader = require("@assemblyscript/loader");
// import {} from 'assemblyscript/std/types/assembly'
import 'allocator/arena'

export { memory }

// declare function log(s: i32): void

@inline function getInput(index: i32): f32 {
  return load<f32>(index << 2, 0);
}

export function drawWavePath(arr: Float32Array, output: f32[], width: i32, height: i32, offsetLeft: i32): f32[] {
  // const lowerHalf: f32[] = []
  // const upperHalf: f32[] = []
  const step = ceil<i32>( arr.length / width )
  const amp = height / 2
  for (let i: i32 = 0; i < width; i++) {
    let minimum: f32 = 1.0
    let maximum: f32 = -1.0
    for (let j: i32 = 0; j < step; j++) {
      let datum = arr[i * step + j]
      if (datum < minimum) {
        minimum = datum
      }
      if (datum > maximum) {
        maximum = datum
      }
    }
    output.push((1 + minimum) * <f32>amp)
    output.push(max<f32>(1, (maximum - minimum) * <f32>amp) + ((1 + minimum) * <f32>amp))
    // upperHalf.push( (1 + minimum) * <f32>amp )
    // lowerHalf.unshift(max<f32>(1, (maximum - minimum) * <f32>amp) + ((1 + minimum) * <f32>amp))
  }
  // _log(upperHalf + lowerHalf)
  return output
}
