
import { PP04 } from './pp04'
import { PP03 } from './pp03'
import { dissDB } from './dissdb'

export type ProjectPresetName = 'PP03'|'dissDB'|'PP04'

export type ProjectPresets = {
  [name in ProjectPresetName]: ProjectPreset
}

export interface ProjectPreset {
  tokenizer: (utterance: string) => string[]
  importTransformer?: (utterance: string, tierType: 'tokenized'|'freeText'|'default'|null) => string
  tokenTypes: Array<TokenTypesPresetGroup | TokenTypesPresetSingle>
  autoCorrectDelimiterSpace: boolean
  autoCorrectDelimiterSpaceRegex: RegExp
}

export interface TokenTypePresetBase {
  name: string
  color: string
  id: number
}

export interface TokenTypesPresetSingle extends TokenTypePresetBase {
  type: 'single'
  regex: RegExp
}

export interface TokenTypesPresetGroup extends TokenTypePresetBase {
  type: 'group'
  bracketSymbols: [ RegExp, RegExp ]
}

export default { PP04, PP03, dissDB } as ProjectPresets
