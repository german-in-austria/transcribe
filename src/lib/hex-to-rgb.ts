
// tslint:disable:no-bitwise
const {heatMap} = require('../service/heat-map')

const baseColor = parseInt(heatMap[0], 16)

heatMap.map((hex: string) => {
  const bigint = parseInt(hex, 16)
  const diff = bigint - baseColor
  console.log(diff)
  return [
    (bigint >> 16) & 255,
    (bigint >> 8) & 255,
    (bigint & 255)
  ]
})
