<template>
  <div
    @mousedown="selectEvent(event)"
    @dblclick="playSegment(segment)"
    @keydown.meta.enter="$emit('scroll-to-transcript', segment)"
    @keydown.right.stop.prevent="selectNext(segmentKey)"
    @keydown.left.stop.prevent="selectPrevious(segmentKey)"
    @keydown.space.stop.prevent="playSegment(segment)"
    tabindex="-1"
    :class="[ 'segment', isSelected ? 'selected' : '' ]"
    :style="{ left: offset + 'px', width: width + 'px' }">
    <div :style="{ left: width / 2 + 'px' }" class="transcript-tooltip" v-if="isSelected">
      <div class="inner" :key="i" v-for="(se, i) in event.speakerEvents">
        {{ i }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
      </div>
    </div>
    <!-- <slot :segment="segment" /> -->
    <resize-parent
      v-if="isSelected"
      class="resizer"
      resizing-class="resizing"
      @resize-end="onResizeEnd"
      :parent-min-width="12"
      left
    />
    <resize-parent
      v-if="isSelected"
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
import { resizeSegment, findSpeakerEventById, LocalTranscriptEvent, eventStore, selectEvent } from '../store/transcript'
import * as _ from 'lodash'
@Component({
  components: {
    ResizeParent
  }
})
export default class SegmentBox extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() previousSegment?: Segment
  @Prop() nextSegment?: Segment
  @Prop() pixelsPerSecond: number
  @Prop() segmentKey: any

  selectEvent = selectEvent
  eventStore = eventStore

  get isSelected(): boolean {
    return eventStore.selectedEventIds.indexOf(this.event.eventId) > -1
  }

  // @Watch('selectedSegment')
  // selectedSegmentChange() {
  //   this.isSelected = this.selectedSegment !== null && this.selectedSegment.id === this.segment.id
  // }

  getTranscriptSpeakerEvents(id: string): SpeakerEvent|null {
    console.log(id)
    const e = findSpeakerEventById(id)
    console.log(e)
    return e
  }

  get width(): number {
    return (Number(this.event.endTime) - Number(this.event.startTime)) * this.pixelsPerSecond
  }
  get offset(): number {
    return Number(this.event.startTime) * this.pixelsPerSecond
  }
  selectNext(i: number) {
    this.$emit('select-next', i)
  }
  selectPrevious(i: number) {
    this.$emit('select-previous', i)
  }
  selectSegment(segment: Segment) {
    this.$emit('select-segment', segment)
  }
  playSegment(key: number, segment: Segment) {
    this.$emit('play-segment', key, segment)
  }
  deleteSegment(segment: Segment) {
    this.$emit('delete-segment', segment)
  }
  onResizeEnd(e: any) {
    this.event.startTime = e.current.left / this.pixelsPerSecond
    this.event.endTime = e.current.right / this.pixelsPerSecond
    resizeSegment(this.event.eventId!, this.event.startTime, this.event.endTime)
    if (e.next !== null && this.nextSegment !== undefined) {
      this.nextSegment.startTime = e.next.left / this.pixelsPerSecond
      resizeSegment(this.nextSegment.id!, this.nextSegment.startTime, this.nextSegment.endTime)
    }
    if (e.previous !== null && this.previousSegment !== undefined) {
      this.previousSegment.endTime = e.previous.right / this.pixelsPerSecond
      resizeSegment(this.previousSegment.id!, this.previousSegment.startTime, this.previousSegment.endTime)
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
