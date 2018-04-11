import * as _ from 'lodash'

const formatTimezone = (timezone: number): string => {
  if (timezone == 0) {
    return 'GMT'
  }
  else if (timezone > 0) {
    return `GMT +${timezone}`
  }
  else {
    return `GMT ${timezone}`
  }
}

const timezones = _.map(_.range(-12,13), x => {
  return {
    text: formatTimezone(x),
    value: x
  }
})

export {timezones, formatTimezone}