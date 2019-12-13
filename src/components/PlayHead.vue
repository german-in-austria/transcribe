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
      @mousedown="startDrag"
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
import { eventStore, scrubAudio, deselectEvents } from '../store/transcript'
import audio from '../service/audio'
import { easeInOutQuad, requestFrameAsync } from '../util'
import settings from '../store/settings'
import eventBus from '../service/event-bus'

@Component
export default class PlayHead extends Vue {

  @Prop() posX: number

  inFront = false
  audioStore = audio.store
  eventStore = eventStore
  left = 10
  settings = settings

  // TODO: what’s that good for
  @Watch('posX')
  moveToPos(posX: number) {
    this.left = this.posX
  }

  log(e: any) {
    console.log(e)
  }

  scrollToTime(t: number) {
    if (settings.lockPlayHead === true && eventStore.isPaused === false) {
      requestAnimationFrame(() => {
        const sidebarWidth = settings.showDrawer === true ? 300 : 0
        const waveform = document.querySelector('.wave-form')!
        const playHeadLeft = Math.round(t * settings.pixelsPerSecond)
        const viewPortLeft = playHeadLeft - (waveform.clientWidth - sidebarWidth) / 2
        waveform.scrollLeft = viewPortLeft
      })
    } else {
      eventBus.$off('updateTime', this.scrollToTime)
    }
  }

  // this should actually be in the 
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
    // geometry and time formulae
    const sidebarWidth = settings.showDrawer === true ? 300 : 0
    const startedTime = performance.now()
    const waveform = document.querySelector('.wave-form')!
    const stageWidth = waveform.clientWidth - sidebarWidth
    const wStart = waveform.scrollLeft
    const wTargetPosition = (t + scrollCatchUpTime) * settings.pixelsPerSecond - stageWidth / 2
    const wDistanceToCover = wTargetPosition - waveform.scrollLeft
    eventBus.$on('updateTime', function catchUpListener(this: any) {
      const timeElapsed = (performance.now() - startedTime) / 1000 * settings.playbackSpeed
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
    deselectEvents()
    this.inFront = true
    scrubAudio(e.offsetX / settings.pixelsPerSecond)
    document.addEventListener('mousemove', this.drag)
    document.addEventListener('mouseup', this.endDrag)
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
</style>
