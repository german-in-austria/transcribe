import { TranscriptEvent, TokenTierType, TranscriptToken } from '../types/transcript'
import settings from '../store/settings.store'
import presets, { TokenTypesPresetGroup } from '../presets'

// tslint:disable-next-line:max-line-length
function iterateTokensBySpeakers(
  es: TranscriptEvent[],
  speakerIds: string[],
  f: (t: TranscriptToken) => TranscriptToken
): TranscriptEvent[] {
  speakerIds.forEach((s) => {
    es.forEach(e => {
      if (
        e.speakerEvents !== undefined &&
        e.speakerEvents[s] !== undefined
      ) {
        e.speakerEvents[s].tokens = e.speakerEvents[s].tokens.map(f)
      }
    })
  })
  return es
}

// tslint:disable-next-line:max-line-length
export function computeTokenTypesForEvents(
  es: TranscriptEvent[],
  defaultTier: TokenTierType,
  speakerIds: string[]
): TranscriptEvent[] {
  let currentBracketGroup: TokenTypesPresetGroup|null = null
  let firstTokenOfGroup: TranscriptToken|null = null
  let dg = 0
  const newEs = iterateTokensBySpeakers(es, speakerIds, (t) => {
    const cleanText = t.tiers[defaultTier].text.replace('=', '')
    // we’re currently in an open group, so we’re
    // looking for closing brackets
    if (currentBracketGroup !== null) {
      t.tiers[defaultTier].type = currentBracketGroup.id
      if (currentBracketGroup.bracketSymbols[1].test(cleanText)) {
        currentBracketGroup = null
        dg = 0
      } else {
        dg += 1
        if (dg > 100 || currentBracketGroup.bracketSymbols[0].test(cleanText)) {
          console.log('computeTokenTypesForEvents -> Too Many Tokens || Bracket reopened !!!', t, firstTokenOfGroup, currentBracketGroup)
          currentBracketGroup = null
          if (firstTokenOfGroup) {
            firstTokenOfGroup.tiers[defaultTier].type = -1
          } else {
            t.tiers[defaultTier].type = -1
          }
          dg = 0
        }
      }
    // we’re not, so we’re either looking
    // for single tokens or for opening brackets
    } else {
      firstTokenOfGroup = t
      const type = presets[settings.projectPreset].tokenTypes.find((tt) => {
        if (tt.type === 'single') {
          return tt.regex.test(cleanText)
        } else {
          if (tt.bracketSymbols[0].test(cleanText)) {
            currentBracketGroup = tt
            if (tt.bracketSymbols[1].test(cleanText)) {
              currentBracketGroup = null
              dg = 0
            }
            return true
          } else {
            return false
          }
        }
      })
      // its type could not be identified
      if (type === undefined) {
        t.tiers[defaultTier].type = -1
      // its type was found.
      } else {
        t.tiers[defaultTier].type = type.id
      }
    }
    return t
  })
  if (currentBracketGroup && firstTokenOfGroup) {
    console.log('computeTokenTypesForEvents -> End of Transcript without Bracket closed !!!', firstTokenOfGroup, currentBracketGroup);
    (firstTokenOfGroup['tiers'][defaultTier]['type'] as any) = -1
  }
  return newEs
}
