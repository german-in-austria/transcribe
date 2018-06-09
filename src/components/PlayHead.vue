<template>
  <div
    class="play-head"
    :style="{
      transition: transition,
      transform: `translateX(${left})`
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

  left = '0px'
  transition = 'unset'

  @Watch('playingSegment')
  moveOnSegment() {
    const s = this.playingSegment
    if (s !== null) {
      this.transition = 'unset'
      const playbackTimeInSeconds = (s.endTime - s.startTime) * (1 / this.audioElement.playbackRate)
      setTimeout(() => {
        this.left = s.startTime * this.pixelsPerSecond + 'px'
        setTimeout(() => {
          this.transition = `transform ${playbackTimeInSeconds}s linear`
          this.left = s.endTime * this.pixelsPerSecond + 'px'
          // setTimeout(() => {
          //   console.log('ME!')
          //   this.transition = 'unset'
          // }, playbackTimeInSeconds * 1000)
        }, 2)
      }, 2)
    } else {
      this.transition = 'unset'
      this.left = this.audioElement.currentTime * this.pixelsPerSecond + 'px'
      console.log('YOU!!')
      setTimeout(() => {
        this.left = this.audioElement.currentTime * this.pixelsPerSecond + 'px'
      }, 2)
    }
  }

  get pixelsPerSecond() {
    if ( this.metadata.totalWidth !== null && this.audioElement !== null) {
      return this.metadata.totalWidth / this.audioElement.duration
    } else {
      return 0
    }
  }

}
</script>
<style lang="stylus" scoped>
.play-head
  width 3px
  background red
  height 100%
  position absolute
  top 0
  bottom 0
</style>
