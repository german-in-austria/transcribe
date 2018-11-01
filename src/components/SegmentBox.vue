<template>
  <div
    @mousedown="selectEvent(event)"
    @dblclick="playEvent(event)"
    @keydown.meta.enter="scrollToTranscriptEvent(event)"
    @keydown.right.stop.prevent="selectNextEvent()"
    @keydown.left.stop.prevent="selectPreviousEvent()"
    @keydown.space.stop.prevent="playEvent(event)"
    tabindex="-1"
    :class="[ 'segment', isEventSelected(event.eventId) ? 'selected' : '' ]"
    :style="{ left: offset + 'px', width: width + 'px' }">
    <div :style="{ left: width / 2 + 'px' }" class="transcript-tooltip" v-if="isEventSelected(event.eventId)">
      <div class="inner" :key="i" v-for="(se, i) in event.speakerEvents">
        {{ i }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
      </div>
    </div>
    <!-- <slot :segment="segment" /> -->
    <resize-parent
      v-if="isEventSelected(event.eventId)"
      class="resizer"
      resizing-class="resizing"
      @resize-end="onResizeEnd"
      :parent-min-width="12"
      left
    />
    <resize-parent
      v-if="isEventSelected(event.eventId)"
      class="resizer"
      resizing-class="resizing"
      @resize-end="onResizeEnd"
      :parent-min-width="12"
      right
    />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch, Provide } from 'vue-property-decorator'
import Resizer from '@components/helper/Resizer.vue'
import ResizeParent from '@components/helper/ResizeParent.vue'
// tslint:disable-next-line:max-line-length
import { playEvent, resizeSegment, LocalTranscriptEvent, eventStore, selectEvent, selectNextEvent, isEventSelected, selectPreviousEvent, scrollToTranscriptEvent } from '../store/transcript'
import * as _ from 'lodash'
@Component({
  components: {
    ResizeParent
  }
})
export default class SegmentBox extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() previousEvent?: LocalTranscriptEvent
  @Prop() nextEvent?: LocalTranscriptEvent
  @Prop() pixelsPerSecond: number

  scrollToTranscriptEvent = scrollToTranscriptEvent
  selectEvent = selectEvent
  eventStore = eventStore
  selectNextEvent = selectNextEvent
  selectPreviousEvent = selectPreviousEvent
  isEventSelected = isEventSelected
  playEvent = playEvent

  get width(): number {
    return (Number(this.event.endTime) - Number(this.event.startTime)) * this.pixelsPerSecond
  }
  get offset(): number {
    return Number(this.event.startTime) * this.pixelsPerSecond
  }
  deleteEvent(segment: Event) {
    this.$emit('delete-event', event)
  }
  onResizeEnd(e: any) {
    this.event.startTime = e.current.left / this.pixelsPerSecond
    this.event.endTime = e.current.right / this.pixelsPerSecond
    resizeSegment(this.event.eventId!, this.event.startTime, this.event.endTime)
    if (e.next !== null && this.nextEvent !== undefined) {
      this.nextEvent.startTime = e.next.left / this.pixelsPerSecond
      resizeSegment(this.nextEvent.eventId!, this.nextEvent.startTime, this.nextEvent.endTime)
    }
    if (e.previous !== null && this.previousEvent !== undefined) {
      this.previousEvent.endTime = e.previous.right / this.pixelsPerSecond
      resizeSegment(this.previousEvent.eventId!, this.previousEvent.startTime, this.previousEvent.endTime)
    }
  }
}
</script>
<style lang="stylus" scoped>
.transcript-tooltip
  position absolute
  top -40px
  transform translateX(-50%)
  text-align center
  .inner
    font-weight 300
    white-space nowrap

.segment
  min-width 12px
  height 150px
  top 75px
  border-radius 10px
  background rgba(0,0,0,.2)
  position absolute
  border-top 1px solid rgba(255,255,255,.3)
  border-right 1px solid rgba(255,255,255,.2)
  outline 0
  will-change width left
  transform-origin 0 0
  user-select none
  &.selected, &:focus
    z-index 1
    border: 2px solid cornflowerblue
    box-shadow 0 0 50px rgba(0,0,0,.4)
  &:hover:not(.selected)
    background rgba(0,0,0,.3)
  .resizer
    transition .25s opacity
    opacity 0
  &:hover:not(.resizing) .resizer
    opacity 1

</style>
