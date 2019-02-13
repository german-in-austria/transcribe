<template>
  <div :class="{ selected: isSelected }">
    <div
      style="outline: 0;"
      tabindex="-1"
      :class="{time: true, error: hasErrors}"
      @keydown.delete="deleteSelectedEvents"
      @dblclick="playEvent(event)"
      @mousedown.meta.stop="addEventsToSelection([ event ])"
      @mousedown.exact="selectAndScrollToEvent(event)">
      {{ toTime(event.startTime) }} - {{ toTime(event.endTime) }}
    </div>
    <div
      class="speaker-segment"
      v-for="(speaker, speakerKey) in eventStore.metadata.speakers"
      :key="speakerKey">
      <speaker-segment-transcript
        class="tokens"
        :event="event"
        :speaker="speakerKey"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from '@components/SpeakerSegmentTranscript.vue'

import {
  eventStore,
  deleteSelectedEvents,
  LocalTranscriptEvent,
  selectEvent,
  addEventsToSelection,
  playEvent,
  scrollToAudioEvent,
  speakerEventHasErrors,
  toTime
} from '../store/transcript'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop({ default: false }) isSelected: boolean

  eventStore = eventStore
  offsetWidth = 0
  deleteSelectedEvents = deleteSelectedEvents
  addEventsToSelection = addEventsToSelection
  playEvent = playEvent
  toTime = toTime

  mounted() {
    this.offsetWidth = this.$el.offsetWidth + 1
    this.$emit('element-render', this.offsetWidth)
  }

  get hasErrors() {
    return speakerEventHasErrors(this.event)
  }

  beforeDestroy() {
    this.$emit('element-unrender', this.offsetWidth)
  }

  selectAndScrollToEvent(e: LocalTranscriptEvent) {
    scrollToAudioEvent(e)
    selectEvent(e)
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
  display block
  margin 0 auto
  padding 0 1em
  border-radius 10px
  &.error
    color white

.selected .time
  background cornflowerblue
  color white

.speaker-segment
  border-bottom 1px solid rgba(255,255,255,.1)
  height 25px

.speaker-segment:last-child
  border-bottom 0
</style>
