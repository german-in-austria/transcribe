<template>
  <div>
    <div
      class="play-head"
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
import { eventStore, scrubAudio } from '../store/transcript'
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

  // TODO: use events
  @Watch('eventStore.playAllFrom')
  async onPlayAllFromChange(from: number|null) {
    if (from !== null) {
      settings.lockPlayHead = true
    }
  }

  // TODO: use events
  @Watch('eventStore.playingEvent')
  onPlayingEventChange() {
    const e = this.eventStore.playingEvent
    if (e !== null) {
      this.movePlayHead(e.startTime)
    }
  }

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
        const waveform = document.querySelector('.wave-form')!
        const playHeadLeft = Math.round(t * settings.pixelsPerSecond)
        const viewPortLeft = playHeadLeft - waveform.clientWidth / 2
        waveform.scrollLeft = viewPortLeft
      })
    } else {
      eventBus.$off('updateTime', this.scrollToTime)
    }
  }

  animateScrollCatchUp(t: number) {
    const that = this
    const scrollCatchUpTime = 1
    const startedTime = performance.now()
    const waveform = document.querySelector('.wave-form')!
    const stageWidth = waveform.clientWidth
    const wStart = waveform.scrollLeft
    const wTargetPosition = (t + scrollCatchUpTime) * settings.pixelsPerSecond - stageWidth / 2
    const wDistanceToCover = wTargetPosition - waveform.scrollLeft
    eventBus.$on('updateTime', function catchUpListener(this: any) {
      const timeEllapsed = (performance.now() - startedTime) / 1000 * eventStore.audioElement.playbackRate
      // if playhead is locked
      if (settings.lockPlayHead === true) {
        // catch up using quadratic ease in out
        if (timeEllapsed <= scrollCatchUpTime) {
          waveform.scrollLeft = easeInOutQuad(timeEllapsed, wStart, wDistanceToCover, scrollCatchUpTime)
        } else {
          // hand it over to the regular scroller
          eventBus.$on('updateTime', that.scrollToTime)
          eventBus.$off('updateTime', catchUpListener)
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
    this.inFront = true
    document.addEventListener('mousemove', this.drag)
    document.addEventListener('mouseup', this.endDrag)
  }

  drag(e: MouseEvent) {
    scrubAudio(e.offsetX / settings.pixelsPerSecond)
  }

  endDrag(e: MouseEvent) {
    this.inFront = false
    this.left = e.layerX
    this.$emit('change-position', e.layerX / settings.pixelsPerSecond)
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
  background white
  height 100%
  position absolute
  top 0
  bottom 0

.play-head-stage
  position absolute
  left 0
  right 0
  top 0
  height 300px
</style>
