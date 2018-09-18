<template>
  <div>
    <div class="time" @dblclick="$emit('play-segment', segment)" @mousedown="selectAndScrollToSegment(segment)">
      {{ toTime(segment.startTime) }} - {{ toTime(segment.endTime) }}
    </div>
    <div
      class="speaker-segment"
      v-for="(speaker, key) in speakers"
      :key="key">
      <speaker-segment-transcript
        v-if="
          speakerEvent !== undefined &&
          speakerEvent[speaker] !== undefined &&
          speakerEvent[speaker].tokens !== undefined"
        class="tokens"
        :tokens="speakerEvent[speaker].tokens"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from '@components/SpeakerSegmentTranscript.vue'
import { SpeakerEvent } from '@components/App.vue'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop() segment: Segment
  @Prop() speakers: any[]
  @Prop() speakerEvent: SpeakerEvent

  offsetWidth = 0

  mounted() {
    this.offsetWidth = this.$el.offsetWidth + 1
    this.$emit('element-render', this.offsetWidth)
  }

  beforeDestroy() {
    this.$emit('element-unrender', this.offsetWidth)
  }

  emitDimensions() {
    requestAnimationFrame(() => {
      this.offsetWidth = this.$el.offsetWidth + 1
    })
  }

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
.time
  cursor default
  font-size 85%
  color #aaa
  text-align center
</style>
