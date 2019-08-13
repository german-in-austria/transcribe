<template>
  <div :class="{
    selected: isSelected,
    segment: true,
    'fragment-of': hasFragmentOfInAnyFirstToken
  }">
    <div
      style="outline: 0;"
      tabindex="-1"
      :class="{
        time: true,
        error: hasErrors,
        viewing: isViewingEvent(event)
      }"
      @keydown.enter.meta="playEvent(event)"
      @keydown.delete.exact="deleteSelectedEvents"
      @keydown.backspace.exact="deleteSelectedEvents"
      @dblclick="playEvent(event)"
      @mousedown.meta.stop="selectOrDeselectEvent(event)"
      @mousedown.exact="selectAndScrollToEvent(event)">
      {{ toTime(event.startTime) }} - {{ toTime(event.endTime) }}
    </div>
    <!-- <div class="connect-fragments">
      <div class="ball-left" />
      <div class="connection" />
      <div class="ball-right" />
    </div> -->
    <div
      class="speaker-segment"
      :style="{ height: speakerHeight }"
      v-for="(speaker, speakerKey) in eventStore.metadata.speakers"
      :key="speakerKey">
      <speaker-segment-transcript
        @focus="(e, event) => $emit('focus', e, event)"
        class="tokens"
        :index="index"
        :previous-event="previousEvent"
        :next-event="nextEvent"
        :event="event"
        :speaker="speakerKey"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from './SpeakerSegmentTranscript.vue'
import * as _ from 'lodash'

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

import { undoable } from '../store/history'
import settings from '../store/settings';

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() nextEvent: LocalTranscriptEvent|undefined
  @Prop() previousEvent: LocalTranscriptEvent|undefined
  @Prop({ default: false }) isSelected: boolean
  @Prop() index: number

  eventStore = eventStore
  offsetWidth = 0
  selectOrDeselectEvent = selectOrDeselectEvent
  playEvent = playEvent
  toTime = toTime

  get speakerHeight() {
    return eventStore.metadata.tiers.filter(t => t.show === true).length * 25 + 'px'
  }

  get hasFragmentOfInAnyFirstToken(): boolean {
    return _(this.event.speakerEvents).some((speakerEvent) => {
      return speakerEvent.tokens[0] !== undefined && speakerEvent.tokens[0].fragmentOf !== null
    })
  }

  isViewingEvent(e: LocalTranscriptEvent) {
    return eventStore.userState.viewingTranscriptEvent !== null
      && eventStore.userState.viewingTranscriptEvent.eventId === e.eventId
  }

  deleteSelectedEvents() {
    undoable(deleteSelectedEvents())
  }

  mounted() {
    this.offsetWidth = (this.$el as HTMLElement).offsetWidth + 1
    this.$emit('element-render', this.offsetWidth)
  }

  get hasErrors() {
    return speakerEventHasErrors(this.event)
  }

  beforeDestroy() {
    this.$emit('element-unrender', this.offsetWidth)
  }

  selectAndScrollToEvent(e: LocalTranscriptEvent) {
    if (!settings.lockScroll) {
      scrollToAudioEvent(e)
    }
    selectEvent(e)
  }
}
</script>
<style lang="stylus" scoped>
.segment
  display inline-block
  vertical-align top
  border-left 1px solid
  border-color rgba(255,255,255,.2)
  transition border-color .25s
  padding 0 6px
  color #444

.segment.fragment-of
  border-color rgba(255,255,255,0)

.connect-fragments
  position absolute
  top -3px
  opacity .4
  transform translateX(-73%)
  .ball-left, .ball-right
    width 8px
    height 8px
    background white
    border-radius 100%
    display inline-block
  .ball-left
    margin-right -4px
  .connection
    display inline-block
    height 3px
    background white
    width 15px
    position relative
    top -2px
    margin-right -5px
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
  &.viewing
    background #ccc
    color #333

.selected .time
  background cornflowerblue
  color white

.speaker-segment
  border-bottom 1px solid rgba(255,255,255,.1)
  height 25px

.speaker-segment:last-child
  border-bottom 0
</style>
