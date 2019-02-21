<template>
  <v-layout>
    <v-flex :style="theme" class="pt-4 speaker-panel" xs1>
      <div
        :style="{height: speakerHeight}"
        :key="i" v-for="(speaker, i) in eventStore.metadata.speakers"
        class="speaker">
        <v-menu
          close-delay="500"
          close-on-content-click
          transition="fade-transition"
          right
          offset-x
          nudge-right="12"
          nudge-top="5">
          <div slot="activator" class="speaker-name">
            <span class="speaker-triangle">▶</span> {{ speaker.k }}
          </div>
          <v-list class="context-menu-list" dense>
            <v-list-tile
              v-for="(tier, i) in eventStore.metadata.tiers"
              :key="i"
              :disabled="tier.name === 'default'"
              @click="tier.show = !tier.show">
              <v-list-tile-avatar>
                <v-icon v-if="tier.show">check</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{ tier.name }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
    </v-flex>
    <v-flex class="tracks-outer pt-2">
      <div
        @wheel="handleMousewheel"
        ref="tracks"
        class="tracks"
        v-if="eventStore.events.length">
        <div :style="{transform: `translateX(${ innerLeft }px)`}" ref="inner" class="transcript-segments-inner">
          <segment-transcript
            v-for="(event, i) in visibleEvents"
            :event="event"
            :key="event.eventId"
            :is-selected="isEventSelected(event.eventId)"
            :class="['segment', isEventSelected(event.eventId) && 'segment-selected']"
            @scroll-to-event="(e) => $emit('scroll-to-event', e)"
            @element-unrender="(width) => handleUnrender(width, i, event.eventId)"
            @element-render="(width) => handleRender(width, i, event.eventId)"
          />
        </div>
      </div>
    </v-flex>
  </v-layout>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from '@components/SegmentTranscript.vue'
import settings from '@store/settings'
import * as _ from 'lodash'
// tslint:disable-next-line:max-line-length
import { eventStore, LocalTranscriptEvent, isEventSelected, findSegmentById, findSegmentAt, findSegmentIndexAt } from '@store/transcript'

const defaultLimit = 20

@Component({
  components: {
    SegmentTranscript
  }
})
export default class TranscriptEditor extends Vue {

  @Prop({ default: 0 }) scrollToIndex: number
  @Prop() pixelsPerSecond: number
  @Prop({ default: 0 }) scrollToTime: number

  eventStore = eventStore
  userState = eventStore.userState
  settings = settings
  innerLeft = 0
  currentIndex = this.scrollToIndex
  lastScrollLeft = 0
  visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
  throttledRenderer = _.throttle(this.updateList, 60)
  throttledEmitter = _.throttle(this.emitScroll, 60)
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
          this.emitScroll()
        }
      })
    })
  }

  get speakerHeight() {
    return eventStore.metadata.tiers.filter(t => t.show === true).length * 25 + 1 + 'px'
  }

  @Watch('eventStore.events')
  onUpdateSpeakerEvents() {
    this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
  }

  mounted() {
    // this.emitScroll()
  }

  @Watch('scrollToTime')
  async onScrollToSecond(seconds: number) {
    // TODO: re-enable
    // const i = findSegmentIndexAt(seconds)
    // // const event = this.eventStore.events[i]
    // if (i !== undefined) {
    //   if (i !== this.currentIndex) {
    //     this.visibleEvents = this.eventStore.events.slice(i, i + defaultLimit)
    //     this.currentIndex = i
    //     await this.$nextTick()
    //   }
    //   const [ firstVisibleEvent, innerOffset, width ] = this.findFirstVisibleEventAndDimensions()
    //   const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
    //   const progressFactor = (firstVisibleEvent.startTime - seconds) / eventLength
    //   const offsetLeft = width * progressFactor
    //   console.log({offsetLeft, progressFactor, i})
    //   this.innerLeft = offsetLeft
    // }
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
    const firstVisibleEvent = this.visibleEvents[firstVisibleIndex]
    // console.log(firstVisibleIndex, firstVisibleEvent.startTime, firstVisibleEvent.eventId)
    return [ firstVisibleEvent, innerOffset, width ]
  }

  emitScroll() {
    const [firstVisibleEvent, innerOffset, width] = this.findFirstVisibleEventAndDimensions()
    const eventLength = firstVisibleEvent.endTime - firstVisibleEvent.startTime
    const progressFactor = innerOffset / width
    const progress = progressFactor * eventLength
    // console.log(currentEvent.startTime + progress, progress)
    // console.log(firstVisibleEvent.startTime + progress)
    this.$emit('scroll', firstVisibleEvent.startTime + progress)
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
      }
    } else {
      // SCROLL RIGHT TO LEFT
      if (this.innerLeft >= -200 && this.currentIndex > 0) {
        this.currentIndex = this.currentIndex - 1
        this.visibleEvents = this.eventStore.events.slice(this.currentIndex, this.currentIndex + defaultLimit)
      }
    }
    // WAIT FOR THE ELEMENT TO RENDER,
    // AND RENDER THE NEXT IF NECESSARY.
    // RECURSION
    this.$nextTick(() => {
      requestAnimationFrame(() => {
        this.emitScroll()
        if (
          (this.innerLeft <= -1500 || this.innerLeft >= -200) &&
          (this.currentIndex > 0 && this.currentIndex + defaultLimit + 1 < this.eventStore.events.length)
        ) {
          this.updateList(leftToRight)
        }
      })
    })
  }

  handleMousewheel(e: MouseWheelEvent) {
    e.preventDefault()
    this.lastScrollLeft = this.innerLeft
    this.innerLeft = this.innerLeft - (e.deltaX || e.deltaY) / (e.shiftKey === true ? 10 : 1)
    this.throttledRenderer(this.innerLeft <= this.lastScrollLeft)
    this.lastScrollLeft = this.innerLeft
  }
  get theme() {
    if (this.settings.darkMode) {
      return { background: 'rgb(50, 50, 50)' }
    } else {
      return { background: '#efefef' }
    }
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

.tracks-outer
  overflow hidden
  white-space nowrap

.speaker-panel
  z-index 1

.speaker
  cursor default
  padding .2em 1em
  border-radius 1px
  border-bottom 1px solid rgba(255,255,255,.1)
  font-weight 300
  font-size 90%
  line-height 1.6em
  &:hover
    background rgba(0,0,0,0)
  .speaker-name
    opacity .7
    white-space nowrap
  .speaker-triangle
    font-size 70%
    display inline-block
    vertical-align middle
    margin-right .2em

.tracks
  width 100%

.segment
  display inline-block
  vertical-align top
  border-right 1px solid rgba(255,255,255,.1)
  padding 0 6px
  color #444

.speaker-segment
  display block
  min-height 2em

.segment-chunk
  display inline-block

</style>
