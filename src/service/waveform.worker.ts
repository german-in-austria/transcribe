const ctx: Worker = self as any;

// Post data to parent thread
ctx.postMessage({ foo: 'foo' });

// Respond to message from parent thread
ctx.addEventListener('message', (event: any) => {
  const arr = []
  if (event.data && event.data.b) {
    const data = event.data.b
    console.log(data)
    const step = Math.ceil( data.length / 1000 )
    console.log(step)
    const amp  = 200 / 2
    for (let i = 0; i < 1000; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j]
        if (datum < min) {
          min = datum
        }
        if (datum > max) {
          max = datum
        }
      }
      arr.push([i, (1 + min) * amp, Math.max(1, (max - min) * amp)])
    }
    ctx.postMessage({
      waveform: arr
    })
  }
})

// this is to trick TS into thinking
// that this is a proper module.
export default Worker || null
