
export interface Settings {
  emulateHorizontalScrolling: boolean,
  darkMode: boolean,
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
  darkMode: true,
  emulateHorizontalScrolling: true,
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
