<template>
  <v-layout class="transcript-editor-outer" style="height: auto">
    <speaker-panel />
    <v-flex ref="outer" class="tracks-outer pt-2">
      <div
        @wheel="handleMousewheel"
        ref="tracks"
        class="tracks"
        v-if="eventStore.events.length">
        <div :style="{transform: `translate3d(${ innerLeft }px, 0, 0)`}" ref="inner" class="transcript-segments-inner">
          <segment-transcript
            v-for="(event, i) in visibleEvents"
            :event="event"
            :previous-event="visibleEvents[i - 1]"
            :next-event="visibleEvents[i + 1]"
            :key="event.eventId"
            :is-selected="isEventSelected(event.eventId)"
            :class="['segment', isEventSelected(event.eventId) && 'segment-selected']"
            @element-unrender="(width) => handleUnrender(width, i, event.eventId)"
            @element-render="(width) => handleRender(width, i, event.eventId)"
          />
        </div>
      </div>
      <scrollbar class="scrollbar" @scroll="scrollToSecond" update-on="scrollTranscript"/>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from '@components/SegmentTranscript.vue'
import SpeakerPanel from './SpeakerPanel.vue'
import Scrollbar from './Scrollbar.vue'
import settings from '@store/settings'
import * as _ from 'lodash'
import EventBus from '../service/event-bus'
// tslint:disable-next-line:max-line-length
import {
  eventStore,
  LocalTranscriptEvent,
  isEventSelected,
  findSegmentById,
  findSegmentAt,
  findSegmentIndexAt
} from '@store/transcript'
import { requestFrameAsync } from '../util'

const defaultLimit = 20

@Component({
  components: {
    Scrollbar,
    SpeakerPanel,
    SegmentTranscript
  }
})
export default class TranscriptEditor extends Vue {

  eventStore = eventStore
  userState = eventStore.userState
  settings = settings
  innerLeft = 0
  currentIndex = 0
  lastScrollLeft = 0
  visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
  emitScrollDebouncer: number|null = null
  throttledRenderer = _.throttle(this.updateList, 60)
  isEventSelected = isEventSelected

  @Watch('userState.viewingTranscriptEvent')
  doScrollToEvent(e: LocalTranscriptEvent) {
    // right in the middle
    const i = findSegmentById(e.eventId) - Math.floor(defaultLimit / 2)
    this.currentIndex = Math.max(0, i)
    this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        const el = this.$el.querySelector('.segment-selected')
        const c = this.$refs.tracks
        if (c instanceof HTMLElement && el instanceof HTMLElement) {
          this.innerLeft = el.offsetLeft * -1 + c.clientWidth / 2 - el.clientWidth / 2
          this.debouncedEmitScroll()
        }
      })
    })
  }

  scrollIntoView(e: Event, event: LocalTranscriptEvent) {
    const r = (e.target as HTMLElement).getBoundingClientRect()
    if (r.left < 57 || r.left + r.width > (this.$refs.outer as HTMLElement).clientWidth) {
      this.doScrollToEvent(event)
    }
  }

  @Watch('eventStore.events')
  onUpdateSpeakerEvents() {
    this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
  }

  mounted() {
    EventBus.$on('scrollWaveform', this.scrollLockedScroll)
  }

  beforeDestroy() {
    EventBus.$off('scrollWaveform', this.scrollLockedScroll)
  }

  scrollLockedScroll(t: number) {
    if (settings.lockScroll) {
      this.scrollToSecond(t)
    }
  }

  async scrollToSecond(seconds: number) {
    const i = findSegmentIndexAt(seconds)
    if (i !== -1) {
      await requestFrameAsync()
      if (i !== this.currentIndex) {
        this.visibleEvents = this.eventStore.events.slice(i, i + defaultLimit)
        this.currentIndex = i
        await this.$nextTick()
      }
      const [ firstVisibleEvent, innerOffset, width ] = this.findFirstVisibleEventAndDimensions()
      const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
      const progressFactor = (firstVisibleEvent.startTime - seconds) / eventLength
      const offsetLeft = width * progressFactor
      this.innerLeft = offsetLeft
    }
  }

  findFirstVisibleEventAndDimensions(): [LocalTranscriptEvent, number, number] {
    let innerOffset = 0
    let width = 0
    const nodeList = Array.from(this.$el.querySelectorAll('.segment') as NodeListOf<HTMLElement>)
    const firstVisibleIndex = nodeList.findIndex((v, i) => {
      innerOffset = this.innerLeft * -1 - v.offsetLeft
      width = v.clientWidth
      return v.offsetLeft + v.offsetWidth > this.innerLeft * -1
    })
    const firstVisibleEvent = firstVisibleIndex === -1 ? this.visibleEvents[0] : this.visibleEvents[firstVisibleIndex]
    return [ firstVisibleEvent, innerOffset, width ]
  }

  debouncedEmitScroll() {
    const [firstVisibleEvent, innerOffset, width] = this.findFirstVisibleEventAndDimensions()
    const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
    const progressFactor = innerOffset / width
    const progress = progressFactor * eventLength
    EventBus.$emit('scrollTranscript', firstVisibleEvent.startTime + progress)
  }

  handleRender(width: number, index: number, segment_id: string) {
    if (index === 0) {
      // console.log('rendered leftmost item', width, segment_id)
      this.innerLeft = this.innerLeft - width
    // RIGHT
    } else if (index === this.visibleEvents.length - 1) {
      // console.log('rendered rightmost item', width, segment_id)
      // this.innerLeft = this.innerLeft + width
    }
  }
  handleUnrender(width: number, index: number, segment_id: string) {
    // LEFTMOST ITEM
    if (index === 0) {
      // console.log('unrendered leftmost item', width, segment_id)
      this.innerLeft = this.innerLeft + width
    // RIGHT
    } else if (index === this.visibleEvents.length - 1) {
      // console.log('unrendered rightmost item', width, segment_id)
      // console.log('unrendered rightmost item', width)
      // this.innerLeft = this.innerLeft - width // padding
    }
  }

  updateList(leftToRight: boolean) {
    if (leftToRight) {
      // SCROLL LEFT TO RIGHT
      if (this.innerLeft <= -1500 && this.currentIndex + defaultLimit + 1 < this.eventStore.events.length) {
        this.currentIndex = this.currentIndex + 1
        this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
      } else {
        // NORMAL SCROLL, NO UPDATES
      }
    } else {
      // SCROLL RIGHT TO LEFT
      if (this.innerLeft >= -200 && this.currentIndex > 0) {
        this.currentIndex = this.currentIndex - 1
        this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
      } else {
        // NORMAL SCROLL, NO UPDATES
      }
    }
    // WAIT FOR THE ELEMENT TO RENDER,
    // AND RENDER THE NEXT IF NECESSARY.
    // RECURSION
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        if (
          (this.innerLeft <= -1500 || this.innerLeft >= -200) &&
          (this.currentIndex > 0 && this.currentIndex + defaultLimit + 1 < this.eventStore.events.length)
        ) {
          this.debouncedEmitScroll()
          this.updateList(leftToRight)
        }
      })
    })
  }

  handleMousewheel(e: MouseWheelEvent) {
    e.preventDefault()
    this.lastScrollLeft = this.innerLeft
    this.innerLeft = this.innerLeft - (e.deltaX || e.deltaY) / (e.shiftKey === true ? 10 : 1)
    this.debouncedEmitScroll()
    this.throttledRenderer(this.innerLeft <= this.lastScrollLeft)
    this.lastScrollLeft = this.innerLeft
  }
}
</script>

<style lang="stylus" scoped>

.transcript-editor-outer
  .scrollbar
    opacity 0
    margin-top 10px
    transition opacity .25s
  &:hover
    .scrollbar
      opacity 1


.transcript-segments-inner
  will-change transform

.tracks-outer
  overflow hidden
  white-space nowrap

.tracks
  width 100%

</style>
