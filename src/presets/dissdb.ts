import { ProjectPreset } from '.'

export const dissDB: ProjectPreset = {
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
      name: 'pause',
      regex: /\[[\s\S]{1,}s\]/u,
      color: '#6B6B6B',
      id: 3
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
      type: 'single',
      name: 'delimiter',
      regex: /^(\?|\.|\,|!)"?/,
      color: '#1717FB',
      id: 2
    },
    {
      type: 'single',
      name: 'interrupted',
      regex: /([a-zA-ZÜüÄäÖöß]+\/)/u,
      color: '#6699CC',
      id: 6
    },
    {
      type: 'single',
      name: 'contraction',
      regex: /_[a-zA-ZÜüÄäÖöß]+|[a-zA-ZÜüÄäÖöß]+_/,
      color: '#d47d0f',
      id: 8
    },
    {
      type: 'group',
      name: 'proper-name',
      bracketSymbols: [
        /(\{(.+))/u,
        /(\{?(.+)\})/u
      ],
      color: '#880000',
      id: 4
    },
    {
      type: 'group',
      name: 'incomprehensible',
      // regex: /\((.+)\)/u,
      bracketSymbols: [
        /\((.+)/u,
        /\(?(.+)\)/u
        // /(\(([a-zA-ZÜüÄäÖöß\?]+))/u,
        // /(\(?[a-zA-ZÜüÄäÖöß]+\))/u
      ],
      color: '#6f6f6f',
      id: 7
    },
    {
      type: 'single',
      name: 'word',
      regex: /^[a-zA-ZÜüÄäÖöß]+/u,
      color: 'transparent',
      id: 1
    }
  ]
}
