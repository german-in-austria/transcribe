<template>
  <div
    class="play-head"
    :style="{
      transition: transition,
      transform: `translateX(${left}px)`
    }">
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { setTimeout } from 'timers';

@Component
export default class PlayHead extends Vue {

  @Prop() metadata: any
  @Prop() playingSegment: Segment|null
  @Prop() audioElement: HTMLAudioElement
  @Prop() posX: number

  left = 10
  transition = 'unset'

  @Watch('playingSegment')
  moveOnSegment() {
    const s = this.playingSegment
    if (s !== null) {
      this.transition = 'unset'
      const playbackTimeInSeconds = (s.endTime - s.startTime) * (1 / this.audioElement.playbackRate)
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
  moveToPos() {
    this.left = this.posX
  }

  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.pixelsPerSecond
    } else {
      return 0
    }
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
</style>
