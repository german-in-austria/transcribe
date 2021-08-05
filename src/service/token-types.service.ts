import { LocalTranscriptEvent, TokenTierType, LocalTranscriptToken } from '../store/transcript'
import settings from '../store/settings'
import presets, { TokenTypesPresetGroup } from '../presets'

// tslint:disable-next-line:max-line-length
function iterateTokensBySpeakers(
  es: LocalTranscriptEvent[],
  speakerIds: string[],
  f: (t: LocalTranscriptToken) => LocalTranscriptToken
): LocalTranscriptEvent[] {
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
  es: LocalTranscriptEvent[],
  defaultTier: TokenTierType,
  speakerIds: string[]
): LocalTranscriptEvent[] {
  let currentBracketGroup: TokenTypesPresetGroup|null = null
  const newEs = iterateTokensBySpeakers(es, speakerIds, (t) => {
    const cleanText = t.tiers[defaultTier].text.replace('=', '')
    // we’re currently in an open group, so we’re
    // looking for closing brackets
    if (currentBracketGroup !== null) {
      t.tiers[defaultTier].type = currentBracketGroup.id
      if (currentBracketGroup.bracketSymbols[1].test(cleanText)) {
        currentBracketGroup = null
      }
    // we’re not, so we’re either looking
    // for single tokens or for opening brackets
    } else {
      const type = presets[settings.projectPreset].tokenTypes.find((tt) => {
        if (tt.type === 'single') {
          return tt.regex.test(cleanText)
        } else {
          if (tt.bracketSymbols[0].test(cleanText)) {
            currentBracketGroup = tt
            if (tt.bracketSymbols[1].test(cleanText)) {
              currentBracketGroup = null
            }
            return true
          } else {
            return false
          }
        }
      })
      // it’s the placeholder token
      if (cleanText === settings.placeholderToken) {
        t.tiers[defaultTier].type = -2
      // its type could not be identified
      } else if (type === undefined) {
        t.tiers[defaultTier].type = -1
      // its type was found.
      } else {
        t.tiers[defaultTier].type = type.id
      }
    }
    return t
  })
  return newEs
}
