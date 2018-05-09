<template>
  <div @keyup.ctrl.space.stop.prevent="handleSpace">
    <wave-form
      @change-metadata="changeMetadata"
      @scroll="handleScroll"
      :data="true"
      :audio-element="audioElement" >
      <segments
        :speaker-events="transcript.speakerEvents"
        @delete-segment="deleteSegment"
        @select-segment="selectSegment"
        @play-segment="playSegment"
        :selected-segment="selectedSegmentId"
        :metadata="metadata"
        :segments="visibleSegments">
        <template slot-scope="segment">
          <div class="segment-inner"></div>
        </template>
      </segments>
    </wave-form>
    <h3 class="text-xs-center">
      <div
        v-for="(speaker, key) in transcript.speakerEvents[selectedSegmentId]"
        :key="key"
        v-if="selectedSegmentId !== null">
        <span>{{ key }}: </span>
        <span :key="key" v-for="(token, key) in speaker.tokens">
          {{ token }}
        </span>
      </div>
    </h3>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import waveForm from './Waveform.vue'
import { Transcript } from './App.vue'
import segments from '@components/Segments.vue'
import * as _ from 'lodash'

@Component({
  components: {
    waveForm,
    segments
  }
})
export default class  extends Vue {
  @Prop() audioElement: HTMLAudioElement
  @Prop() transcript: Transcript
  segmentBufferPercent = .05
  metadata: any = null
  boundLeft = 0
  boundRight = 10
  selectedSegmentId: string|null = null

  handleScroll(e: Event) {
    const el = (e.target as HTMLElement)
    const scrollFactorLeft = el.scrollLeft / el.scrollWidth
    const scrollFactorRight = (el.scrollLeft + el.clientWidth) / el.scrollWidth
    this.boundLeft = this.audioElement.duration * (scrollFactorLeft - this.segmentBufferPercent),
    this.boundRight = this.audioElement.duration * (scrollFactorRight + this.segmentBufferPercent)
  }

  playSegment(key: number, segment: Segment) {
    this.audioElement.currentTime = segment.startTime
    this.audioElement.play()
    const interval = setInterval(() => {
      if (this.audioElement.currentTime >= segment.endTime) {
        this.audioElement.pause()
        clearInterval(interval)
      }
    }, 5)

  }

  selectSegment(key: number, segment: Segment) {
    this.selectedSegmentId = segment.id || null
  }

  deleteSegment(key: number, segment: Segment) {
    const i = _(this.transcript.segments).findIndex(s => s.id === segment.id)
    this.transcript.segments.splice(i, 1)
  }

  get visibleSegments() {
    console.log(this.boundLeft, this.boundRight)
    return _(this.transcript.segments).filter((s) => {
      return s.startTime > this.boundLeft && s.endTime < this.boundRight
    }).value()
  }

  changeMetadata(metadata: any) {
    console.log({metadata})
    this.metadata = metadata
  }
}
</script>
<style lang="scss" scoped>
</style>
