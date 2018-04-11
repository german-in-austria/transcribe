import * as _ from 'lodash'

const symbol = [
  {
    text: 'More Than',
    value: 'GREATER_THAN'
  }, 
  {
    text: 'Less Than', 
    value: 'LESS_THAN'
  }
]

const rates = 
  _.chain(_.range(0,105,5))
  .reverse()
  .map(x => {
    return {
      text: `${x} %`,
      value: x
    }
  })
  .value()

export { symbol, rates }