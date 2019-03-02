const registerPromiseWorker = require('promise-worker-transferable/register')
const textDecoder = new TextDecoder('utf-8')
import * as _ from 'lodash'
import { ServerToken } from '@store/transcript';
// tslint:disable-next-line:max-line-length

function tokensToDiffable(sts: _.Dictionary<ServerToken>) {
  return _(sts).map((st, id) => ({...st, id })).sortBy(['i', 'tr']).value()
}

registerPromiseWorker((message: {oldT: ArrayBuffer, newT: ArrayBuffer}, withTransferList: (...args: any[]) => any) => {
  const { oldT, newT } = message
  const oldServerTokens = JSON.parse(textDecoder.decode(oldT)) as _.Dictionary<ServerToken>
  const newServerTokens = JSON.parse(textDecoder.decode(newT)) as _.Dictionary<ServerToken>
  const newDiffable = tokensToDiffable(newServerTokens)
  const oldDiffable = tokensToDiffable(oldServerTokens)
  const diff = _.differenceWith(newDiffable, oldDiffable,
    (l, r) => {
      return (
        l.id === r.id &&
        l.tr === r.tr &&
        l.tt === r.tt &&
        l.t === r.t &&
        l.i === r.i &&
        l.e === r.e
        // l.o === r.o &&
        // l.fo === r.fo
      )
    }
  )
  const [addedTokens, updatedTokens] = _.partition(diff, (t) => Number(t.id) < 0)
  const deletedTokens = _(oldDiffable).filter((t) => newServerTokens[t.id] === undefined).value()
  // console.log({addedTokens, updatedTokens, deletedTokens})
  return {
    addedTokens, updatedTokens, deletedTokens
  }
})

export default null as any
