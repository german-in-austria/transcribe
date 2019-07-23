import Vue from 'vue'
const EventBus = new Vue()

export type BusEvent =
  'scrollWaveform'|
  'scrollTranscript'|
  'playAudio'|
  'pauseAudio'|
  'playEvents'|
  'scrubAudio'|
  'updateTime'

export default EventBus as {
  $on: (e: BusEvent, fn: (e: any) => any) => void
  $off: (e: BusEvent, fn: (e: any) => any) => void
  $emit: (e: BusEvent, p: any) => void
}
