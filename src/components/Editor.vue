<template>
  <div class="fill-height">
    <v-toolbar class="topbar elevation-0" fixed app>
      <div>{{ eventStore.metadata.transcriptName || 'Untitled Transcript' }}</div>
      <v-spacer></v-spacer>
      <div>
        <search :show="showSearch" />
      </div>
      <div class="pr-4">
        <v-tooltip transition="none" bottom>
          <v-btn slot="activator" @click.stop="showSettings = true" icon flat>
            <v-icon>settings</v-icon>
          </v-btn>
          <span>Settings</span>
        </v-tooltip>
        <v-tooltip transition="none" bottom>
          <v-btn
            @click="saveToServer"
            :loading="eventStore.status === 'loading' || isSaving"
            :disabled="eventStore.status === 'loading' || isSaving"
            slot="activator"
            icon flat>
            <v-icon>save_alt</v-icon>
            <template v-slot:loader>
              <v-progress-circular
                color="#fff"
                :size="16"
                :rotate="-90"
                :width="2"
                :indeterminate="eventStore.transcriptDownloadProgress === 1"
                :value="eventStore.transcriptDownloadProgress * 100" />
            </template>
          </v-btn>
          <span>Save</span>
        </v-tooltip>
        <v-tooltip transition="none" bottom>
          <v-btn slot="activator" @click.stop="$emit('toggle-drawer')" icon flat>
            <v-badge color="error" overlap :value="errors.length > 0">
              <span slot="badge">{{ errors.length }}</span>
              <v-icon>history</v-icon>
            </v-badge>
          </v-btn>
          <span>History & Errors</span>
        </v-tooltip>
      </div>
    </v-toolbar>
    <settings-view
      v-if="showSettings" 
      @close="showSettings = false"
      :show="showSettings" />
    <spectrogram
      v-if="isSpectrogramVisible"
      @close="isSpectrogramVisible = false"
      :show="isSpectrogramVisible"
      :event="spectrogramEvent"
    />
    <wave-form
      tabindex="-1"
      class="no-outline"
      @keydown.native="handleKey"
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
          v-for="(event, i) in visibleEvents"
          :key="event.eventId"
          @contextmenu.native.stop.prevent="doShowMenu"
          :event="event"
          :previous-event="visibleEvents[i - 1]"
          :next-event="visibleEvents[i + 1]"
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
                ⌘&#9166;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="splitSegmentFromMenu(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Split</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>S</v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="eventStore.selectedEventIds.length < 2"
              @click="joinEvents(eventStore.selectedEventIds)">
              <v-list-tile-content>
                <v-list-tile-title>Join</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>J</v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="scrollToTranscriptEvent(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Show Transcript</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &#9166;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="showSpectrogram(getSelectedEvent())">
              <v-list-tile-title>Show Spectrogram…</v-list-tile-title>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              @click="deleteEvent(getSelectedEvent())">
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
        <div v-if="this.audioElement !== undefined" class="error-overview-container">
          <div
            v-for="(error) in errors"
            :key="error.eventId"
            class="error-overview"
            :style="{ left: `${ error.startTime / audioElement.duration * 100}%` }" />
        </div>
        <div v-if="this.audioElement !== undefined" class="search-overview-container">
          <div
            v-for="(result) in eventStore.searchResults"
            :key="result.eventId"
            :class="['result-overview', isEventSelected(result.eventId) && 'result-selected']"
            :style="{ left: `${ result.startTime / audioElement.duration * 100}%` }" />
        </div>
      </div>
    </wave-form>
    <transcript-editor
      :pixels-per-second="pixelsPerSecond"
      @scroll="handleTranscriptScroll"
      @scroll-to-event="(e) => scrollToEvent = e"
      :scroll-to-time="scrollTranscriptTime"
      :scroll-to-index="scrollTranscriptIndex"/>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import waveForm from './Waveform.vue'
import settingsView from './Settings.vue'
import settings from '../store/settings'
import spectrogram from './Spectrogram.vue'
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
  deleteEvent,
  deleteEventById,
  splitSegment,
  findSegmentAt,
  selectNextEvent,
  selectPreviousEvent,
  scrollToTranscriptEvent,
  joinEvents,
  isEventSelected,
  history,
  saveChangesToServer
} from '@store/transcript'

@Component({
  components: {
    waveForm,
    transcriptEditor,
    settingsView,
    spectrogram,
    playHead,
    segmentBox,
    search,
    triangle
  }
})
export default class Editor extends Vue {

  @Prop() audioElement: HTMLAudioElement

  errors: LocalTranscriptEvent[] = []
  eventStore = eventStore
  addSegment = addSegment
  deleteEvent = deleteEvent
  splitSegment = splitSegment
  findSegmentAt = findSegmentAt
  playEvent = playEvent
  getSelectedEvent = getSelectedEvent
  joinEvents = joinEvents
  isEventSelected = isEventSelected
  history = history

  // TODO: percentages are impractical. use pixels
  segmentBufferPercent = .01
  metadata: any = null
  boundLeft = 0
  boundRight = 100
  scrollToEvent: LocalTranscriptEvent|null = null
  segmentPlayingTimeout: any = null
  scrollToSecond: number|null = null
  scrollTranscriptIndex: number = 0
  scrollTranscriptTime: number = 0

  isSpectrogramVisible = false
  spectrogramEvent: LocalTranscriptEvent|null = null

  scrollToTranscriptEvent = scrollToTranscriptEvent
  settings = settings
  playHeadPos = 0
  showSettings = false
  showSearch = false
  showMenu = false
  isSaving = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  async saveToServer() {
    if (this.history.length > 0) {
      this.isSaving = true
      try {
        await saveChangesToServer()
      } catch (e) {
        console.log(e)
      } finally {
        this.isSaving = false
      }
    }
  }

  handleTranscriptScroll(e: number) {
    const i = (this.$refs.transcriptScrollhandle as Vue).$el
    const o = this.$refs.transcriptScrollbar as HTMLElement
    requestAnimationFrame(() => {
      if (settings.lockScroll) {
        this.scrollToSecond = e
      }
      const pixels = e / this.audioElement.duration * o.clientWidth;
      (i as HTMLElement).style.transform = `translateX(${ pixels }px)`
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

  showSpectrogram(e: LocalTranscriptEvent) {
    this.isSpectrogramVisible = true
    this.spectrogramEvent = e
  }

  async handleKey(e: KeyboardEvent) {
    console.log(this.playHeadPos)
    console.log(e)
    // _(settings.keyboardShortcuts).forEach((v, i) => {
    //   if (v.key === e.key && (v.modifier === null || (e as any)[v.modifier] === true)) {
    //   }
    // })
    if (e.key === 's') {
      const event = this.findSegmentAt(this.playHeadPos)
      if (event === undefined) {
        const s = this.addSegment(this.playHeadPos)
        await this.$nextTick()
        selectEvent(s)
      } else {
        const splitAt = this.playHeadPos - event.startTime
        this.splitSegment(event, splitAt)
      }
    } else if (e.key === 'Backspace') {
      this.eventStore.selectedEventIds.forEach(deleteEventById)
      this.eventStore.selectedEventIds = []
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'ArrowRight') {
        // const oldFocusEl = document.activeElement as HTMLElement
        selectNextEvent()
        // this.$nextTick(() => oldFocusEl.focus())
      } else {
        selectPreviousEvent()
      }
      this.$nextTick(() => {
        setTimeout(() => {
          const el = (document.querySelector('.segment.selected') as HTMLElement)
          // el.scrollIntoView({ behavior: 'smooth' })
          el.focus()
        }, 0)
      })
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

  handleScroll(e: MouseEvent, time?: number) {
    if (this.settings.lockScroll && time) {
      this.scrollTranscriptTime = time
    }
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

.error-overview
  top 12px
  opacity 0.5
  background #f00
  width 7px
  height 7px
  position absolute
  border-radius 1px

.result-overview
  background #447720
  width 7px
  height 7px
  position absolute
  border-radius 1px
  top -59px
  opacity 0
  animation fadeIn
  -webkit-animation fadeIn ease-in 1
  animation-fill-mode forwards
  -webkit-animation-duration .2s
  -moz-animation-duration .2s
  animation-duration .2s
  &.result-selected
    z-index 1
    background #6BBB32
</style>
