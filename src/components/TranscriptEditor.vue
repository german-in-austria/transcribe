<template>
  <div v-if="
    transcript.segments &&
    transcript.speakers &&
    transcript.speakerEvents" class="tracks">
    <div
      v-for="(chunk, i) in chunkedSegments"
      :key="i"
      class="segment-chunk">
      <div
        v-for="segment in chunk"
        :key="segment.id"
        :class="['segment', segment.id === selectedSegment.id && 'segment-selected']">
        <div class="time" @dblclick="$emit('play-segment', 0, segment)" @mousedown="selectAndScrollToSegment(segment)">
          {{ toTime(segment.startTime) }} - {{ toTime(segment.endTime) }}
        </div>
        <div
          class="speaker-segment"
          v-for="(speaker, key) in transcript.speakers"
          :key="key">
          <segment-transcript
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
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Transcript } from '@components/App.vue'
import segmentTranscript from '@components/SegmentTranscript.vue'

@Component({
  components: {
    segmentTranscript
  }
})
export default class TranscriptEditor extends Vue {
  @Prop() transcript: Transcript
  @Prop() selectedSegment: Segment
  chunkedSegments: Segment[][] = [ this.transcript.segments.slice(0, 400) ]
  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }
  selectAndScrollToSegment(segment: Segment) {
    this.$emit('select-segment', segment)
    this.$emit('scroll-to-segment', segment)
  }
}
</script>

<style lang="stylus" scoped>
.segment
  display inline-block
  vertical-align top
  border-right 1px solid rgba(255,255,255,.1)
  padding 0 6px
  color #444

.segment-selected
  color #000
  .token-type-indicator
    opacity 1
  .time
    color #ddd

.speaker-segment
  display block
  min-height 2em

.segment-chunk
  display inline-block

.time
  cursor default
  font-size 85%
  color #aaa
  text-align center

</style>
