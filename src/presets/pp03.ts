import { ProjectPreset } from '.'

export const PP03: ProjectPreset = {
  autoCorrectDelimiterSpace: true,
  autoCorrectDelimiterSpaceRegex: /\b(\/?[\.|\?|\,|\!])\B/g,
  tokenizer: (s) => {
    return s
      .split('.').join(' .')
      .split(', ').join(' , ')
      .split('-').join('_ _')
      .split('? ').join(' ? ')
      .split(' ')
      .filter(t => t !== '')
  },
  tokenTypes: [
    {
      type: 'single',
      name: 'segments-unclear',
      regex: /(\*)([a-zA-ZÜüÄäÖöß']+)(\*)/,
      color: '#6B6B6B',
      id: 9
    },
    {
      type: 'single',
      name: 'untransferable-lexics',
      regex: /(_)([a-zA-ZÜüÄäÖöß']+)(_)/,
      color: '#FFAF3C',
      id: 8
    },
    {
      type: 'single',
      name: 'interrupted',
      regex: /([a-zA-ZÜüÄäÖöß']+\/$)|(\/[a-zA-ZÜüÄäÖöß']+$)/u,
      color: '#6699CC',
      id: 6
    },
    {
      type: 'single',
      name: 'pause',
      regex: /\(\((([a-zA-ZÜüÄäÖöß']+)|(\d+(,\d)?s|))\)\)/u,
      color: '#6B6B6B',
      id: 3
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
        /(\[([a-zA-ZÜüÄäÖöß'\?]+))/u,
        /(.+\](N|O|Z|S))/,
      ],
      color: '#880000',
      id: 10
    },
    {
      type: 'single',
      name: 'other',
      regex: /\{([a-zA-ZÜüÄäÖöß']+)\}/u,
      color: '#880000',
      id: 4
    },
    {
      type: 'single',
      name: 'delimiter',
      regex: /^(\/)?(\?|\.|\,|!)"?$/,
      color: '#1717FB',
      id: 2
    },
    {
      type: 'single',
      name: 'word',
      regex: /^([a-zA-ZÜüÄäÖöß'"\-]+$)/u,
      color: 'transparent',
      id: 1
    },
  ],
}
