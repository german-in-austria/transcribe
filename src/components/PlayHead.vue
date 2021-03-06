<template>
  <div>
    <div
      :class="['play-head', settings.darkMode && 'theme--dark']"
      ref="playHead"
      :style="{
        transform: `translate3d(${ left }px, 0, 0)`
      }"
    />
    <div
      @mousedown.exact="startDrag"
      @mousedown.shift="startSelection"
      ref="stage"
      class="play-head-stage"
      :style="{
        zIndex: inFront ? 1 : 'auto'
      }"
    />
    <div
      v-if="eventStore.userState.timeSpanSelection.start !== null && eventStore.userState.timeSpanSelection.end !== null"
      :style="{
        left: getSelectionLeft() * settings.pixelsPerSecond + 'px',
        width: getSelectionLength() * settings.pixelsPerSecond + 'px'
      }"
      class="selection">
      <div class="selection-length">{{ getSelectionLength().toFixed(2) }} sec</div>
    </div>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore, scrubAudio, deselectEvents, toTime } from '../store/transcript'
import audio from '../service/audio'
import { easeInOutQuad, requestFrameAsync } from '../util'
import settings from '../store/settings'
import eventBus from '../service/event-bus'

@Component
export default class PlayHead extends Vue {

  inFront = false
  audioStore = audio.store
  eventStore = eventStore
  left = 10
  settings = settings
  toTime = toTime

  scrollToTime(t: number) {
    if (settings.lockPlayHead === true && eventStore.isPaused === false) {
      requestAnimationFrame(() => {
        // should be dynamic
        const waveform = document.querySelector('.wave-form')!
        const playHeadLeft = Math.round(t * settings.pixelsPerSecond)
        const viewPortLeft = playHeadLeft - waveform.clientWidth / 2
        waveform.scrollLeft = viewPortLeft
      })
    } else {
      eventBus.$off('updateTime', this.scrollToTime)
    }
  }

  // this should actually be in the waveform component
  animateScrollCatchUp(t: number) {
    // initially, the playhead is always locked.
    // it gets unlocked, when the user scrolls.
    settings.lockPlayHead = true
    // we’re using a named function below,
    // so we must keep track of "this"
    const that = this
    // the time it should take the scroller to
    // catch up to the playhead.
    const scrollCatchUpTime = 1
    // geometry and time formulae.
    // this should be dynamic
    const waveform = document.querySelector('.wave-form')!
    const stageWidth = waveform.clientWidth
    const wStart = waveform.scrollLeft
    const wTargetPosition = (t + scrollCatchUpTime) * settings.pixelsPerSecond - stageWidth / 2
    const wDistanceToCover = wTargetPosition - waveform.scrollLeft
    eventBus.$on('updateTime', function catchUpListener(currentTime: number) {
      const timeElapsed = currentTime - t
      // if playhead is still locked
      if (settings.lockPlayHead === true) {
        // catch up using quadratic ease in out
        if (timeElapsed <= scrollCatchUpTime) {
          waveform.scrollLeft = easeInOutQuad(timeElapsed, wStart, wDistanceToCover, scrollCatchUpTime)
        } else {
          // when we’re done, hand it over to the
          // regular, linear scroller
          eventBus.$off('updateTime', catchUpListener)
          eventBus.$on('updateTime', that.scrollToTime)
        }
      }
    })
  }

  async movePlayHead(t: number) {
    await requestFrameAsync();
    (this.$refs.playHead as HTMLElement).style.transform = `translate3d(${ t * settings.pixelsPerSecond }px, 0, 0)`
  }

  mounted() {
    eventBus.$on('scrubAudio', this.movePlayHead)
    eventBus.$on('playAudio', this.animateScrollCatchUp)
    eventBus.$on('updateTime', this.movePlayHead)
  }

  beforeDestroy() {
    eventBus.$off('scrubAudio', this.movePlayHead)
    eventBus.$off('playAudio', this.animateScrollCatchUp)
    eventBus.$off('updateTime', this.movePlayHead)
  }

  startDrag(e: MouseEvent) {
    eventStore.userState.timeSpanSelection = { start: null, end: null }
    deselectEvents()
    this.inFront = true
    scrubAudio(e.offsetX / settings.pixelsPerSecond)
    document.addEventListener('mousemove', this.drag)
    document.addEventListener('mouseup', this.endDrag)
  }

  getSelectionLeft() {
    return Math.min(eventStore.userState.timeSpanSelection.start || 0, eventStore.userState.timeSpanSelection.end || 0)
  }

  getSelectionLength() {
    return Math.abs(
      (eventStore.userState.timeSpanSelection.end || 0) -
      (eventStore.userState.timeSpanSelection.start || 0)
    )
  }

  startSelection(e: MouseEvent) {
    deselectEvents()
    this.inFront = true
    eventStore.userState.timeSpanSelection.start = e.offsetX / settings.pixelsPerSecond
    document.addEventListener('mousemove', this.dragSelection)
    document.addEventListener('mouseup', this.endSelection)
  }

  dragSelection(e: MouseEvent) {
    // console.log(e.offsetX / settings.pixelsPerSecond, e)
    eventStore.userState.timeSpanSelection.end = e.offsetX / settings.pixelsPerSecond
  }

  endSelection(e: MouseEvent) {
    this.inFront = false
    eventStore.userState.timeSpanSelection.end = e.offsetX / settings.pixelsPerSecond
    document.removeEventListener('mousemove', this.dragSelection)
    document.removeEventListener('mouseup', this.endSelection)
  }

  drag(e: MouseEvent) {
    scrubAudio(e.offsetX / settings.pixelsPerSecond)
  }

  endDrag(e: MouseEvent) {
    this.inFront = false
    this.left = e.offsetX
    document.removeEventListener('mousemove', this.drag)
    document.removeEventListener('mouseup', this.endDrag)
  }

}
</script>
<style lang="stylus" scoped>
.play-head
  // performance of "Composite Layers"
  will-change transform
  width 1px
  height 90%
  position absolute
  top 5%
  bottom 0
  background #929292
  &.theme--dark
    background white

.play-head-stage
  position absolute
  left 0
  right 0
  top 0
  height 300px

.selection
  overflow hidden
  top 50px
  bottom 60px
  position absolute
  background rgba(100, 149, 237, 0.2)
  border 1px solid cornflowerblue
  border-radius 8px
  opacity 1
  z-index 2
  pointer-events none

.selection-length
  background cornflowerblue
  color white
  font-size 85%
  text-align center
  line-height 22px
  height 22px
  user-select none
  overflow hidden
  position absolute
  top 0
  border-bottom-right-radius 8px
  margin 0 auto
  padding 0 10px
</style>
