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
        <v-menu
          :disabled="eventStore.status === 'loading' || isSaving"
          open-on-hover
          min-width="150"
          nudge-bottom="10"
          transition="none"
          offset-y>
          <v-btn
            slot="activator"
            @click="saveToServer"
            :loading="eventStore.status === 'loading' || isSaving"
            :disabled="eventStore.status === 'loading' || isSaving"
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
          <v-list dense class="context-menu-list">
            <v-list-tile @click="exportJSON">
              <v-list-tile-content>
                <v-list-tile-title>Export Transcript</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile @click="exportProject">
              <v-list-tile-content>
                <v-list-tile-title>Export Project</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider />
            <v-list-tile @click="saveToServer">
              <v-list-tile-content>
                <v-list-tile-title>Save To Server</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-menu>
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
      @keydown.native="handleWaveformKey"
      @change-metadata="changeMetadata"
      @scroll="handleScroll"
      @show-menu="doShowMenu"
      @add-segment="addSegment"
      :height="300"
      :scroll-to-event="scrollToEvent" >
      <play-head
        @change-position="scrub"
        :metadata="metadata" />
      <div
        v-if="settings.showSegmentBoxes"
        class="absolute">
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
              <v-list-tile-title>Inspect Audio…</v-list-tile-title>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              @click="deleteSelectedEvents">
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
      <div slot="overview">
        <div v-if="eventStore.audioElement !== undefined" class="error-overview-container">
          <div
            v-for="(error) in errors"
            :key="error.eventId"
            class="error-overview"
            :style="{ left: `${ error.startTime / eventStore.audioElement.duration * 100}%` }" />
        </div>
        <div v-if="eventStore.audioElement !== undefined" class="search-overview-container">
          <search-results />
        </div>
      </div>
    </wave-form>
    <transcript-editor />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import waveForm from './Waveform.vue'
import settingsView from './Settings.vue'
import settings from '../store/settings'
import spectrogram from './Spectrogram.vue'
import search from './Search.vue'
import searchResults from './SearchResults.vue'
import transcriptEditor from './TranscriptEditor.vue'
import playHead from './PlayHead.vue'
import scrollbar from './Scrollbar.vue'
import * as _ from 'lodash'
import * as fns from 'date-fns'
import { saveAs } from 'file-saver'
import * as humanSize from 'human-size'
import audio from '../service/audio'
import { requestFrameAsync } from '../util/index'

import {
  getSelectedEvent,
  selectEvent,
  LocalTranscriptEvent,
  eventStore,
  playEvent,
  addSegment,
  deleteSelectedEvents,
  splitSegment,
  findSegmentAt,
  selectNextEvent,
  selectPreviousEvent,
  scrollToTranscriptEvent,
  joinEvents,
  isEventSelected,
  saveChangesToServer
} from '../store/transcript'

import { history, undoable, undo, redo } from '../store/history'
import { serverTranscript } from '../service/backend-server'
import { generateProjectFile } from '../service/backend-files'

@Component({
  components: {
    waveForm,
    transcriptEditor,
    settingsView,
    spectrogram,
    playHead,
    search,
    searchResults,
    scrollbar
  }
})
export default class Editor extends Vue {

  errors: LocalTranscriptEvent[] = []
  eventStore = eventStore
  findSegmentAt = findSegmentAt
  playEvent = playEvent
  getSelectedEvent = getSelectedEvent
  isEventSelected = isEventSelected
  history = history

  metadata: any = null
  scrollToEvent: LocalTranscriptEvent|null = null
  segmentPlayingTimeout: any = null
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

  async exportJSON() {
    if (serverTranscript !== null) {
      const b = new Blob([ JSON.stringify(this.eventStore.events, undefined, 4) ], {
        type: 'application/json;charset=UTF-8'
      })
      saveAs(b, this.eventStore.metadata.transcriptName! + '.json')
    }
  }

  joinEvents(es: number[]) {
    return undoable(joinEvents(es))
  }

  deleteSelectedEvents() {
    return undoable(deleteSelectedEvents())
  }

  async exportProject() {
    this.isSaving = true
    const overviewWave = (document.querySelector('.overview-waveform svg') as HTMLElement).innerHTML
    const f = await generateProjectFile(eventStore, overviewWave, settings, audio.store.uint8Buffer, history.actions)
    saveAs(f, eventStore.metadata.transcriptName! + '.transcript')
    this.isSaving = false
  }

  async saveToServer() {
    if (this.history.actions.length > 0) {
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

  addSegment(pos: number) {
    return undoable(addSegment(pos))
  }

  splitSegment(e: LocalTranscriptEvent, at: number) {
    return undoable(splitSegment(e, at))
  }

  async handleWaveformKey(e: KeyboardEvent) {
    if (e.key === 's') {
      const eventUnderPlayHead = this.findSegmentAt(this.playHeadPos)
      if (eventUnderPlayHead === undefined) {
        const newEvent = this.addSegment(this.playHeadPos)[0]
        await this.$nextTick()
        selectEvent(newEvent)
      } else {
        const splitAt = this.playHeadPos - eventUnderPlayHead.startTime
        this.splitSegment(eventUnderPlayHead, splitAt)
      }
    } else if (e.key === 'Backspace') {
      this.deleteSelectedEvents()
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
    if (eventStore.audioElement instanceof HTMLAudioElement) {
      console.log('inner')
      eventStore.audioElement.addEventListener('pause', () => {
        if (this.segmentPlayingTimeout !== null) {
          clearTimeout(this.segmentPlayingTimeout)
          this.segmentPlayingTimeout = null
        }
      })
    }

    document.body.addEventListener('keydown', (e) => {
      if (e.metaKey && !e.shiftKey && e.key === 'z') {
        undo()
      } else if (e.metaKey && e.shiftKey && e.key === 'z') {
        redo()
      }
    })

  }

  scrub(time: number) {
    this.playHeadPos = time
    eventStore.audioElement.currentTime = time
  }

  selectAndScrollToEvent(e: LocalTranscriptEvent) {
    selectEvent(e)
    this.$nextTick(() => {
      this.scrollToEvent = e
    })
  }

  async handleScroll() {
    if (this.showMenu === true) {
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

</style>
