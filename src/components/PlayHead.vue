<template>
  <div>
    <div
      class="play-head"
      ref="playHead"
      :style="{
        transition: transition,
        transform: `translateX(${ left }px)`
      }">
    </div>
    <div
      :style="{zIndex: inFront ? 1 : 'auto'}"
      @mousedown="startDrag"
      ref="stage"
      class="play-head-stage" />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore } from '../store/transcript'
import audio from '../service/audio'

function easeInOutQuad(t: number, b: number, c: number, d: number) {
  t /= d / 2
  if (t < 1) {
    return c / 2 * t * t + b
  }
  t--
  return -c / 2 * ( t * ( t - 2 ) - 1) + b
}

@Component
export default class PlayHead extends Vue {

  @Prop() metadata: any
  @Prop() posX: number

  inFront = false
  audioStore = audio.store
  eventStore = eventStore
  left = 10
  transition = 'unset'

  @Watch('eventStore.playAllFrom')
  async onPlayAllFromChange(from: number|null) {
    if (from !== null) {
      this.transition = 'unset'
      this.scrollAtSpeed(from)
      // const endTime = eventStore.audioElement.duration
      // const playbackTimeInSeconds = (endTime - from) * (1 / (this.audioStore.playbackRate / 100))
      // this.transition = 'unset'
      // await this.$nextTick()
      // this.left = from * this.pixelsPerSecond
      // await this.$nextTick()
      // this.transition = `transform ${playbackTimeInSeconds}s linear`
      // this.left = endTime * this.pixelsPerSecond
    } else {
      // this.left = eventStore.audioElement.currentTime
      // this.transition = 'unset'
    }
  }

  scrollAtSpeed(startAtTime = 0, catchUpTime = 1) {
    const startTime = performance.now()
    const w = document.querySelector('.wave-form')!
    const p = this.$refs.playHead as HTMLElement
    const wStart = w.scrollLeft
    const wTargetPosition = (
      (startAtTime * this.pixelsPerSecond + this.pixelsPerSecond * catchUpTime) - (w.clientWidth / 2)
    )
    const wDistanceToCover = wTargetPosition - w.scrollLeft
    const step = () => {
      const timeEllapsed = (performance.now() - startTime) / 1000
      const playHeadLeft = (startAtTime + timeEllapsed) * this.pixelsPerSecond
      if (timeEllapsed <= catchUpTime) {
        w.scrollLeft = easeInOutQuad(timeEllapsed, wStart, wDistanceToCover, catchUpTime)
      } else {
        w.scrollLeft = playHeadLeft - w.clientWidth / 2
      }
      p.style.transform = `translateX(${ playHeadLeft }px)`
      if (eventStore.playAllFrom !== null) {
        requestAnimationFrame(step)
      } else {
        this.left = playHeadLeft
      }
    }
    step()
  }

  @Watch('eventStore.playingEvent')
  onPlayingEventChange() {
    const s = this.eventStore.playingEvent
    if (s !== null) {
      this.transition = 'unset'
      const playbackTimeInSeconds = (s.endTime - s.startTime) * (1 / (this.audioStore.playbackRate / 100))
      requestAnimationFrame(() => {
        this.left = s.startTime * this.pixelsPerSecond
        requestAnimationFrame(() => {
          this.transition = `transform ${playbackTimeInSeconds}s linear`
          this.left = s.endTime * this.pixelsPerSecond
        })
      })
    } else {
      this.transition = 'unset'
    }
  }

  @Watch('posX')
  moveToPos(posX: number) {
    this.left = this.posX
  }

  log(e: any) {
    console.log(e)
  }
  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.pixelsPerSecond
    } else {
      return 0
    }
  }

  startDrag(e: MouseEvent) {
    this.inFront = true
    document.addEventListener('mousemove', this.drag)
    document.addEventListener('mouseup', this.endDrag)
  }

  drag(e: MouseEvent) {
    requestAnimationFrame(() => {
      this.left = e.offsetX
      eventStore.audioElement.currentTime = this.left / this.metadata.pixelsPerSecond
    })
  }

  endDrag(e: MouseEvent) {
    this.inFront = false
    this.left = e.layerX
    this.$emit('change-position', e.layerX / this.metadata.pixelsPerSecond)
    document.removeEventListener('mousemove', this.drag)
    document.removeEventListener('mouseup', this.endDrag)
  }

}
</script>
<style lang="stylus" scoped>
.play-head
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
