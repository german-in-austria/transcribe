
export interface Settings {
  keyboardShortcuts: {
    [s: string]: {
      modifier: string
      key: string
      name: string
      description: string
    }
  }
}

const settings: Settings = {
  keyboardShortcuts: {
    split: {
      modifier: 'meta',
      key: '',
      name: 'Split Segment',
      description: 'Split a segment at the current play-head position.'
    }
  }
}

export default settings
