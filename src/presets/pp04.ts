
import { ProjectPreset } from '.'

export const PP04: ProjectPreset = {
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
      type: 'group',
      name: 'anonymized',
      bracketSymbols: [
        /(\[([a-zA-ZÜüÄäÖöß'\?]+))/u,
        /(.+\](N|NZ|O|OP|OA|OS|P|Z))/,
      ],
      color: '#880000',
      id: 10
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
      name: 'non-verbal',
      bracketSymbols: [
        /\(\((.+)|\[(.+)/u,
        /(.+)\)\)|(.+)\]/u
      ],
      color: '#008800',
      id: 5
    }
  ]
}
