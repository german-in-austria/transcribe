<template>
  <div :class="{
    selected: isSelected,
    segment: true,
    'theme--dark': settings.darkMode,
    'fragment-of': hasFragmentOfInAnyFirstToken
  }">
    <div
      style="outline: 0;"
      tabindex="-1"
      :class="{
        time: true,
        viewing: isViewingEvent(event)
      }"
      @dblclick="playEvent(event)"
      @mousedown.meta.stop="selectOrDeselectEvent(event)"
      @mousedown.ctrl.stop="selectOrDeselectEvent(event)"
      @mousedown.shift="selectEventRange(event)"
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
        :event="event"
        :speaker="speakerKey"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SpeakerSegmentTranscript from './SpeakerSegmentTranscript.vue'
import _ from 'lodash'

import {
  eventStore,
  deleteSelectedEvents,
  LocalTranscriptEvent,
  selectEvent,
  selectEventRange,
  selectOrDeselectEvent,
  playEvent,
  scrollToAudioEvent,
  toTime
} from '../store/transcript'

import { mutation } from '../store/history'
import { getTextWidth } from '../util'
import settings from '../store/settings'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop({ required: true }) event!: LocalTranscriptEvent
  @Prop({ default: false }) isSelected!: boolean

  eventStore = eventStore
  offsetWidth = 0
  selectOrDeselectEvent = selectOrDeselectEvent
  playEvent = playEvent
  toTime = toTime
  settings = settings
  selectEventRange = selectEventRange

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
    mutation(deleteSelectedEvents())
  }

  getLongestSpeakerText(e: LocalTranscriptEvent): string[]|undefined {
    return _(e.speakerEvents)
      .map(se => se.tokens.map(t => t.tiers[eventStore.metadata.defaultTier].text))
      .sortBy(ts => ts.length)
      .last()
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
  transition border-color .25s
  padding 0 6px
  color #444
  border-color rgba(0,0,0,.15)
  &.theme--dark
    border-color rgba(255,255,255,.2)

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
    transition color .2s
    color #333
  &.error
    color white
  &.viewing
    background #D8DFED
    color #333

.selected .time
  background cornflowerblue
  color white

.speaker-segment
  border-bottom 1px solid rgba(0,0,0,.15)
  height 25px

.theme--dark
  .speaker-segment
    border-bottom 1px solid rgba(255,255,255,.1)

.speaker-segment:last-child
  border-bottom 0
</style>
