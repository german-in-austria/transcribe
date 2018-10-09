<template>
  <div :class="{ selected: isSelected }">
    <div class="time" @dblclick="$emit('play-segment', segment)" @mousedown="selectAndScrollToSegment(segment)">
      {{ toTime(segment.startTime) }} - {{ toTime(segment.endTime) }}
    </div>
    <div
      class="speaker-segment"
      v-for="(speaker, key) in speakers"
      :key="key">
      <speaker-segment-transcript
        class="tokens"
        :segment="segment"
        :speaker="key"
        :tokens="getTokens(speaker)"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from '@components/SpeakerSegmentTranscript.vue'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop() segment: Segment
  @Prop() speakers: any[]
  @Prop() speakerEvent: SpeakerEvent
  @Prop({ default: false }) isSelected: boolean

  offsetWidth = 0

  mounted() {
    this.offsetWidth = this.$el.offsetWidth + 1
    this.$emit('element-render', this.offsetWidth)
  }

  getTokens(speaker: string): string[] {
    if (this.speakerEvent && this.speakerEvent[speaker] && this.speakerEvent[speaker].tokens) {
      return this.speakerEvent[speaker].tokens
    } else {
      return []
    }
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
  user-select none
  cursor default
  font-size 85%
  color #aaa
  text-align center
  width 133px
  display: block;
  margin: 0 auto;
  padding: 0 1em;

.selected .time
  background: #426198;
  color: white;
  border-radius: 10px;
</style>
