<template>
  <div
    @mousedown="selectSegment(segment)"
    @dblclick="playSegment(segment)"
    @keydown.delete="deleteSegment(segment)"
    @keydown.right.stop.prevent="selectNext(segmentKey)"
    @keydown.left.stop.prevent="selectPrevious(segmentKey)"
    @keydown.space.stop.prevent="playSegment(segment)"
    tabindex="-1"
    :class="[ 'segment', isSelected ? 'selected' : '' ]"
    :style="{ left: offset + 'px', width: width + 'px' }">
    <slot :segment="segment" />
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
import { SpeakerEvent } from '@components/App.vue'
import Resizer from '@components/helper/Resizer.vue'
import ResizeParent from '@components/helper/ResizeParent.vue'
import * as _ from 'lodash'
@Component({
  components: {
    ResizeParent
  }
})
export default class SegmentBox extends Vue {

  @Prop() segment: Segment
  @Prop() previousSegment?: Segment
  @Prop() nextSegment?: Segment
  @Prop() speakerEvents: SpeakerEvent[]
  @Prop() selectedSegment: Segment|null
  @Prop() pixelsPerSecond: number
  @Prop() segmentKey: any

  isSelected = false

  @Watch('selectedSegment')
  selectedSegmentChange() {
    console.log('hello')
    this.isSelected = this.selectedSegment !== null && this.selectedSegment.id === this.segment.id
  }
  get width(): number {
    return (Number(this.segment.endTime) - Number(this.segment.startTime)) * this.pixelsPerSecond
  }
  get offset(): number {
    return Number(this.segment.startTime) * this.pixelsPerSecond
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
    console.log(e)
    this.segment.startTime = e.current.left / this.pixelsPerSecond
    this.segment.endTime = e.current.right / this.pixelsPerSecond
    if (this.nextSegment !== undefined) {
      this.nextSegment.startTime = e.next.left / this.pixelsPerSecond
    }
    if (this.previousSegment !== undefined) {
      this.previousSegment.endTime = e.previous.right / this.pixelsPerSecond
      console.log(this.segment.startTime, this.previousSegment.endTime)
    }
  }
}
</script>
<style lang="stylus" scoped>
.segment
  min-width 12px
  height 150px
  top 75px
  border-radius 10px
  overflow hidden
  background rgba(0,0,0,.2)
  position absolute
  border-top 1px solid rgba(255,255,255,.3)
  border-right 1px solid rgba(255,255,255,.2)
  transition background .3s
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
