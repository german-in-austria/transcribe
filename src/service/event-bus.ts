import Vue from 'vue'
const EventBus = new Vue()

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
  'updateSpeakerEventText'

export default EventBus as {
  $on: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $off: (e: BusEvent|BusEvent[], fn: (e: any, opts?: any) => any) => void
  $emit: (e: BusEvent, p?: any, opts?: any) => void
}
