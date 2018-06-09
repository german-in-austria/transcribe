
interface AudioState {
  audioElement: HTMLAudioElement|null
  audioUrl: string|null
}

const audioState: AudioState = {
  audioElement: null,
  audioUrl: null
}

export default audioState
