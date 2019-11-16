<template>
  <v-layout class="transcript-editor-outer" style="height: auto">
    <speaker-panel />
    <v-flex ref="outer" class="tracks-outer pt-2">
      <div
        @wheel="handleMousewheel"
        ref="tracks"
        class="tracks"
        v-if="eventStore.events.length">
        <div ref="inner" class="transcript-segments-inner">
          <segment-transcript
            v-for="event in visibleEvents"
            :event="event"
            :is-selected="isEventSelected(event.eventId)"
            :data-event-id="event.eventId"
            :key="event.eventId"
            :class="['segment', isEventSelected(event.eventId) && 'segment-selected']"
          />
        </div>
      </div>
      <scrollbar
        :max-time="lastEventStartTime"
        class="scrollbar"
        @scroll="scrollToSecond"
        update-on="scrollTranscript" />
    </v-flex>
  </v-layout>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import SpeakerPanel from './SpeakerPanel.vue'
import Scrollbar from './Scrollbar.vue'
import settings from '../store/settings'
import * as _ from 'lodash'
import EventBus from '../service/event-bus'
// tslint:disable-next-line:max-line-length
import {
  eventStore,
  LocalTranscriptEvent,
  isEventSelected,
  findEventIndexById,
  findEventAt,
  findEventIndexAt
} from '../store/transcript'
import { requestFrameAsync, clone, getTextWidth } from '../util'

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
  innerLeft = 0
  currentIndex = 0
  lastScrollLeft = 0
  visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
  lastEventStartTime = 0

  throttledRenderer = _.throttle(this.updateList, 100)
  isEventSelected = isEventSelected

  setInnerLeft(l: number) {
    this.innerLeft = l;
    requestAnimationFrame(() => (this.$refs.inner as HTMLElement).style.transform = `translate3d(${ l }px, 0, 0)`)
  }

  getEventRange(start: number, end: number): LocalTranscriptEvent[] {
    const r = []
    for (let i = 0; i <= end - start; i++) {
      if (eventStore.events[start + i] !== undefined) {
        r[i] = eventStore.events[start + i]
      }
    }
    return r
    // return eventStore.events.filter((e, i) => i >= start && i <= end)
  }

  // tslint:disable-next-line:max-line-length
  onChangeViewingEvent(e: LocalTranscriptEvent|null, opts: { animate: boolean, focusSpeaker: number|null, focusTier: string|null }) {
    if (e !== null && e !== undefined) {
      this.doScrollToEvent(e, opts.animate, opts.focusSpeaker, opts.focusTier)
    }
  }

  doScrollToEvent(e: LocalTranscriptEvent, animate = true, focusSpeaker: number|null = null, focusTier: string|null) {
    // right in the middle
    const i = findEventIndexById(e.eventId) - Math.floor(defaultLimit / 2)
    this.currentIndex = Math.max(0, i)
    this.visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        const el = this.$el.querySelector(`[data-event-id="${e.eventId}"]`)
        const c = this.$refs.tracks
        const inner = this.$refs.inner
        if (
          c instanceof HTMLElement &&
          el instanceof HTMLElement &&
          inner instanceof HTMLElement
        ) {
          if (animate === true) {
            inner.style.transition = '.2s'
            setTimeout(() => { inner.style.transition = 'none' }, 200)
          }
          this.setInnerLeft(el.offsetLeft * -1 + c.clientWidth / 2 - el.clientWidth / 2 - 25)
          if (focusSpeaker !== null) {
            // (el.querySelector(`[data-speaker-id="${ focusSpeaker }"] [contenteditable]`) as any).focus()
            // (el.querySelector(`[contenteditable]`) as any).focus()
            (el.querySelector(
              `#speaker_event_tier_${focusSpeaker}__${focusTier || eventStore.metadata.defaultTier}`
            ) as any).focus()
          }
        }
      })
    })
  }

  @Watch('eventStore.events')
  onUpdateSpeakerEvents() {
    this.visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
    const lastEvent = _(eventStore.events).last()
    this.lastEventStartTime = lastEvent ? lastEvent.startTime : 0
  }

  mounted() {
    EventBus.$on('scrollWaveform', this.scrollLockedScroll)
    EventBus.$on('scrollToTranscriptEvent', this.onChangeViewingEvent)
  }

  beforeDestroy() {
    EventBus.$off('scrollWaveform', this.scrollLockedScroll)
    EventBus.$off('scrollToTranscriptEvent', this.onChangeViewingEvent)
  }

  scrollLockedScroll(t: number) {
    if (settings.lockScroll) {
      this.scrollToSecond(t)
    }
  }

  async scrollToSecond(seconds: number) {
    const i = findEventIndexAt(seconds)
    if (i !== -1) {
      if (i !== this.currentIndex) {
        this.visibleEvents = this.getEventRange(i, i + defaultLimit)
        this.currentIndex = i
        await this.$nextTick()
      }
      const [ firstVisibleEvent, innerOffset, width ] = await this.findFirstVisibleEventAndDimensions()
      const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
      const progressFactor = (firstVisibleEvent.startTime - seconds) / eventLength
      const offsetLeft = width * progressFactor
      this.setInnerLeft(offsetLeft)
    }
  }

  async findFirstVisibleEventAndDimensions(): Promise<[LocalTranscriptEvent, number, number]> {
    let innerOffset = 0
    let width = 0
    await requestFrameAsync()
    const nodeList = Array.from(this.$el.querySelectorAll('.segment') as NodeListOf<HTMLElement>)
    const firstVisibleIndex = nodeList.findIndex((v, i) => {
      innerOffset = this.innerLeft * -1 - v.offsetLeft
      width = v.clientWidth
      return v.offsetLeft + v.offsetWidth > this.innerLeft * -1
    })
    const firstVisibleEvent = firstVisibleIndex === -1 ? this.visibleEvents[0] : this.visibleEvents[firstVisibleIndex]
    return [ firstVisibleEvent, innerOffset, width ]
  }

  async debouncedEmitScroll() {
    const [firstVisibleEvent, innerOffset, width] = await this.findFirstVisibleEventAndDimensions()
    const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
    const progressFactor = innerOffset / width
    const progress = progressFactor * eventLength
    EventBus.$emit('scrollTranscript', firstVisibleEvent.startTime + progress)
  }

  getLongestSpeakerText(e: LocalTranscriptEvent): string[]|undefined {
    return _(e.speakerEvents)
      .map(se => se.tokens.map(t => t.tiers[eventStore.metadata.defaultTier].text))
      .sortBy(ts => ts.length)
      .last()
  }

  getEventWidth(e: LocalTranscriptEvent): number {
    const totalPadding = 20
    const longestText = this.getLongestSpeakerText(e)
    if (longestText !== undefined) {
      return  Math.max(getTextWidth(longestText.join(' '), 14, 'HKGrotesk') + totalPadding, 146)
    } else {
      return 0
    }
  }

  updateList(leftToRight: boolean, timesCalled = 0) {
    if (leftToRight) {
      // SCROLL LEFT TO RIGHT
      if (this.innerLeft <= -1500 && this.currentIndex + defaultLimit + 1 < this.eventStore.events.length) {
        const removedEvent = eventStore.events[this.currentIndex]
        const removedEventWidth = this.getEventWidth(removedEvent)
        this.setInnerLeft(this.innerLeft + removedEventWidth)
        this.currentIndex = this.currentIndex + 1
        this.visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
      } else {
        // NORMAL SCROLL, NO UPDATES
      }
    } else {
      // SCROLL RIGHT TO LEFT
      if (this.innerLeft >= -200 && this.currentIndex > 0) {
        const addedEvent = eventStore.events[this.currentIndex - 1]
        const addedEventWidth = this.getEventWidth(addedEvent)
        this.setInnerLeft(this.innerLeft - addedEventWidth)
        this.currentIndex = this.currentIndex - 1
        this.visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
      } else {
        // NORMAL SCROLL, NO UPDATES
      }
    }
    // RECURSION

    if (
      (timesCalled <= defaultLimit) &&
      (this.innerLeft <= -1500 || this.innerLeft >= -200) &&
      (this.currentIndex > 0 && this.currentIndex + defaultLimit + 1 < this.eventStore.events.length)
    ) {
      this.debouncedEmitScroll()
      this.updateList(leftToRight, timesCalled + 1)
    }
  }

  handleMousewheel(e: MouseWheelEvent) {
    e.preventDefault()
    if (this.currentIndex === 0 && this.innerLeft >= 0 && (e.deltaX || e.deltaY) < 0) {
      // don’t scroll
    } else {
      this.lastScrollLeft = this.innerLeft
      this.setInnerLeft(this.innerLeft - (e.deltaX || e.deltaY) / (e.shiftKey === true ? 10 : 1))
      this.throttledRenderer(this.innerLeft <= this.lastScrollLeft)
      this.debouncedEmitScroll()
      this.lastScrollLeft = this.innerLeft
    }
  }
}
</script>

<style lang="stylus" scoped>

.transcript-editor-outer
  padding-top 10px
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
