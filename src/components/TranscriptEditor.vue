<template>
  <div
    @mousewheel="onMousewheel"
    ref="tracks"
    class="tracks"
    v-if="transcript.segments && transcript.speakers && transcript.speakerEvents">
    <div :style="{transform: `translateX(${ innerLeft }px)`}" ref="inner" class="transcript-segments-inner">
      <segment-transcript
        v-for="(segment, i) in visibleSegments"
        :key="segment.id"
        @select-segment="(e) => $emit('select-segment', e)"
        @scroll-to-segment="(e) => $emit('scroll-to-segment', e)"
        @play-segment="(e) => $emit('play-segment', e)"
        @element-unrender="(width) => handleUnrender(width, i, segment.id)"
        @element-render="(width) => handleRender(width, i, segment.id)"
        :segment="segment"
        :speaker-event="transcript.speakerEvents[segment.id]"
        :speakers="transcript.speakers"
        :class="['segment', segment.id === selectedSegment.id && 'segment-selected']"
      />
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from '@components/SegmentTranscript.vue'
import settings from '@store/settings'
import * as _ from 'lodash'

const defaultLimit = 20
let outerWidth = 0

@Component({
  components: {
    SegmentTranscript
  }
})
export default class TranscriptEditor extends Vue {

  @Prop() transcript: Transcript
  @Prop() selectedSegment: Segment
  @Prop({ default: 0 }) scrollToIndex: number

  innerLeft = 0
  currentIndex = this.scrollToIndex
  lastScrollLeft = 0
  visibleSegments = this.transcript.segments.slice(this.currentIndex, this.currentIndex + defaultLimit)
  throttledRenderer = _.throttle(this.updateList, 60)
  throttledEmitter = _.throttle(this.emitScroll, 60)

  @Watch('scrollToIndex')
  doScrollToSegment(i: number) {
    // right in the middle
    this.currentIndex = Math.max(0, i - Math.floor(this.visibleSegments.length / 2))
    this.visibleSegments = this.transcript.segments.slice(this.currentIndex, this.currentIndex + defaultLimit)
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        const el = this.$el.querySelector('.segment-selected')
        const c = this.$el
        if (c instanceof HTMLElement && el instanceof HTMLElement) {
          this.innerLeft = el.offsetLeft * -1 + c.clientWidth / 2 - el.clientWidth / 2
        }
      })
    })
  }

  mounted() {
    outerWidth = this.$el.clientWidth
    this.emitScroll()
  }

  emitScroll() {
    this.$emit('scroll', this.visibleSegments[Math.floor(this.visibleSegments.length / 2)].startTime)
  }

  handleRender(width: number, index: number, segment_id: string) {
    if (index === 0) {
      // console.log('rendered leftmost item', width, segment_id)
      this.innerLeft = this.innerLeft - width
    // RIGHT
    } else if (index === this.visibleSegments.length - 1) {
      // console.log('rendered rightmost item', width, segment_id)
      // this.innerLeft = this.innerLeft + width
    }
  }
  handleUnrender(width: number, index: number, segment_id: string) {
    // LEFTMOST ITEM
    if (index === 0) {
      // console.log('unrendered leftmost item', width, segment_id)
      this.innerLeft = this.innerLeft + width // padding
    // RIGHT
    } else if (index === this.visibleSegments.length - 1) {
      // console.log('unrendered rightmost item', width, segment_id)
      // console.log('unrendered rightmost item', width)
      // this.innerLeft = this.innerLeft - width // padding
    }
  }

  updateList(leftToRight: boolean) {
    if (leftToRight) {
      // SCROLL LEFT TO RIGHT
      if (this.innerLeft <= -1500 && this.currentIndex + defaultLimit + 1 < this.transcript.segments.length) {
        this.visibleSegments.push(this.transcript.segments[this.currentIndex + defaultLimit + 1])
        const unrendered = this.visibleSegments.shift()
        this.currentIndex = this.currentIndex + 1
        // this.throttledEmitter()
        this.emitScroll()
      }
    } else {
      // SCROLL RIGHT TO LEFT
      if (this.innerLeft >= -200 && this.currentIndex > 0) {
        this.visibleSegments.unshift(this.transcript.segments[this.currentIndex - 1])
        const unrendered = this.visibleSegments.pop()
        this.currentIndex = this.currentIndex - 1
        this.emitScroll()
      }
    }
    // WAIT FOR THE ELEMENT TO RENDER,
    // AND RENDER THE NEXT IF NECESSARY.
    // RECURSION
    // TODO: USE TRAMPLINE? THIS COULD BE HEAVY ON THE STACK/HEAP
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        if (
          (this.innerLeft <= -1500 || this.innerLeft >= -200)
          && (this.currentIndex > 0 && this.currentIndex + defaultLimit + 1 < this.transcript.segments.length)
        ) {
          this.updateList(leftToRight)
        }
      })
    })
  }

  onMousewheel(e: MouseWheelEvent) {
    e.preventDefault()
    this.lastScrollLeft = this.innerLeft
    this.innerLeft = this.innerLeft - (e.deltaX || e.deltaY) / (e.shiftKey === true ? 10 : 1)
    this.throttledRenderer(this.innerLeft <= this.lastScrollLeft)
    this.lastScrollLeft = this.innerLeft
  }
}
</script>

<style lang="stylus" scoped>

@keyframes blink-animation
  50%
    opacity 0

@-webkit-keyframes blink-animation
  50%
    opacity 0

.tracks
  width 100%
.segment
  display inline-block
  vertical-align top
  border-right 1px solid rgba(255,255,255,.1)
  padding 0 6px
  color #444


.segment-selected
  transform translate3d(0,0,0)
  animation blink-animation .25s 2 forwards
  -webkit-animation blink-animation .25s 2 forwards

.speaker-segment
  display block
  min-height 2em

.segment-chunk
  display inline-block

</style>
