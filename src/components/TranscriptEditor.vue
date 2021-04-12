<template>
  <v-layout
    v-if="transcriptHasSpeakers"
    class="transcript-editor-outer"
    style="height: auto">
    <speaker-panel />
    <v-flex ref="outer" @scroll="handleNativeScroll" class="tracks-outer pt-2">
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
        :update-on="['scrollTranscript', 'scrollToTranscriptEvent']" />
    </v-flex>
  </v-layout>
  <v-layout class="text-center" v-else>
    <v-btn
      @click="eventStore.userState.showSpeakerTierEditModal = true"
      class="elevation-0 text-lowercase ma-auto mt-5 white--text"
      color="grey darken-2"
      small>Set up Survey or add Speaker(s)</v-btn>
  </v-layout>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import SpeakerPanel from './SpeakerPanel.vue'
import Scrollbar from './Scrollbar.vue'
import settings from '../store/settings'
import _ from 'lodash'
import EventBus from '../service/event-bus'
// tslint:disable-next-line:max-line-length

import {
  eventStore,
  LocalTranscriptEvent,
  isEventSelected,
  findEventIndexById,
  findEventIndexAt
} from '../store/transcript'
import { getTextWidth } from '../util'

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

  throttledRenderer = _.throttle(this.updateList, 100)
  isEventSelected = isEventSelected

  get transcriptHasSpeakers(): boolean {
    return Object.values(this.eventStore.metadata.speakers).length > 0
  }

  setInnerLeft(l: number) {
    this.innerLeft = l
    requestAnimationFrame(() => {
      (this.$refs.inner as HTMLElement).style.transform = `translate3d(${ l }px, 0, 0)`
    })
  }

  getEventRange(start: number, end: number): LocalTranscriptEvent[] {
    // this is a very hot code path, so we optimize and don’t use .filter.
    const r = []
    for (let i = 0; i <= end - start; i++) {
      if (eventStore.events[start + i] !== undefined) {
        r[i] = eventStore.events[start + i]
      }
    }
    return r
  }

  // tslint:disable-next-line:max-line-length
  onChangeViewingEvent(e: LocalTranscriptEvent|null, opts: {
    animate: boolean,
    focusSpeaker: number|null,
    focusTier: string|null,
    focusRight: boolean
  }) {
    if (e !== null && e !== undefined) {
      this.doScrollToEvent(e, opts.animate, opts.focusSpeaker, opts.focusTier, opts.focusRight)
    }
  }

  // tslint:disable-next-line:max-line-length
  doScrollToEvent(e: LocalTranscriptEvent, animate = true, focusSpeaker: number|null = null, focusTier: string|null, focusRight: boolean) {
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
            // tslint:disable-next-line:max-line-length
            const speakerEvent = el.querySelector(`#speaker_event_tier_${focusSpeaker}__${focusTier || eventStore.metadata.defaultTier}`) as HTMLElement
            speakerEvent.focus()
            if (focusRight === true) {
              const range = document.createRange()
              range.selectNodeContents(speakerEvent)
              range.collapse(false)
              const sel = window.getSelection()
              if (sel !== null) {
                sel.removeAllRanges()
                sel.addRange(range)
              }
            }
          }
        }
      })
    })
  }

  @Watch('eventStore.events')
  onUpdateSpeakerEvents() {
    this.visibleEvents = this.getEventRange(this.currentIndex, this.currentIndex + defaultLimit)
  }

  get lastEventStartTime() {
    const lastEvent = _(eventStore.events).last()
    return lastEvent ? lastEvent.startTime : 0
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
        // await this.$nextTick()
      }
      const [ firstVisibleEvent, innerOffset, width ] = this.findFirstVisibleEventAndDimensions()
      if (firstVisibleEvent) {
        const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
        const progressFactor = (firstVisibleEvent.startTime - seconds) / eventLength
        const offsetLeft = width * progressFactor
        this.setInnerLeft(offsetLeft)
      }
    }
  }

  findFirstVisibleEventAndDimensions(): [LocalTranscriptEvent|null, number, number] {
    let width = 0
    let totalLeft = 0
    let obscuredHalfWidth = 0
    const first = this.visibleEvents.find((e, i) => {
      width = this.getEventWidth(e)
      obscuredHalfWidth = (totalLeft + this.innerLeft) * -1
      totalLeft = totalLeft + width
      return totalLeft >= this.innerLeft * -1
    })
    return [ first || null, obscuredHalfWidth, width ]
  }

  async debouncedEmitScroll() {
    const [firstVisibleEvent, innerOffset, width] = await this.findFirstVisibleEventAndDimensions()
    if (firstVisibleEvent) {
      const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
      const progressFactor = innerOffset / width
      const progress = progressFactor * eventLength
      EventBus.$emit('scrollTranscript', firstVisibleEvent.startTime + progress)
    }
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
      this.updateList(leftToRight, timesCalled + 1)
    }
  }

  handleMousewheel(e: MouseWheelEvent) {
    e.preventDefault()
    if (this.currentIndex === 0 && this.innerLeft >= 0 && (e.deltaX || e.deltaY) < 0) {
      // don’t scroll
    } else {
      this.scrollTranscriptBy(e.deltaX || e.deltaY, e.shiftKey)
    }
  }

  scrollTranscriptBy(pixels: number, fast = false) {
    this.lastScrollLeft = this.innerLeft
    this.setInnerLeft(this.innerLeft - pixels * (fast === true ? 2 : 1) * settings.scrollSpeed)
    this.debouncedEmitScroll()
    this.throttledRenderer(this.innerLeft <= this.lastScrollLeft)
    this.lastScrollLeft = this.innerLeft
  }

  handleNativeScroll(e: UIEvent) {
    const el = (e.target as HTMLElement)
    const distance = el.scrollLeft
    el.scrollLeft = 0
    this.setInnerLeft(this.innerLeft - distance)
  }
}
</script>

<style lang="stylus" scoped>

.transcript-editor-outer
  padding-top 10px
  .scrollbar
    margin 10px 10px 0 10px
    background rgba(0, 0, 0, .05)

.transcript-segments-inner
  will-change transform

.tracks-outer
  overflow hidden
  white-space nowrap

.tracks
  width 100%

</style>
