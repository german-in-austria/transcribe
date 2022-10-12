import Vue from 'vue'
const bus = new Vue()

export type BusEvent =
  'scrollWaveform'|
  'scrollTranscript'|
  'scrollToTranscriptEvent'|
  'scrollToAudioEvent'|
  'scrollToAudioTime'|
  'updateWaveformScrollbar'|
  'playAudio'|
  'pauseAudio'|
  'scrubAudio'|
  'updateTime'|
  'focusSearch'|
  'updateSpeakerEventText'|
  'updateSeeking'

export default bus as {
  $on: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $off: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $emit: (e: BusEvent, p?: any, opts?: any) => void
}
