import _ from 'lodash'

import {
  eventStore,
  LocalTranscriptToken,
  makeTokenId,
  tokenTypeFromToken
} from '../store/transcript'

export type Pastable<T> = T & {
  index: number
  partial: boolean
}

export function getTokenPartWithMetadata(
  e: LocalTranscriptToken,
  range1: number,
  range2?: number
): LocalTranscriptToken {
  return {
    // old token id and all tiers
    ...e,
    tiers: {
      // leave the other tiers untouched
      ...e.tiers,
      // edit the defaultTier text, so it only contains the selected text
      [ eventStore.metadata.defaultTier ]: {
        ...e.tiers[ eventStore.metadata.defaultTier ],
        text: e.tiers[ eventStore.metadata.defaultTier ].text.substring(range1, range2) + '='
      },
    }
  }
}

export function getTokenPart(
  e: LocalTranscriptToken,
  range1: number,
  range2?: number
): LocalTranscriptToken {
  // new token id and only the default tier
  return {
    ...e,
    id: makeTokenId(),
    tiers: {
      ortho: { text: '', type: -1 },
      phon:  { text: '', type: -1 },
      text:  { text: '', type: -1 },
      [ eventStore.metadata.defaultTier ]: {
        ...e.tiers[ eventStore.metadata.defaultTier ],
        text: e.tiers[ eventStore.metadata.defaultTier ].text.substring(range1, range2)
      }
    }
  }
}

export function pastableTiersToTokens(ps: Array<Pastable<LocalTranscriptToken['tiers']>>): LocalTranscriptToken[] {
  return ps.map((ttp) => ({
    id: makeTokenId(),
    fragmentOf: -1,
    sentenceId: -1,
    order: 0,
    tiers: {
      text: ttp.text,
      ortho: ttp.ortho,
      phon: ttp.phon
    }
  }))
}

export function serializeTokens(tokens: Array<Pastable<LocalTranscriptToken>>): string {
  return _(tokens).reduce((m, e, i, l) => {
    if (i === 0) {
      // insert the header
      m = 'ORDER;TEXT;ORTHO;PHON;PARTIAL;INDEX\n'
    }
    // insert data
    return m
      + e.order + ';'
      + e.tiers.text.text + ';'
      + e.tiers.ortho.text + ';'
      + e.tiers.phon.text + ';'
      + e.partial + ';'
      + e.index + '\n'
  }, '')
}

export function parseCsv(csv: string): Array<{ [key: string]: string }> {
  const lines = csv.split('\n')
  const headers = lines[0].split(';')
  return _(lines)
    .tail()
    .filter(line => line.trim() !== '')
    .map(line => {
      const es = line.split(';')
      return headers.reduce((m, e, i) => {
        m[e] = es[i]
        return m
      }, {} as { [key: string]: string })
    })
    .value()
}

export function unserializeTokenTiers(tokens: string): Array<Pastable<LocalTranscriptToken['tiers']>> {
  const parsedTokens = parseCsv(tokens)
  return parsedTokens.map((v, k) => {
    return {
      index: Number(v.INDEX),
      partial: v.PARTIAL === 'true',
      text: {
        text: v.TEXT || '',
        type: -1
      },
      phon: {
        text: v.PHON || '',
        type: -1
      },
      ortho: {
        text: v.ORTHO || '',
        type: -1
      },
      [ eventStore.metadata.defaultTier ]: {
        text: v[ eventStore.metadata.defaultTier.toUpperCase() ],
        type: tokenTypeFromToken(v[ eventStore.metadata.defaultTier.toUpperCase() ]).id
      }
    }
  })
}

export function collectTokensViaOffsets(
  tokens: LocalTranscriptToken[], start: number, end: number): Array<Pastable<LocalTranscriptToken>> {
  // start and end are not necessarily from left to right
  const [left, right] = [start, end].sort()
  // init cursor
  let cursor = 0
  // reduce to relevant tokens and mark partiality
  return tokens.reduce((m, e, i) => {
    // get range for token
    const tokenStart = cursor
    const tokenEnd = cursor + e.tiers[ eventStore.metadata.defaultTier ].text.length
    // move cursor to the end of the token and account for whitespace
    cursor = tokenEnd + 1
    // decide whether it’s in the range
    console.log({ tokenStart, tokenEnd, cursor, t: e.tiers.ortho.text })
    if (left <= tokenStart && right >= tokenEnd) {
      // token is fully in collection range, not partial
      return m.concat({ ...e, partial: false, index: i })
    } else if (left > tokenEnd || right <= tokenStart) {
      // token is outside of collection range -> do nothing
      return m
    } else {
      // token is partly in collection range, not fully
      if (right < tokenEnd) {
        // only take the left part (it’s the start)
        return m.concat([{
          ...getTokenPartWithMetadata(e, 0, right - tokenStart),
          index: i,
          partial: true
        }])
      } else {
        // only take the right part (it’s the end)
        return m.concat([{
          ...getTokenPart(e, left - tokenStart),
          index: i,
          partial: true
        }])
      }
    }
  }, [] as Array<Pastable<LocalTranscriptToken>>)
}

export function insertTokensAfterTextOffset(
  tokens: LocalTranscriptToken[],
  offset: number,
  insertableTiers: Array<Pastable<LocalTranscriptToken['tiers']>>
): LocalTranscriptToken[] {
  let cursor = 0
  return tokens.reduce((m, e, i, l) => {
    // get range for token
    const tokenStart = cursor
    const tokenEnd = cursor + e.tiers[ eventStore.metadata.defaultTier ].text.length
    // move cursor to the end of the token and account for whitespace
    cursor = tokenEnd + 1
    if (tokenStart < offset && tokenEnd > offset) {
      // the offset is in the middle
      // => split the token right in the middle. metadata goes to the first
      return m.concat([
        getTokenPartWithMetadata(e, offset - tokenStart, 0),
        ...pastableTiersToTokens(insertableTiers),
        getTokenPart(e, offset - tokenStart)
      ])
    } else if (tokenStart === offset) {
      // right before the token
      return m.concat([
        ...pastableTiersToTokens(insertableTiers),
        e
      ])
    } else if (tokenEnd === offset) {
      // right after the token
      return m.concat([
        e,
        ...pastableTiersToTokens(insertableTiers)
      ])
    } else {
      return m.concat([ e ])
    }
  }, [] as LocalTranscriptToken[])
}

export function getOtherHalfOfToken(
  token: LocalTranscriptToken,
  tokenPart: LocalTranscriptToken
): LocalTranscriptToken {
  const s = tokenPart.tiers[eventStore.metadata.defaultTier].text
  return {
    ...token,
    tiers: {
      ...token.tiers,
      [ eventStore.metadata.defaultTier ]: {
        text: token.tiers[eventStore.metadata.defaultTier].text.replace(s, '')
      }
    }
  }
}

export function removeTokensAndTokenParts(
  tokens: LocalTranscriptToken[],
  tokensToRemove: Array<Pastable<LocalTranscriptToken>>
) {
  const tokensToRemoveById = _(tokensToRemove).keyBy('id').value()
  return tokens.reduce((m, t, i, l) => {
    // the token should be removed
    if (t.id in tokensToRemoveById) {
      // the token was partially selected
      if (tokensToRemoveById[t.id].partial === true) {
        // add the non-selected half
        m.push(getOtherHalfOfToken(t, tokensToRemoveById[t.id]))
      // the token was fully selected
      } else {
        // it must be deleted entirely, so don’t push it.
        // do nothing.
      }
    } else {
      // it is not to be removed, so push it.
      m.push(t)
    }
    return m
  }, [] as LocalTranscriptToken[])
}

export function insertTokensAfterTokenIndex(
  tokens: LocalTranscriptToken[],
  index: number,
  tokenTiers: Array<Pastable<LocalTranscriptToken['tiers']>>
) {
  const tsCopy = [...tokens]
  tsCopy.splice(index, 0, ...pastableTiersToTokens(tokenTiers))
  return tsCopy
}

export function mergePastableTokensAt(
  localTokens: LocalTranscriptToken[],
  tokenTiers: Array<Pastable<LocalTranscriptToken['tiers']>>,
  start: number,
  end: number,
  firstTokenOrder: number
): LocalTranscriptToken[] {
  const segmentText = localTokens.map(t => t.tiers[eventStore.metadata.defaultTier].text).join(' ')
  // the target is either empty, or all of it is selected
  if (start === 0 && end === segmentText.length) {
    // replace all tokens
    // console.log('all tokens selected, replace all', this.segmentText.length, start, end)
    return tokenTiers.map(({text, ortho, phon}, ti) => {
      return {
        id: makeTokenId(),
        fragmentOf: null,
        sentenceId: -1,
        order: (firstTokenOrder || 0) + ti,
        tiers: { text, ortho, phon }
      }
    })
  // the selection is collapsed (i.e. there’s a cursor, but no selection)
  } else if (start === end) {
    const selectedTokens = collectTokensViaOffsets(localTokens, start, end)
    // console.log({ selectedTokens })
    if (selectedTokens.length > 0) {
      // console.log('collapsed cursor: insert', start, end, selectedTokens[0])
      return insertTokensAfterTextOffset(localTokens, start, tokenTiers)
    } else {
      return localTokens
    }
  } else {
    // replace the fully and partially selected tokens.
    const selectedTokens = collectTokensViaOffsets(localTokens, start, end)
    const tokensWithoutSelection = removeTokensAndTokenParts(localTokens, selectedTokens)
    const insertTokensAfterIndex = selectedTokens[0].index
    return insertTokensAfterTokenIndex(tokensWithoutSelection, insertTokensAfterIndex, tokenTiers)
  }
}
