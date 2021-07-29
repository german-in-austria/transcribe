import { AudioFileOrUrl } from './transcript.class'

export class AudioStore {
  constructor(a: AudioFileOrUrl) {
    if (a instanceof File) {
      this.addBuffer(a)
    }
  }

  async addBuffer(f: File) {
    this.buffer = new Uint8Array(await f.arrayBuffer())
  }

  CtxClass: any = (window as any).AudioContext || (window as any).webkitAudioContext
  context: AudioContext = new this.CtxClass()
  audioElement = document.createElement('audio')
  bufferSrc = this.context.createBufferSource()
  buffer = new Uint8Array(0)
}
