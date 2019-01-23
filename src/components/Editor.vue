<template>
  <div class="fill-height">
    <v-toolbar class="topbar elevation-0" fixed app>
      <div>{{ eventStore.metadata.transcriptName || 'Untitled Transcript' }}</div>
      <v-spacer></v-spacer>
      <v-btn @click.stop="showSearch = true" icon flat>
        <v-icon>search</v-icon>
      </v-btn>
      <v-btn @click.stop="showSettings = true" icon flat>
        <v-icon>settings</v-icon>
      </v-btn>
      <v-btn class="mr-4" @click.stop="$emit('toggle-drawer')" icon flat>
        <v-icon>history</v-icon>
      </v-btn>
    </v-toolbar>
    <search
      v-if="showSearch"
      @close="showSearch = false"
      :show="showSearch" />
    <settings-view
      v-if="showSettings" 
      @close="showSettings = false"
      :show="showSettings" />
    <spectogram
      v-if="isSpectogramVisible"
      @close="isSpectogramVisible = false"
      :show="isSpectogramVisible"
      :event="spectogramEvent"
    />
    <wave-form
      tabindex="-1"
      class="no-outline"
      @keyup.native="handleKey"
      @change-metadata="changeMetadata"
      @scroll="handleScroll"
      @add-segment="addSegment"
      :height="300"
      :scroll-to-event="scrollToEvent"
      :scroll-to-second="scrollToSecond"
      :audio-element="audioElement">
      <play-head
        :audio-element="audioElement"
        @change-position="scrub"
        :metadata="metadata" />
      <div
        v-if="settings.showSegmentBoxes"
        class="absolute">
        <segment-box
          v-for="(event, key) in visibleEvents"
          :key="event.eventId"
          @contextmenu.native.stop.prevent="doShowMenu"
          :event="event"
          :previous-segment="visibleEvents[key - 1]"
          :next-segment="visibleEvents[key + 1]"
          :pixels-per-second="pixelsPerSecond">
        </segment-box>
        <v-menu
          min-width="150"
          lazy
          transition="none"
          v-model="showMenu"
          :position-x="menuX"
          :position-y="menuY"
          absolute
          offset-y>
          <v-list class="context-menu-list" dense>
            <v-list-tile
              @click="playEvent(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Play</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &#9251;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="splitSegmentFromMenu(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Split</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                ⌘S
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="scrollToTranscriptEvent(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Show Transcript</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                ⌘&#9166;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="showSpectogram(getSelectedEvent())">
              <v-list-tile-title>Show Spectrogram…</v-list-tile-title>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              @click="deleteSegment(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Delete</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &larr;
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
      <div slot="overview" ref="transcriptScrollbar" class="transcript-scrollbar">
        <triangle
          up
          class="transcript-scrollhandle"
          ref="transcriptScrollhandle" />
      </div>
    </wave-form>
    <transcript-editor
      @scroll="handleTranscriptScroll"
      @scroll-to-event="(e) => scrollToEvent = e"
      :scroll-to-index="scrollTranscriptIndex"/>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import waveForm from './Waveform.vue'
import settingsView from './Settings.vue'
import settings from '../store/settings'
import spectogram from './Spectogram.vue'
import search from './Search.vue'
import transcriptEditor from '@components/TranscriptEditor.vue'
import segmentBox from '@components/SegmentBox.vue'
import triangle from '@components/Triangle.vue'
import playHead from '@components/PlayHead.vue'
import * as _ from 'lodash'
import * as fns from 'date-fns'
import audio from '../service/audio'

import {
  getSelectedEvent,
  selectEvent,
  LocalTranscriptEvent,
  eventStore,
  playEvent,
  addSegment,
  deleteSegment,
  deleteEventById,
  splitSegment,
  findSegmentAt,
  selectNextEvent,
  selectPreviousEvent,
  scrollToTranscriptEvent
} from '@store/transcript'

@Component({
  components: {
    waveForm,
    transcriptEditor,
    settingsView,
    spectogram,
    playHead,
    segmentBox,
    search,
    triangle
  }
})
export default class Editor extends Vue {

  @Prop() audioElement: HTMLAudioElement

  eventStore = eventStore
  addSegment = addSegment
  deleteSegment = deleteSegment
  splitSegment = splitSegment
  findSegmentAt = findSegmentAt
  playEvent = playEvent
  getSelectedEvent = getSelectedEvent

  // TODO: percentages are impractical. use pixels
  segmentBufferPercent = .01
  metadata: any = null
  boundLeft = 0
  boundRight = 100
  scrollToEvent: LocalTranscriptEvent|null = null
  segmentPlayingTimeout: any = null
  scrollToSecond: number|null = null

  scrollTranscriptIndex: number = 0

  isSpectogramVisible = false
  spectogramEvent: LocalTranscriptEvent|null = null

  scrollToTranscriptEvent = scrollToTranscriptEvent
  settings = settings
  playHeadPos = 0
  showSettings = false
  showSearch = false
  showMenu = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  handleTranscriptScroll(e: number) {
    const i = (this.$refs.transcriptScrollhandle as Vue).$el
    const o = this.$refs.transcriptScrollbar as HTMLElement
    requestAnimationFrame(() => {
      if (settings.lockScroll) {
        this.scrollToSecond = e
      }
      const pixels = e / this.audioElement.duration * o.clientWidth
      i.style.transform = `translateX(${ pixels }px)`
    })
  }

  doShowMenu(e: MouseEvent) {
    // this is used for splitting
    this.layerX = e.layerX
    this.menuX = e.x
    this.menuY = e.y
    this.showMenu = true
  }

  splitSegmentFromMenu(event: LocalTranscriptEvent) {
    const splitAt = this.layerX / this.pixelsPerSecond
    this.splitSegment(event, splitAt)
  }

  showSpectogram(e: LocalTranscriptEvent) {
    this.isSpectogramVisible = true
    this.spectogramEvent = e
  }

  handleKey(e: KeyboardEvent) {
    console.log(this.playHeadPos)
    if (e.key === 'c') {
      const event = this.findSegmentAt(this.playHeadPos)
      if (event === undefined) {
        const s = this.addSegment(this.playHeadPos)
        if (s !== undefined) {
          this.$nextTick(() => selectEvent(s))
        }
      } else {
        const splitAt = this.playHeadPos - event.startTime
        this.splitSegment(event, splitAt)
      }
    } else if (e.key === 'Backspace') {
      if (this.eventStore.selectedEventIds.length === 1) {
        deleteEventById(this.eventStore.selectedEventIds[0])
      }
    }
  }

  mounted() {
    console.log('mounted')
    console.log(this.audioElement)
    if (this.audioElement instanceof HTMLAudioElement) {
      console.log('inner')
      this.audioElement.addEventListener('pause', () => {
        if (this.segmentPlayingTimeout !== null) {
          clearTimeout(this.segmentPlayingTimeout)
          this.segmentPlayingTimeout = null
        }
      })
    }
  }

  scrub(time: number) {
    this.playHeadPos = time
    this.audioElement.currentTime = time
  }

  selectAndScrollToEvent(e: LocalTranscriptEvent) {
    selectEvent(e)
    this.$nextTick(() => {
      this.scrollToEvent = e
    })
  }

  get visibleEvents() {
    return _(this.eventStore.events)
      .filter((s) => {
        return s.startTime >= this.boundLeft && s.endTime <= this.boundRight
      })
      .sortBy('startTime')
      .value()
  }

  handleScroll(e: Event) {
    if (this.eventStore.playingEvent === null) {
      requestAnimationFrame(() => {
        const el = (e.target as HTMLElement)
        const w = el.scrollWidth
        const l = el.scrollLeft
        const cw = el.clientWidth
        const scrollFactorLeft = l / w
        const scrollFactorRight = (l + cw) / w
        this.boundLeft = this.audioElement.duration * (scrollFactorLeft - this.segmentBufferPercent)
        this.boundRight = this.audioElement.duration * (scrollFactorRight + this.segmentBufferPercent)
      })
    }
    if (this.showMenu) {
      this.showMenu = false
    }
  }

  selectPrevious(i: number) {
    selectPreviousEvent()
  }

  selectNext(i: number) {
    selectNextEvent()
  }
  changeMetadata(metadata: any) {
    console.log({metadata})
    this.metadata = metadata
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
.transcript-title
  font-weight 300
  opacity .5
.tracks
  white-space nowrap
  overflow-x hidden
  padding 10px 40px 20px 40px
  &::-webkit-scrollbar
  &::-webkit-scrollbar-button
  &::-webkit-scrollbar-track
  &::-webkit-scrollbar-track-piece
    opacity 0
  &::-webkit-scrollbar-thumb
    background-color rgba(255,255,255,.4)
    border-radius 5px
    border 3px solid transparent
    border-radius 9px
    background-clip content-box
  // &::-webkit-scrollbar-corner
  // &::-webkit-resizer

.transcript-scrollbar
  top -15px
  position relative
  height 20px

.jump-to
  opacity 0
  positon absolute
  top 5px
  right 5px

.context-menu-list
  color #b7b7b7
  a
    cursor default !important

</style>
