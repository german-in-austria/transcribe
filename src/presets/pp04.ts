
import { ProjectPreset } from '.'

export const PP04: ProjectPreset = {
  autoCorrectDelimiterSpace: false,
  autoCorrectDelimiterSpaceRegex: /\b(\/?[\.|\?|\;|\-|\,|\!])\B/g,
  tokenizer: (s) => {
    return s
      .split('_').join('_ _')
      .split('. ').join(' . ')
      .split('- ').join(' - ')
      .split('; ').join(' ; ')
      .split(', ').join(' , ')
      .split('? ').join(' ? ')
      .split(' ')
      .filter(t => t !== '')
  },
  tokenTypes: [
    {
      type: 'single',
      color: '#ccc',
      id: 3,
      regex: /\((((\.|-)+)|(\d+(.\d)?))\)/u,
      name: 'pause'
    },
    {
      type: 'group',
      name: 'incomprehensible',
      bracketSymbols: [
        /(\(([a-zA-ZÜüÄäÖöß'\?]+))/u,
        /((.+)\))/u
      ],
      color: '#ccc',
      id: 7
    },
    {
      type: 'group',
      name: 'anonymized',
      bracketSymbols: [
        /(\[([a-zA-ZÜüÄäÖöß\.;:-]+))/u,
        /(.+\](N|NZ|O|OP|OA|OS|P|Z))/,
      ],
      color: '#880000',
      id: 10
    },
    {
      type: 'group',
      name: 'non-verbal',
      bracketSymbols: [
        /\(\((.+)|\[(.+)/u,
        /(.+)\)\)|(.+)\]/u
      ],
      color: '#008800',
      id: 5
    },
    {
      type: 'group',
      name: 'other',
      bracketSymbols: [
        /\(\(.+[^\)]/u,
        /[^\(\(].+\)\)/u
      ],
      color: 'gray',
      id: 4
    },
    {
      type: 'single',
      name: 'contraction',
      regex: /_[a-zA-ZÜüÄäÖöß\.;:-]+|[a-zA-ZÜüÄäÖöß\.;:-]+_/,
      color: '#d47d0f',
      id: 8
    },
    {
      type: 'single',
      name: 'delimiter',
      regex: /^(\/)?(\?|\,|-|!|;|\.)"?$/,
      color: '#1717FB',
      id: 2
    },
    // basic word tokens in GAT-2 can include
    // markers for pitch, like ".", ":", etc.
    {
      type: 'single',
      name: 'word',
      regex: /^([a-zA-ZÜüÄäÖöß\.;:-]+$)/u,
      color: 'transparent',
      id: 1
    },
  ]
}
