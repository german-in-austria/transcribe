<template>
  <div
    @click.exact.stop="selectEvent(event)"
    @mousedown.cmdOrCtrl="selectOrDeselectEvent(event)"
    @dblclick="playEvent(event)"
    @keydown.enter.cmdOrCtrl.stop.prevent="playEvent(event)"
    @keydown.enter.exact="scrollToTranscriptEvent(event)"
    tabindex="-1"
    :class="[ 'segment', isEventSelected(event.eventId) ? 'selected' : '', hasOverlap && 'has-overlap' ]"
    :style="{ left: offset + 'px', width: width + 'px' }">
    <div :style="{ left: width / 2 + 'px' }" class="transcript-tooltip" v-if="isEventSelected(event.eventId)">
      <div class="inner" :key="i" v-for="(se, i) in event.speakerEvents">
        {{ eventStore.metadata.speakers[i].k }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
      </div>
    </div>
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
import {
  playEvent,
  resizeSegment,
  LocalTranscriptEvent,
  eventStore,
  selectEvent,
  selectOrDeselectEvent,
  selectNextEvent,
  isEventSelected,
  selectPreviousEvent,
  scrollToTranscriptEvent
} from '../store/transcript'

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
  selectOrDeselectEvent = selectOrDeselectEvent
  eventStore = eventStore
  isEventSelected = isEventSelected
  playEvent = playEvent

  get hasOverlap() {
    const x = (
      this.previousEvent !== undefined &&
      Number(this.previousEvent.endTime.toPrecision(2)) > Number(this.event.startTime.toPrecision(2))
    )
    if (x) {
      console.log('overlap', this.event, this.previousEvent, this.nextEvent)
    }
    return x
  }

  get offset() {
    return Number(this.event.startTime) * this.pixelsPerSecond
  }

  get width(): number {
    return (Number(this.event.endTime) - Number(this.event.startTime)) * this.pixelsPerSecond
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
  padding 2px 10px
  background rgba(50,50,50,.9)
  border-radius 5px
  .inner
    font-weight 300
    white-space nowrap

.segment
  // performance of "Composite Layers"
  will-change left
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
  &.has-overlap
    border 1px dashed #af0202
  &.selected
    z-index 1
    border 2px solid cornflowerblue
    box-shadow 0 0 50px rgba(0,0,0,.4)
    background transparent
    &.has-overlap
      border-color #af0202
  &:hover:not(.selected)
    background transparent
    border-bottom 1px solid rgba(255,255,255,.2)
    border-left 1px solid rgba(255,255,255,.2)
  .resizer
    transition .25s opacity
    opacity 0
  &:hover:not(.resizing) .resizer
    opacity 1

</style>
