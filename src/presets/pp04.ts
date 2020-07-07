
import { ProjectPreset } from '.'

export const PP04: ProjectPreset = {
  tokenizer: (s) => {
    return s
      .split('_').join('_ _')
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
      type: 'single',
      name: 'untransferable-lexics',
      regex: /(_)([a-zA-ZÜüÄäÖöß']+)(_)/,
      color: '#FFAF3C',
      id: 8
    },
    {
      type: 'group',
      name: 'anonymized',
      bracketSymbols: [
        /(\[([a-zA-ZÜüÄäÖöß\.;,:\?-]+))/u,
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
    // TODO: show as error
    {
      type: 'group',
      name: '',
      bracketSymbols: [
        /<<\S+>/u,
        /^[^<<].+>/u
      ],
      color: 'orange',
      id: 4 // other
    },
    // basic word tokens in GAT-2 can include
    // markers for pitch, like ".", ":", etc.
    {
      type: 'single',
      name: 'word',
      regex: /^([a-zA-ZÜüÄäÖöß\.;,:\?-]+$)/u,
      color: 'transparent',
      id: 1
    },
  ]
}
