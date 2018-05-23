<template>
  <div @keyup.ctrl.space.stop.prevent="handleSpace">
    <wave-form
      @change-metadata="changeMetadata"
      @scroll="handleScroll"
      :scroll-to-segment="scrollToSegment"
      :audio-element="audioElement" >
      <div
        :style="{
          transform: 'translateX(' + playHeadLeft + 'px)'
        }"
        class="play-head">
      </div>
      <segments
        :speaker-events="transcript.speakerEvents"
        @delete-segment="deleteSegment"
        @select-segment="selectSegment"
        @play-segment="playSegment"
        :selected-segment="selectedSegmentId"
        :metadata="metadata"
        :segments="visibleSegments">
        <template slot-scope="segment">
          <!-- <div>
            <v-btn icon class="jump-to" round flat><v-icon>text_fields</v-icon></v-btn>
          </div> -->
        </template>
      </segments>
    </wave-form>
    <!-- <h3 class="text-xs-center">
      <div
        v-for="(speaker, key) in transcript.speakerEvents[selectedSegmentId]"
        :key="key"
        v-if="selectedSegmentId !== null">
        <span>{{ key }}: </span>
        <span :key="key" v-for="(token, key) in speaker.tokens">
          {{ token }}
        </span>
      </div>
    </h3> -->
    <div v-if="transcript.segments && transcript.speakers && transcript.speakerEvents" class="tracks">
      <div
        v-for="(chunk, i) in chunkedSegments"
        :key="i"
        class="segment-chunk">
        <div
          v-for="segment in chunk"
          :key="segment.id"
          :class="['segment', segment.id === selectedSegmentId && 'segment-selected']">
          <div class="time" @dblclick="playSegment(0, segment)" @mousedown="selectAndScrollToSegment(segment)">
            {{ toTime(segment.startTime) }} - {{ toTime(segment.endTime) }}
          </div>
          <div
            class="speaker-segment"
            v-for="(speaker, key) in transcript.speakers"
            :key="key">
            <segment-editor
              v-if="
                transcript.speakerEvents[segment.id] !== undefined &&
                transcript.speakerEvents[segment.id][speaker] !== undefined &&
                transcript.speakerEvents[segment.id][speaker].tokens !== undefined"
              class="tokens"
              :tokens="transcript.speakerEvents[segment.id][speaker].tokens"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import waveForm from './Waveform.vue'
import { Transcript } from './App.vue'
import segments from '@components/Segments.vue'
import segmentEditor from '@components/SegmentEditor.vue'
import * as _ from 'lodash'
import * as fns from 'date-fns'

@Component({
  components: {
    waveForm,
    segments,
    segmentEditor
  }
})
export default class Editor extends Vue {

  @Prop() audioElement: HTMLAudioElement
  @Prop() transcript: Transcript
  segmentBufferPercent = .025
  metadata: any = null
  boundLeft = 0
  boundRight = 10
  selectedSegmentId: string|null = null
  playHeadLeft = 0
  scrollToSegment: Segment|null = null

  selectAndScrollToSegment(segment: Segment) {
    this.selectSegment(segment)
    this.$nextTick(() => {
      this.scrollToSegment = segment
    })
  }

  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }

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
    }, 10)
  }

  selectSegment(segment: Segment) {
    this.selectedSegmentId = segment.id || null
  }

  deleteSegment(key: number, segment: Segment) {
    const i = _(this.transcript.segments).findIndex(s => s.id === segment.id)
    this.transcript.segments.splice(i, 1)
  }

  get visibleSegments() {
    return _(this.transcript.segments).filter((s) => {
      return s.startTime > this.boundLeft && s.endTime < this.boundRight
    }).value()
  }

  changeMetadata(metadata: any) {
    console.log({metadata})
    this.bindPlayHead()
    this.metadata = metadata
  }

  bindPlayHead() {
    this.audioElement.addEventListener('timeupdate', (e) => {
      this.playHeadLeft = (e.target as any).currentTime * this.pixelsPerSecond
    })
  }

  get chunkedSegments() {
    return [_(this.transcript.segments).chunk(250).value()[0]]
  }

  get pixelsPerSecond() {
    if ( this.metadata.totalWidth !== null) {
      return this.metadata.totalWidth / this.audioElement.duration
    } else {
      return 0
    }
  }

}
</script>
<style lang="stylus" scoped>
.play-head
  width 3px
  background red
  height 100%
  position absolute
  top 0
  bottom 0

.tracks
  white-space nowrap
  overflow-x scroll
  padding 10px 40px 20px 40px

.segment
  display inline-block
  vertical-align top
  border-right 1px solid #ddd
  padding 0 6px
  color #444

.segment-selected
  color #000
  .token-type-indicator
    opacity 1
  .time
    color #333

.speaker-segment
  display block
  min-height 2em

.segment-chunk
  display inline-block

.time
  cursor default
  font-size 85%
  color #ccc
  text-align center

.jump-to
  opacity 0
  positon absolute
  top 5px
  right 5px
</style>
