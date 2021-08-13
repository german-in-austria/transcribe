export interface AudioMetaData {
  url: string
  sampleRate: number
  headers: OggIndex['headers']
  pages: OggIndex['pages']
  bitRate: number
  fileSize: number
  headerBuffer: ArrayBuffer|null
}

export interface OggPage {
  byteOffset: number
  granulePosition: number
  timestamp: number
}

export interface OggHeader {
  byteOffset: number
}

export interface OggIndex {
  pages: OggPage[]
  headers: OggHeader[]
}
