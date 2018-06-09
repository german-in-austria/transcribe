<template>
  <div
    @mousedown="selectSegment(segment)"
    @dblclick="playSegment(segmentKey, segment)"
    @keyup.delete="deleteSegment(segmentKey, segment)"
    @keyup.right.stop.prevent="selectNext(segmentKey)"
    @keyup.left.stop.prevent="selectPrevious(segmentKey)"
    @keyup.space.stop.prevent="playSegment(segmentKey, segment)"
    tabindex="-1"
    :class="[ 'segment', selectedSegment.id === segment.id ? 'selected' : '' ]"
    :style="style">
    <div class="segment-background" />
    <slot :segment="segment" />
    <resizer
      v-if="selectedSegment.id === segment.id"
      @resize="throttledResizeLeft"
      :elsize="width"
      side="left"/>
    <resizer
      v-if="selectedSegment.id === segment.id"
      @resize="throttledResizeRight"
      :elsize="width"
      side="right"/>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch, Provide } from 'vue-property-decorator'
import { SpeakerEvent } from '@components/App.vue';
import Resizer from '@components/helper/Resizer.vue'
import * as _ from 'lodash'
@Component({
  components: {
    Resizer
  }
})
export default class SegmentBox extends Vue {

  @Prop() segment: Segment
  @Prop() previousSegment?: Segment
  @Prop() nextSegment?: Segment
  @Prop() speakerEvents: SpeakerEvent[]
  @Prop() selectedSegment: Segment|null
  @Prop() metadata: any
  @Prop() segmentKey: any

  throttledResizeRight = _.throttle((n: number, o: number) => this.onResizeRight(n, o), 25)
  throttledResizeLeft  = _.throttle((n: number, o: number) => this.onResizeLeft(n, o), 25)

  get style(): any {
    return {
        transform: `translateX(${this.offset}px)`,
        width: this.width + 'px'
    }
  }
  get width(): number {
    return (Number(this.segment.endTime) - Number(this.segment.startTime)) * this.pixelsPerSecond
  }
  get offset(): number {
    return Number(this.segment.startTime) * this.pixelsPerSecond
  }
  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.totalWidth / this.metadata.audioLength
    } else {
      return 0
    }
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
  deleteSegment(key: number, segment: Segment) {
    this.$emit('delete-segment', key, segment)
  }
  onResizeRight(w: number, oldW: number) {
    if (this.selectedSegment !== null) {
      const newDuration = w / this.pixelsPerSecond
      const oldDuration = oldW / this.pixelsPerSecond
      const difference = newDuration - oldDuration
      const newEndTime = this.segment.endTime + difference
      const rightBoundary = this.nextSegment === undefined ? Infinity : this.nextSegment.startTime
      console.log({w, newEndTime, rightBoundary})
      if (w > 0 && newEndTime <= rightBoundary) {
        this.segment.endTime = Number(newEndTime.toFixed(10))
      } else {
        this.segment.endTime = Number(rightBoundary.toFixed(10))
      }
    }
  }
  onResizeLeft(w: number, oldW: number) {
    if (this.selectedSegment !== null) {
      const newDuration = w / this.pixelsPerSecond
      const oldDuration = oldW / this.pixelsPerSecond
      const difference = oldDuration - newDuration
      const newStartTime = this.segment.startTime + difference
      const leftBoundary = this.previousSegment === undefined ? 0 : this.previousSegment.endTime
      console.log({w, newStartTime, leftBoundary})
      if (w > 0 && newStartTime >= leftBoundary) {
        this.segment.startTime = Number(newStartTime.toFixed(10))
      } else {
        this.segment.startTime = Number(leftBoundary.toFixed(10))
      }
    }
  }

}
</script>
<style lang="stylus" scoped>
.segment
  height 100px
  top 50px
  border-radius 8px
  overflow hidden
  background rgba(0, 0, 0, .025)
  position absolute
  border-right 1px solid rgba(255,255,255,.2)
  box-shadow inset 0 0 0 1px rgba(0,0,0,.1)
  transition background .3s
  outline 0
  will-change width left
  transform-origin 0 0
  &.selected, &:focus
    background transparent
    border: 2px solid cornflowerblue
    box-shadow 0 0 40px rgba(0,0,0,.2)
  &:hover:not(.selected)
    background rgba(0,0,0, .05)
  .segment-background
    background rgba(0,0,0,.05)
    position absolute
    left 0
    top 0
    right 0
    bottom 0
</style>
