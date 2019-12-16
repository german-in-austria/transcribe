import Vue from 'vue'
const EventBus = new Vue()

export type BusEvent =
  'scrollWaveform'|
  'scrollTranscript'|
  'scrollToTranscriptEvent'|
  'scrollToAudioEvent'|
  'updateWaveformScrollbar'|
  'playAudio'|
  'pauseAudio'|
  'scrubAudio'|
  'updateTime'|
  'focusSearch'

export default EventBus as {
  $on: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $off: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $emit: (e: BusEvent, p?: any, opts?: any) => void
}
