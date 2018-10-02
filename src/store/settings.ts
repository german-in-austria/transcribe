
export interface Settings {
  lockScroll: boolean,
  emulateHorizontalScrolling: boolean,
  darkMode: boolean,
  showSegmentBoxes: boolean,
  showSpectograms: boolean,
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
  lockScroll: false,
  darkMode: true,
  emulateHorizontalScrolling: true,
  showSegmentBoxes: true,
  showSpectograms: false,
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
