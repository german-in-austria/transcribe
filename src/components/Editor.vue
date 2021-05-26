<template>
  <div class="fill-height">
    <v-toolbar class="elevation-0" fixed app>
      <v-flex xs4>
        <v-btn icon @click="reload"><f-icon value="chevron_left" /></v-btn>
      </v-flex>
      <v-flex xs4 class="text-xs-center">
        <div style="opacity: .7; font-size: small">{{ eventStore.metadata.transcriptName || 'Untitled Transcript' }}</div>
      </v-flex>
      <v-flex xs4 class="text-xs-right">
        <div style="display: inline-block">
          <v-menu
            lazy
            :disabled="eventStore.status === 'loading' || isSaving"
            open-on-hover
            min-width="150"
            :transition="false"
            offset-y>
            <v-btn
              slot="activator"
              @click="saveToServer"
              :loading="eventStore.status === 'loading' || isSaving"
              :disabled="eventStore.status === 'loading' || isSaving"
              icon flat>
              <f-icon value="save_alt" />
              <template v-slot:loader>
                <v-progress-circular
                  :color="settings.darkMode ? '#fff' : '#333'"
                  :size="16"
                  :rotate="-90"
                  :width="2"
                  :indeterminate="eventStore.transcriptDownloadProgress === 1 || isSaving"
                  :value="eventStore.transcriptDownloadProgress * 100" />
              </template>
            </v-btn>
            <v-list dense class="context-menu-list">
              <v-list-tile @click="exportProject">
                <v-list-tile-content>
                  <v-list-tile-title>Download Project</v-list-tile-title>
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
        </div>
      </v-flex>
    </v-toolbar>
    <transcript-settings
      v-if="eventStore.userState.showSpeakerTierEditModal"
      @close="eventStore.userState.showSpeakerTierEditModal = false"
    />
    <settings-view
      v-if="settings.showSettings"
      @close="settings.showSettings = false"
      :show="settings.showSettings" />
    <event-inspector
      v-if="eventStore.inspectedEvent !== null"
      :show="eventStore.inspectedEvent !== null"
      @close="eventStore.inspectedEvent = null"
      :event="eventStore.inspectedEvent"
    />
    <wave-form
      v-if="eventStore.audioElement.src"
      tabindex="-1"
      class="no-outline"
      @show-menu="doShowMenu"
      :height="300">
      <play-head />
      <div
        v-if="settings.showSegmentBoxes"
        class="absolute">
        <v-menu
          min-width="150"
          lazy
          :transition="false"
          v-model="showMenu"
          :position-x="menuX"
          :position-y="menuY"
          absolute
          offset-y>
          <v-list v-if="showMenu" class="context-menu-list" dense>
            <v-list-tile
              @click="keyboardShortcuts.playPause.action">
              <v-list-tile-content>
                <v-list-tile-title>Play</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.playPause" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="keyboardShortcuts.split.disabled()"
              @click="splitEventFromMenu(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Split</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.split" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="keyboardShortcuts.joinEvents.disabled()"
              @click="joinEvents(eventStore.selectedEventIds)">
              <v-list-tile-content>
                <v-list-tile-title>Join</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.joinEvents" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="eventStore.selectedEventIds.length === 0"
              @click="exportEventAudio(eventStore.selectedEventIds)">
              <v-list-tile-content>
                <v-list-tile-title>
                  Export Audio {{
                    eventStore.selectedEventIds.length > 1
                    ? '(' + eventStore.selectedEventIds.length + ' Event' + ((eventStore.selectedEventIds.length === 1) ? '' : 's') + ')'
                    : ''
                  }}
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-list-tile
              @click="keyboardShortcuts.scrollToEvent.action">
              <v-list-tile-content>
                <v-list-tile-title>Show Transcript</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.scrollToEvent" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="showEventInspector(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Inspect Event…</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.inspectEvent" />
              </v-list-tile-action>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              :disabled="keyboardShortcuts.deleteEvents.disabled()"
              @click="keyboardShortcuts.deleteEvents.action">
              <v-list-tile-content>
                <v-list-tile-title>Delete</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.deleteEvents" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile @click="transcribeEvent(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Auto-Transcribe Event</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
      <div slot="overview">
        <div class="error-overview-container">
          <div
            v-for="(error) in errors"
            :key="error.eventId"
            class="error-overview"
            :style="{ left: `${ error.startTime / eventStore.audioElement.duration * 100}%` }" />
        </div>
        <div class="search-overview-container">
          <search-results-inline />
        </div>
      </div>
    </wave-form>
    <drop-audio-file
      v-else
      format="ogg"
      @update="loadAudioFromFile"
    />
    <player-bar />
    <transcript-editor />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { saveAs } from 'file-saver'

import playerBar from './PlayerBar.vue'
import waveForm from './Waveform.vue'
import settingsView from './Settings.vue'
import eventInspector from './EventInspector.vue'
import searchResultsInline from './SearchResultsInline.vue'
import transcriptEditor from './TranscriptEditor.vue'
import playHead from './PlayHead.vue'
import dropAudioFile from './DropAudioFile.vue'
import transcriptSettings from './TranscriptSettings.vue'
import KeyboardShortcut from './helper/KeyboardShortcut.vue'

import {
  LocalTranscriptEvent,
  addEventsToSelection,
  deleteSelectedEvents,
  eventStore,
  exportEventAudio,
  findEventAt,
  getSelectedEvent,
  isEventSelected,
  joinEvents,
  loadAudioFromFile,
  playEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  selectEvents,
  splitEvent,
  getTextFromTokens
} from '../store/transcript'

import { saveChangesToServer, serverTranscript } from '../service/backend-server'
import { handleGlobalShortcut, keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'
import kaldiService from '../service/kaldi/kaldiService'

import {
  isCmdOrCtrl
} from '../util'

import {
  history,
  undoable,
  startListening as startUndoListener,
  stopListening as stopUndoListener
} from '../store/history'

import {
  isWaveformEventVisible,
  getScrollLeftAudio
} from '../service/dom-methods'

import settings from '../store/settings'
import audio from '../service/audio'
import { generateProjectFile } from '../service/backend-files'
import eventBus from '../service/event-bus'

@Component({
  components: {
    waveForm,
    transcriptEditor,
    settingsView,
    eventInspector,
    transcriptSettings,
    playHead,
    searchResultsInline,
    dropAudioFile,
    playerBar,
    KeyboardShortcut
  }
})

export default class Editor extends Vue {

  errors: LocalTranscriptEvent[] = []
  eventStore = eventStore
  playEvent = playEvent
  getSelectedEvent = getSelectedEvent
  isEventSelected = isEventSelected
  history = history
  loadAudioFromFile = loadAudioFromFile
  exportEventAudio = exportEventAudio
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction

  scrollTranscriptIndex: number = 0
  scrollTranscriptTime: number = 0

  scrollToTranscriptEvent = scrollToTranscriptEvent
  settings = settings
  showSearch = false
  showMenu = false
  isSaving = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  reload() {
    window.location.reload()
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
    saveAs(f, (eventStore.metadata.transcriptName || 'unnamed_transcript') + '.transcript')
    this.isSaving = false
  }

  async transcribeEvent(e?: LocalTranscriptEvent) {
    if (e !== undefined) {
      const buffer = await audio.decodeBufferTimeSlice(e.startTime, e.endTime, audio.store.uint8Buffer.buffer)
      const result = await kaldiService.transcribeAudio(
        window.location.origin + '/kaldi-models/german.zip',
        buffer,
        (status: string) => {
          if (status === 'DOWNLOADING_MODEL') {
            console.log('loading model…')
          } else if (status === 'INITIALIZING_MODEL') {
            console.log('init…')
          } else {
            console.log(status)
          }
        }
      )
    }
  }

  async saveToServer() {
    // if (this.history.actions.length > 0) {
    this.isSaving = true
    try {
      eventStore.events = await saveChangesToServer(eventStore.events)
    } catch (e) {
      alert('Could not save transcript to server.')
      console.log(e)
    } finally {
      this.isSaving = false
    }
    // }
  }

  async doShowMenu(e: MouseEvent) {
    // this is used for splitting
    this.layerX = e.offsetX
    const ev = findEventAt(((await getScrollLeftAudio()) + e.x) / settings.pixelsPerSecond)
    if (ev !== undefined) {
      if (isCmdOrCtrl(e)) {
        addEventsToSelection([ev])
      } else {
        if (!isEventSelected(ev.eventId)) {
          selectEvents([ ev ])
        }
      }
    }
    this.menuX = e.x
    this.menuY = e.y
    this.showMenu = true
  }

  splitEventFromMenu(event: LocalTranscriptEvent) {
    const splitAt = this.layerX / settings.pixelsPerSecond
    this.splitEvent(event, splitAt)
  }

  showEventInspector(e?: LocalTranscriptEvent) {
    if (e !== undefined) {
      eventStore.inspectedEvent = e
    }
  }

  async splitEvent(e: LocalTranscriptEvent, at: number) {
    const [ leftEvent ] = undoable(splitEvent(e, at))
    if (!(await isWaveformEventVisible(leftEvent))) {
      scrollToAudioEvent(leftEvent)
    }
  }

  mounted() {
    startUndoListener()
    window.onbeforeunload = (e: BeforeUnloadEvent) => {
      if (history.actions.length > 0) {
        e.preventDefault()
        // Chrome requires returnValue to be set
        e.returnValue = ''
      }
    }
    eventBus.$on('scrollWaveform', this.hideMenu)
    document.addEventListener('keydown', handleGlobalShortcut)
    if (eventStore.status === 'new') {
      eventStore.userState.showSpeakerTierEditModal = true
    }
  }

  beforeDestroy() {
    stopUndoListener()
    document.removeEventListener('keydown', handleGlobalShortcut)
  }

  hideMenu() {
    if (this.showMenu === true) {
      this.showMenu = false
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

.context-menu-list a
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
