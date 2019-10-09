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
import { getTextWidth } from '../util'
import settings from '../store/settings'

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
  @Prop() width?: number

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

  isViewingEvent(e?: LocalTranscriptEvent) {
    return (
      e !== null &&
      e !== undefined &&
      eventStore.userState.viewingTranscriptEvent !== null &&
      eventStore.userState.viewingTranscriptEvent !== undefined &&
      eventStore.userState.viewingTranscriptEvent.eventId === e.eventId
    )
  }

  deleteSelectedEvents() {
    undoable(deleteSelectedEvents())
  }

  getLongestSpeakerText(e: LocalTranscriptEvent): string[]|undefined {
    return _(e.speakerEvents)
      .map(se => se.tokens.map(t => t.tiers[eventStore.metadata.defaultTier].text))
      .sortBy(ts => ts.length)
      .last()
  }

  created() {
    // if (this.width === undefined) {
    const totalPadding = 20
    const longestText = this.getLongestSpeakerText(this.event)
    if (longestText !== undefined) {
      this.offsetWidth = Math.max(getTextWidth(longestText.join(' '), 14, 'HKGrotesk') + totalPadding, 146)
      this.$emit('element-render', this.offsetWidth)
    }
    // }
  }

  mounted() {
    // // if the width argument is undefined, that means it’s never been rendered.
    // if (this.width === undefined) {
    //   // compute the width (perform layout op)
    //   this.offsetWidth = (this.$el as HTMLElement).offsetWidth + 1
    //   console.log(this.event.eventId, 'offsetWidth', this.offsetWidth)
    //   console.log(this.event.eventId, 'BrowserText', this.bw)
    // // if it’s set, we’ll just reuse the width from the last time it was rendered.
    // } else {
    //   this.offsetWidth = this.width
    // }
    // // emit the new width
    // this.$emit('element-render', this.offsetWidth)
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
