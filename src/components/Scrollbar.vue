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
      :class="['overview-time', settings.darkMode && 'theme--dark']"
      ref="overviewTime"
      :style="{ width: overviewTimeWidth + 'px' }"
    />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator'
import { LocalTranscriptEvent } from '../store/transcript'
import EventBus, { BusEvent } from '../service/event-bus'
import settings from '../store/settings'
import _ from 'lodash'
import { requestFrameAsync, timeFromSeconds } from '../util'

@Component
export default class Scrollbar extends Vue {

  // global events to listen to
  @Prop() updateOn!: BusEvent|BusEvent[]
  @Prop({ required: true }) maxTime!: number

  settings = settings

  overviewTimeWidth = 70 // width of the time preview tooltip above the overview waveform
  isDragging = false

  mounted() {
    this.listenToEvents(this.updateOn)
  }

  listenToEvents(es = this.updateOn) {
    if (Array.isArray(es)) {
      es.forEach((e) => EventBus.$on(e, this.moveThumbToTime))
    } else {
      EventBus.$on(es, this.moveThumbToTime)
    }
  }

  unlisten(es = this.updateOn) {
    if (Array.isArray(es)) {
      es.forEach((e) => EventBus.$off(e, this.moveThumbToTime))
    } else {
      EventBus.$off(es, this.moveThumbToTime)
    }
  }

  beforeDestroy() {
    this.unlisten(this.updateOn)
  }

  async getOffsets(x: number) {
    const thumb = this.$refs.scrollbarThumb
    const track = this.$refs.scrollbarTrack
    if (track instanceof HTMLElement && thumb instanceof HTMLElement) {
      await requestFrameAsync()
      const scrollbarWidth = track.offsetWidth - thumb.offsetWidth
      const offset = x - track.getBoundingClientRect().left
      const time = Math.max(0, Math.min(offset / scrollbarWidth * this.maxTime, this.maxTime))
      const limitedOffset = Math.max(0, Math.min(offset, scrollbarWidth))
      return { time, limitedOffset }
    } else {
      throw new Error('Elements not found')
    }
  }

  moveThumbToTime(t: number|LocalTranscriptEvent) {
    const time = typeof t === 'number' ? t : t.startTime
    requestAnimationFrame(() => {
      const thumb = this.$refs.scrollbarThumb
      const track = this.$refs.scrollbarTrack
      if (track instanceof HTMLElement && thumb instanceof HTMLElement) {
        const scrollbarWidth = track.offsetWidth - thumb.offsetWidth
        const offset = time / this.maxTime * scrollbarWidth
        const limitedOffset = Math.max(0, Math.min(offset, scrollbarWidth))
        requestAnimationFrame(() => {
          thumb.style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
        })
      }
    })
  }

  startDrag(e: MouseEvent) {
    this.handleDrag(e)
    this.isDragging = true
    document.addEventListener('mousemove', this.handleDrag)
    document.addEventListener('mouseup', this.endDrag)
  }

  async handleDrag(ev: MouseEvent) {
    this.updateOverviewTime(ev)
    const thumb = this.$refs.scrollbarThumb
    const track = this.$refs.scrollbarTrack
    const { time, limitedOffset } = await this.getOffsets(ev.clientX)
    this.$emit('scroll', time)
    requestAnimationFrame(() => {
      (thumb as HTMLElement).style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
    })
  }

  async endDrag(ev: MouseEvent) {
    this.isDragging = false
    document.removeEventListener('mousemove', this.handleDrag)
    document.removeEventListener('mouseup', this.endDrag)
    const { time } = await this.getOffsets(ev.x)
    this.$emit('scrollend', time)
  }

  async updateOverviewTime(e: MouseEvent) {
    const timer = this.$refs.overviewTime
    if (timer instanceof HTMLElement) {
      const { time, limitedOffset } = await this.getOffsets(e.x)
      if (!_.isNaN(time)) {
        requestAnimationFrame(() => {
          timer.innerHTML = timeFromSeconds(time)
          timer.style.transform = `translate3d(${ limitedOffset }px, 0, 0)`
        })
      }
    }
  }

}
</script>
<style lang="stylus" scoped>
.overview-time
  top -20px
  will-change transfrom
  pointer-events none
  transition .25s opacity 
  opacity 0
  position absolute
  color #333
  z-index 2
  font-size 80%
  text-align center
  background rgba(255,255,255,.8)
  border-radius 10px
  line-height 20px
  &.theme--dark
    background rgba(0,0,0,.2)
    color #ccc

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
  &:hover
  &.scrolling
    background rgba(255,255,255,.1)
    opacity 1 !important
    .overview-time
      opacity 1
    .scrollbar-handle
      background white

</style>
