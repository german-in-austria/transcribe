<template>
  <div :class="{
    'selected': isSelected,
    'segment': true,
    'theme--dark': settings.darkMode,
    'fragment-of': hasFragmentOfInAnyFirstToken
  }">
    <div
      style="outline: 0;"
      tabindex="-1"
      :class="{
        'time': true,
        'viewing': isViewingEvent
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
      v-for="(speaker, speakerKey) in this.transcript.meta.speakers"
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
import { Vue, Component, Prop } from 'vue-property-decorator'
import SpeakerSegmentTranscript from './SpeakerSegmentTranscript.vue'
import _ from 'lodash'

import {
  TranscriptEvent
} from '@/types/transcript'

import settings from '../store/settings.store'
import { timeFromSeconds } from '@/util'
import store from '@/store'

@Component({
  components: {
    SpeakerSegmentTranscript
  }
})
export default class SegmentTranscript extends Vue {

  @Prop({ required: true }) event!: TranscriptEvent
  @Prop({ default: false }) isSelected!: boolean

  transcript = store.transcript!
  offsetWidth = 0
  selectOrDeselectEvent = this.transcript.selectOrDeselectEvent
  playEvent = this.transcript.audio?.playEvent
  toTime = timeFromSeconds
  settings = settings
  selectEventRange = this.transcript.selectEventRange

  get speakerHeight() {
    return this.transcript.meta.tiers.filter(t => t.show === true).length * 25 + 'px'
  }

  get hasFragmentOfInAnyFirstToken(): boolean {
    return _(this.event.speakerEvents).some((speakerEvent) => {
      return speakerEvent.tokens[0] !== undefined && speakerEvent.tokens[0].fragmentOf !== null
    })
  }

  get isViewingEvent() {
    return (
      this.event !== null &&
      this.event !== undefined &&
      this.transcript.uiState.highlightedEventIds.indexOf(this.event.eventId) > -1
    )
  }

  selectAndScrollToEvent(e: TranscriptEvent) {
    if (!settings.lockScroll) {
      this.transcript.scrollToAudioEvent(e)
    }
    this.transcript.selectEvent(e)
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
