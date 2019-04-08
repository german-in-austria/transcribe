<template>
  <div
    @mousedown="startDrag"
    @mouseup="endDrag"
    @mousemove="updateOverviewTime"
    ref="scrollbarTrack"
    :class="{'scrollbar-track': true, scrolling: isDragging}">
    <div
      ref="scrollbarThumb"
      tabindex="-1"
      class="text-xs-center scrollbar-thumb" />
    <div
      class="overview-time"
      ref="overviewTime"
      :style="{ width: overviewTimeWidth + 'px' }"
    />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore, toTime } from '../store/transcript'
import EventBus from '../service/event-bus'

@Component
export default class Scrollbar extends Vue {

  @Prop() updateOn: string|string[]

  overviewTimeWidth = 70 // width of the time preview tooltip above the overview waveform
  isDragging = false

  mounted() {
    EventBus.$on(this.updateOn, this.moveThumbToTime)
  }

  beforeDestroy() {
    EventBus.$off(this.updateOn, this.moveThumbToTime)
  }

  moveThumbToTime(t: number) {
    const thumb = this.$refs.scrollbarThumb
    const track = this.$refs.scrollbarTrack
    if (track instanceof HTMLElement && thumb instanceof HTMLElement) {
      const scrollbarWidth = track.offsetWidth - thumb.offsetWidth
      const offset = t / eventStore.audioElement.duration * scrollbarWidth
      const limitedOffset = Math.max(0, Math.min(offset, scrollbarWidth))
      requestAnimationFrame(() => {
        thumb.style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
      })
    }
  }

  startDrag(e: MouseEvent) {
    this.handleDrag(e)
    this.isDragging = true
    document.addEventListener('mousemove', this.handleDrag)
    document.addEventListener('mouseup', this.endDrag)
  }

  handleDrag(ev: MouseEvent) {
    this.updateOverviewTime(ev)
    const thumb = this.$refs.scrollbarThumb
    const track = this.$refs.scrollbarTrack
    if (track instanceof HTMLElement && thumb instanceof HTMLElement) {
      const scrollbarWidth = track.offsetWidth - thumb.offsetWidth
      const offset = ev.x - track.offsetLeft
      const time = offset / scrollbarWidth * eventStore.audioElement.duration
      const limitedOffset = Math.max(0, Math.min(offset, scrollbarWidth))
      this.$emit('scroll', time)
      requestAnimationFrame(() => {
        thumb.style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
        // localStorage.setItem('scrollPos', String(w.scrollLeft))
      })
    }
  }

  endDrag() {
    this.isDragging = false
    document.removeEventListener('mousemove', this.handleDrag)
    document.removeEventListener('mouseup', this.endDrag)
  }

  updateOverviewTime(e: MouseEvent) {
    const track = this.$refs.scrollbarTrack
    const thumb = this.$refs.scrollbarThumb
    const timer = this.$refs.overviewTime
    if (track instanceof HTMLElement && timer instanceof HTMLElement && thumb instanceof HTMLElement) {
      const scrollbarWidth = track.offsetWidth - thumb.offsetWidth
      const offset = e.x - track.offsetLeft
      const time = Math.max(0, Math.min(offset / scrollbarWidth, 1) * eventStore.audioElement.duration)
      const limitedOffset = Math.max(0, Math.min(offset, scrollbarWidth))
      requestAnimationFrame(() => {
        timer.innerHTML = toTime(time)
        timer.style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
      })
    }
  }

}
</script>
<style lang="stylus" scoped>
.overview-time
  top -200%
  will-change transfrom
  pointer-events none
  transition .25s opacity 
  opacity 0
  position absolute
  color #ccc
  z-index 2
  font-size 80%
  text-align center
  background rgba(0,0,0,.2)
  border-radius 10px
  line-height 20px

.scrollbar-thumb
  border-radius 6px
  height 11px
  user-select none
  margin-top 0
  background #777
  width 50px
  top 0
  z-index 1
  &:focus
    outline 0

.scrollbar-track
  position relative
  border-radius 6px
  background rgba(255,255,255,0)
  transition .25s background
  &:hover, &.scrolling
    background rgba(255,255,255,.1)
    .overview-time
      opacity 1
    .scrollbar-handle
      background white

</style>
