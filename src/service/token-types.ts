import { LocalTranscriptEvent, TokenTierType, LocalTranscriptToken, LocalTranscriptSpeakers } from '../store/transcript'
import settings, { TokenTypesPresetGroup, tokenTypesPresets } from '../store/settings'
import _ from 'lodash'
import { clone } from '../util'

// tslint:disable-next-line:max-line-length
function iterateTokensBySpeakers(
  es: LocalTranscriptEvent[],
  speakerIds: string[],
  f: (t: LocalTranscriptToken) => LocalTranscriptToken
): LocalTranscriptEvent[] {
  // const es = clone(esOriginal)
  _(speakerIds).forEach((s) => {
    _(es).forEach(e => {
      if (e.speakerEvents[s] !== undefined) {
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
    if (currentBracketGroup !== null) {
      t.tiers[defaultTier].type = currentBracketGroup.id
      if (currentBracketGroup.bracketSymbols[1].test(t.tiers[defaultTier].text)) {
        currentBracketGroup = null
      }
    } else {
      const type = _(tokenTypesPresets[settings.tokenTypesPreset]).find((tt) => {
        if (tt.type === 'single') {
          return tt.regex.test(t.tiers[defaultTier].text)
        } else {
          if (tt.bracketSymbols[0].test(t.tiers[defaultTier].text)) {
            currentBracketGroup = tt
            if (tt.bracketSymbols[1].test(t.tiers[defaultTier].text)) {
              currentBracketGroup = null
            }
            return true
          } else {
            return false
          }
        }
      })
      if (type === undefined) {
        t.tiers[defaultTier].type = -1
      } else {
        t.tiers[defaultTier].type = type.id
      }
    }
    return t
  })
  return newEs
}
