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
      @mousedown="startDrag"
      ref="stage"
      class="play-head-stage" />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore } from '../store/transcript'
import audio from '../service/audio'

@Component
export default class PlayHead extends Vue {

  @Prop() metadata: any
  @Prop() audioElement: HTMLAudioElement
  @Prop() posX: number

  audioStore = audio.store
  eventStore = eventStore
  left = 10
  transition = 'unset'

  @Watch('eventStore.playingEvent')
  moveOnSegment() {
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
    document.addEventListener('mousemove', this.drag)
    document.addEventListener('mouseup', this.endDrag)
  }

  drag(e: MouseEvent) {
    requestAnimationFrame(() => {
      this.left = e.offsetX
    })
  }

  endDrag(e: MouseEvent) {
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
