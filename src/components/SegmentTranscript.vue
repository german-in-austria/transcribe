<template>
  <div :class="{ selected: isSelected }">
    <div
      style="outline: 0;"
      tabindex="-1"
      class="time"
      @keydown.delete="deleteSegment(event)"
      @dblclick="$emit('play-event', event)"
      @mousedown.meta.stop="addEventsToSelection([ event ])"
      @mousedown="selectAndScrollToEvent(event)">
      {{ toTime(event.startTime) }} - {{ toTime(event.endTime) }}
    </div>
    <div
      class="speaker-segment"
      v-for="(speaker, key) in speakers"
      :key="key">
      <speaker-segment-transcript
        class="tokens"
        :segment="event"
        :speaker="key"
        :tokens="getTokens(speaker)"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from '@components/SpeakerSegmentTranscript.vue'
import { deleteSegment, LocalTranscriptEvent, selectEvent, addEventsToSelection } from '../store/transcript'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() segment: Segment
  @Prop() speakers: any[]
  @Prop() speakerEvent: SpeakerEvent
  @Prop({ default: false }) isSelected: boolean

  offsetWidth = 0
  deleteSegment = deleteSegment
  addEventsToSelection = addEventsToSelection

  mounted() {
    this.offsetWidth = this.$el.offsetWidth + 1
    this.$emit('element-render', this.offsetWidth)
  }

  getTokens(speaker: string): string[] {
    if (this.event && this.event.speakerEvents[speaker]) {
      return this.event.speakerEvents[speaker].tokens.map(t => t.tiers.default.text)
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
  selectAndScrollToEvent(event: LocalTranscriptEvent) {
    selectEvent(event)
  }
  // selectAndScrollToSegment(segment: Segment) {
  //   this.$emit('scroll-to-segment', segment)
  // }
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
  background: #174cff;
  color: white;
  border-radius: 10px;
</style>
