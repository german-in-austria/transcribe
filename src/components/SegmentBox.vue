<template>
  <div
    @click.exact.stop="selectEvent(event)"
    @mousedown.meta="selectOrDeselectEvent(event)"
    @mousedown.shift="selectEventRange(event)"
    @dblclick="playEvent(event)"
    tabindex="-1"
    :class="[ 'segment', isEventSelected(event.eventId) && 'selected', settings.darkMode && 'theme--dark' ]"
    :style="{ left: offset + 'px', width: width + 'px' }">
    <div :style="{ left: width / 2 + 'px' }" class="transcript-tooltip" v-if="isEventSelected(event.eventId)">
      <div class="inner" :key="i" v-for="(se, i) in event.speakerEvents">
        {{ eventStore.metadata.speakers[i].k }}: {{ se.tokens.map(t => t.tiers[eventStore.metadata.defaultTier].text).join(' ') }}
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
import ResizeParent from './helper/ResizeParent.vue'
import { undoable } from '../store/history'
import settings from '../store/settings'

import {
  playEvent,
  resizeEvents,
  LocalTranscriptEvent,
  eventStore,
  selectEvent,
  selectOrDeselectEvent,
  selectEventRange,
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

  scrollToTranscriptEvent = scrollToTranscriptEvent
  selectEvent = selectEvent
  selectEventRange = selectEventRange
  selectOrDeselectEvent = selectOrDeselectEvent
  eventStore = eventStore
  isEventSelected = isEventSelected
  playEvent = playEvent
  settings = settings
  // get hasOverlap() {
  //   const x = (
  //     this.previousEvent !== undefined &&
  //     Number(this.previousEvent.endTime.toPrecision(2)) > Number(this.event.startTime.toPrecision(2))
  //   )
  //   if (x) {
  //     console.log('overlap', this.event, this.previousEvent, this.nextEvent)
  //   }
  //   return x
  // }

  get offset() {
    return Number(this.event.startTime) * settings.pixelsPerSecond
  }

  get width(): number {
    return (Number(this.event.endTime) - Number(this.event.startTime)) * settings.pixelsPerSecond
  }

  onResizeEnd(e: any) {
    const startTime = e.current.left / settings.pixelsPerSecond
    const endTime = e.current.right / settings.pixelsPerSecond
    if (e.next !== null && this.nextEvent !== undefined) {
      const nextStartTime = e.next.left / settings.pixelsPerSecond
      undoable(resizeEvents({ ...this.event, startTime, endTime }, { ...this.nextEvent, startTime: nextStartTime }))
    } else if (e.previous !== null && this.previousEvent !== undefined) {
      const previousEndTime = e.previous.right / settings.pixelsPerSecond
      undoable(resizeEvents({ ...this.previousEvent, endTime: previousEndTime }, { ...this.event, startTime, endTime }))
    } else {
      undoable(resizeEvents({ ...this.event, startTime, endTime }))
    }
  }
}
</script>

<style lang="stylus" scoped>
.transcript-tooltip
  position absolute
  top -40px
  transform translate3d(-50%, 0, 0)
  text-align center
  padding 2px 10px
  background rgba(255,255,255,.8)
  border-radius 5px
  .inner
    font-weight 300
    white-space nowrap

.theme--dark .transcript-tooltip
  background rgba(50,50,50,.9)

.segment
  // performance of "Composite Layers"
  will-change width, left
  min-width 12px
  height 150px
  top 75px
  border-radius 10px
  background rgba(0,0,0,0.05)
  position absolute
  border-top 1px solid white
  border-right 1px solid white
  outline 0
  transform-origin 0 0
  user-select none
  &.theme--dark
    background rgba(0,0,0,.2)
    border-top 1px solid rgba(255,255,255,.3)
    border-right 1px solid rgba(255,255,255,.2)
    &:hover:not(.selected)
      background transparent
      border-bottom 1px solid rgba(255,255,255,.2)
      border-left 1px solid rgba(255,255,255,.2)
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
    background rgba(0,0,0,.1)
    border-bottom 1px solid white
    border-left 1px solid white
  .resizer
    transition .25s opacity
    opacity 0
  &:hover:not(.resizing) .resizer
    opacity 1

</style>
