import presets from '@/presets'
import settings from '@/store/settings.store'
import _ from 'lodash'

import { TranscriptToken, TokenTierType } from '../types/transcript'
import Transcript from '../classes/transcript.class'

export type Pastable<T> = T & {
  index: number
  partial: boolean
}

// export function getTokenPartWithMetadata(
//   e: TranscriptToken,
//   defaultTier: TokenTierType,
//   range1: number,
//   range2?: number
// ): TranscriptToken {
//   return {
//     // old token id and all tiers
//     ...e,
//     tiers: {
//       // leave the other tiers untouched
//       ...e.tiers,
//       // edit the defaultTier text, so it only contains the selected text
//       [ defaultTier ]: {
//         ...e.tiers[ defaultTier ],
//         text: e.tiers[ defaultTier ].text.substring(range1, range2) + '='
//       }
//     }
//   }
// }

// export function getTokenPart(
//   e: TranscriptToken,
//   defaultTier: TokenTierType,
//   range1: number,
//   range2?: number
// ): TranscriptToken {
//   // new token id and only the default tier
//   return {
//     ...e,
//     id: Transcript.makeTokenId(),
//     tiers: {
//       ortho: { text: '', type: -1 },
//       phon: { text: '', type: -1 },
//       text: { text: '', type: -1 },
//       [ defaultTier ]: {
//         ...e.tiers[ defaultTier ],
//         text: e.tiers[ defaultTier ].text.substring(range1, range2)
//       }
//     }
//   }
// }

export function pastableTiersToTokens(ps: Array<Pastable<TranscriptToken['tiers']>>): TranscriptToken[] {
  return ps.map((ttp) => ({
    id: Transcript.makeTokenId(),
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

export function serializeTokens(tokens: Array<Pastable<TranscriptToken>>): string {
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

export function unserializeTokenTiers(
  tokens: string,
  t: Transcript
): Array<Pastable<TranscriptToken['tiers']>> {
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
      [ t.meta.defaultTier ]: {
        text: v[ t.meta.defaultTier.toUpperCase() ],
        type: Transcript.getTokenTypeFromToken(
          v[ t.meta.defaultTier.toUpperCase() ],
          presets[settings.projectPreset]
        ).id
      }
    }
  })
}

export function insertTokensAfterTextOffset(
  tokens: TranscriptToken[],
  t: Transcript,
  offset: number,
  insertableTiers: Array<Pastable<TranscriptToken['tiers']>>
): TranscriptToken[] {
  let cursor = 0
  return tokens.reduce((m, e, i, l) => {
    // get range for token
    const tokenStart = cursor
    const tokenEnd = cursor + e.tiers[ t.meta.defaultTier ].text.length
    // move cursor to the end of the token and account for whitespace
    cursor = tokenEnd + 1
    if (tokenStart < offset && tokenEnd > offset) {
      // the offset is in the middle
      // => split the token right in the middle. metadata goes to the first
      return m.concat([
        Transcript.getTokenPartWithMetadata(e, t.meta.defaultTier, offset - tokenStart, 0),
        ...pastableTiersToTokens(insertableTiers),
        Transcript.getTokenPart(e, t.meta.defaultTier, offset - tokenStart)
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
  }, [] as TranscriptToken[])
}

export function getOtherHalfOfToken(
  token: TranscriptToken,
  t: Transcript,
  tokenPart: TranscriptToken
): TranscriptToken {
  const s = tokenPart.tiers[ t.meta.defaultTier ].text
  return {
    ...token,
    tiers: {
      ...token.tiers,
      [ t.meta.defaultTier ]: {
        text: token.tiers[ t.meta.defaultTier ].text.replace(s, '')
      }
    }
  }
}

export function removeTokensAndTokenParts(
  tokens: TranscriptToken[],
  transcript: Transcript,
  tokensToRemove: Array<Pastable<TranscriptToken>>
) {
  const tokensToRemoveById = _(tokensToRemove).keyBy('id').value()
  return tokens.reduce((m, token) => {
    // the token should be removed
    if (token.id in tokensToRemoveById) {
      // the token was partially selected
      if (tokensToRemoveById[token.id].partial === true) {
        // add the non-selected half
        m.push(getOtherHalfOfToken(token, transcript, tokensToRemoveById[token.id]))
      // the token was fully selected
      } else {
        // it must be deleted entirely, so don’t push it.
        // do nothing.
      }
    } else {
      // it is not to be removed, so push it.
      m.push(token)
    }
    return m
  }, [] as TranscriptToken[])
}

export function insertTokensAfterTokenIndex(
  tokens: TranscriptToken[],
  index: number,
  tokenTiers: Array<Pastable<TranscriptToken['tiers']>>
) {
  const tsCopy = [ ...tokens ]
  tsCopy.splice(index, 0, ...pastableTiersToTokens(tokenTiers))
  return tsCopy
}

export function mergePastableTokensAt(
  localTokens: TranscriptToken[],
  transcript: Transcript,
  tokenTiers: Array<Pastable<TranscriptToken['tiers']>>,
  start: number,
  end: number,
  firstTokenOrder: number
): TranscriptToken[] {
  const segmentText = localTokens.map(t => t.tiers[ transcript.meta.defaultTier ].text).join(' ')
  // the target is either empty, or all of it is selected
  if (start === 0 && end === segmentText.length) {
    // replace all tokens
    // console.log('all tokens selected, replace all', this.segmentText.length, start, end)
    return tokenTiers.map(({ text, ortho, phon }, ti) => {
      return {
        id: Transcript.makeTokenId(),
        fragmentOf: null,
        sentenceId: -1,
        order: (firstTokenOrder || 0) + ti,
        tiers: { text, ortho, phon }
      }
    })
  // the selection is collapsed (i.e. there’s a cursor, but no selection)
  } else if (start === end) {
    const selectedTokens = Transcript.collectTokensViaOffsets(localTokens, transcript, start, end)
    // console.log({ selectedTokens })
    if (selectedTokens.length > 0) {
      // console.log('collapsed cursor: insert', start, end, selectedTokens[0])
      return insertTokensAfterTextOffset(localTokens, transcript, start, tokenTiers)
    } else {
      return localTokens
    }
  } else {
    // replace the fully and partially selected tokens.
    const selectedTokens = Transcript.collectTokensViaOffsets(localTokens, transcript, start, end)
    const tokensWithoutSelection = removeTokensAndTokenParts(localTokens, transcript, selectedTokens)
    const insertTokensAfterIndex = selectedTokens[0].index
    return insertTokensAfterTokenIndex(tokensWithoutSelection, insertTokensAfterIndex, tokenTiers)
  }
}
