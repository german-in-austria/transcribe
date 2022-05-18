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
      @dblclick="startPlaying"
      ref="stage"
      class="play-head-stage"
      :style="{
        zIndex: inFront ? 1 : 'auto'
      }"
    />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { easeInOutQuad, requestFrameAsync, timeFromSeconds } from '../util'
import settings from '../store/settings.store'
import bus from '../service/bus'
import store from '@/store'

@Component
export default class PlayHead extends Vue {

  inFront = false
  left = 10
  settings = settings
  toTime = timeFromSeconds
  transcript = store.transcript!
  audio = this.transcript.audio

  scrollToTime(t: number) {
    if (
      this.audio &&
      settings.lockPlayHead === true &&
      this.audio.isPaused === false
    ) {
      requestAnimationFrame(() => {
        // should be dynamic
        const waveform = document.querySelector('.wave-form')!
        const playHeadLeft = Math.round(t * settings.pixelsPerSecond)
        const viewPortLeft = playHeadLeft - waveform.clientWidth / 2
        waveform.scrollLeft = viewPortLeft
      })
    } else {
      bus.$off('updateTime', this.scrollToTime)
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
    // the time (in seconds) it should take
    // the scroller to catch up to the playhead.
    const scrollCatchUpTime = 1
    // geometry and time formulae.
    // this should be dynamic
    const waveform = document.querySelector('.wave-form')!
    const stageWidth = waveform.clientWidth
    const wStart = waveform.scrollLeft
    const wTargetPosition = (t + scrollCatchUpTime) * settings.pixelsPerSecond - stageWidth / 2
    const wDistanceToCover = wTargetPosition - waveform.scrollLeft
    bus.$on('updateTime', function catchUpListener(currentTime: number) {
      const timeElapsed = currentTime - t
      // if playhead is still locked
      if (settings.lockPlayHead === true) {
        // catch up using quadratic ease in out
        if (timeElapsed <= scrollCatchUpTime) {
          waveform.scrollLeft = easeInOutQuad(timeElapsed, wStart, wDistanceToCover, scrollCatchUpTime)
        } else {
          // when we’re done, de-register this handler,
          // and hand it over to the regular, linear scroller ("scrollToTime").
          bus.$off('updateTime', catchUpListener)
          bus.$on('updateTime', that.scrollToTime)
        }
      }
    })
  }

  async movePlayHead(t: number) {
    await requestFrameAsync();
    (this.$refs.playHead as HTMLElement).style.transform = `translate3d(${ t * settings.pixelsPerSecond }px, 0, 0)`
  }

  mounted() {
    bus.$on('scrubAudio', this.movePlayHead)
    bus.$on('playAudio', this.animateScrollCatchUp)
    bus.$on('updateTime', this.movePlayHead)
  }

  beforeDestroy() {
    bus.$off('scrubAudio', this.movePlayHead)
    bus.$off('playAudio', this.animateScrollCatchUp)
    bus.$off('updateTime', this.movePlayHead)
  }

  startDrag(e: MouseEvent) {
    this.transcript.uiState.timeSpanSelection = { start: null, end: null }
    this.transcript.deselectEvents()
    this.inFront = true
    if (this.transcript.audio !== null) {
      this.transcript.audio.scrubAudio(e.offsetX / settings.pixelsPerSecond)
      document.addEventListener('mousemove', this.drag)
      document.addEventListener('mouseup', this.endDrag)
    }
  }

  drag(e: MouseEvent) {
    if (this.transcript.audio !== null) {
      this.transcript.audio.scrubAudio(e.offsetX / settings.pixelsPerSecond)
    }
  }

  endDrag(e: MouseEvent) {
    this.inFront = false
    this.left = e.offsetX
    document.removeEventListener('mousemove', this.drag)
    document.removeEventListener('mouseup', this.endDrag)
  }

  startPlaying(e: MouseEvent) {
    if (this.transcript.audio !== null) {
      const t = e.offsetX / settings.pixelsPerSecond
      this.transcript.audio.playAllFrom(t)
    }
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

</style>
