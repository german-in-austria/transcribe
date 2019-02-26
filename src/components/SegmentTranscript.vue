<template>
  <div :class="{ selected: isSelected }">
    <div
      style="outline: 0;"
      tabindex="-1"
      :class="{time: true, error: hasErrors}"
      @keydown.enter.meta="playEvent(event)"
      @keydown.delete="deleteSelectedEvents"
      @dblclick="playEvent(event)"
      @mousedown.meta.stop="selectOrDeselectEvent(event)"
      @mousedown.exact="selectAndScrollToEvent(event)">
      {{ toTime(event.startTime) }} - {{ toTime(event.endTime) }}
    </div>
    <div
      class="speaker-segment"
      :style="{ height: speakerHeight }"
      v-for="(speaker, speakerKey) in eventStore.metadata.speakers"
      :key="speakerKey">
      <speaker-segment-transcript
        @focus="(e, event) => $emit('focus', e, event)"
        class="tokens"
        :next-event="nextEvent"
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
  selectOrDeselectEvent,
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
  @Prop() nextEvent: LocalTranscriptEvent|undefined
  @Prop({ default: false }) isSelected: boolean

  eventStore = eventStore
  offsetWidth = 0
  deleteSelectedEvents = deleteSelectedEvents
  selectOrDeselectEvent = selectOrDeselectEvent
  playEvent = playEvent
  toTime = toTime

  get speakerHeight() {
    return eventStore.metadata.tiers.filter(t => t.show === true).length * 25 + 'px'
  }

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
  min-width 133px
  display block
  margin 0 auto
  padding 0 1em
  border-radius 10px
  &:hover
    background rgba(255,255,255,.1)
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
