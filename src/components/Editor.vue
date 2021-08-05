<template>
  <div class="fill-height">
    <div class="snackbars">
      <v-snackbar
        bottom
        left
        style="border-radius: 7px"
        :multi-line="true"
        :timeout="snackbar.timeout"
        v-model="snackbar.show">
        <div style="width: 100%;" class="caption">
          {{ snackbar.text }}
          <div>
            <v-progress-linear style="border-radius: 7px" v-if="snackbar.progressType === 'indeterminate'" indeterminate />
            <v-progress-linear style="border-radius: 7px" v-else-if="snackbar.progressType === 'determinate'" :value="snackbar.progress" />
          </div>
        </div>
        <v-btn flat @click="snackbar.show = false" tile>
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-snackbar>
    </div>
    <v-toolbar class="elevation-0" fixed app>
      <v-flex xs4>
        <v-btn icon @click="reload"><f-icon value="chevron_left" /></v-btn>
      </v-flex>
      <v-flex xs4 class="text-xs-center">
        <div style="opacity: .7; font-size: small">{{ transcript.meta.transcriptName || 'Untitled Transcript' }}</div>
      </v-flex>
      <v-flex xs4 class="text-xs-right">
        <div style="display: inline-block">
          <v-menu
            lazy
            :disabled="store.status === 'loading' || isSaving"
            open-on-hover
            min-width="150"
            :transition="false"
            offset-y>
            <v-btn
              slot="activator"
              @click="saveTranscript"
              :loading="store.status === 'loading' || isSaving"
              :disabled="store.status === 'loading' || isSaving"
              icon flat>
              <f-icon value="save_alt" />
              <template v-slot:loader>
                <v-progress-circular
                  :color="settings.darkMode ? '#fff' : '#333'"
                  :size="16"
                  :rotate="-90"
                  :width="2"
                  :indeterminate="transcript.uiState.downloadProgress === 1 || isSaving"
                  :value="(transcript.uiState.downloadProgress || 0) * 100" />
              </template>
            </v-btn>
            <v-list dense class="context-menu-list">
              <v-list-tile @click="exportProject">
                <v-list-tile-content>
                  <v-list-tile-title>Download Project</v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <v-divider />
              <v-list-tile @click="saveTranscript">
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
      v-if="transcript.uiState.showTranscriptMetaSettings"
      @close="transcript.uiState.showTranscriptMetaSettings = false"
    />
    <settings-view
      v-if="settings.showSettings"
      @close="settings.showSettings = false"
      :show="settings.showSettings" />
    <event-inspector
      :transcript="transcript"
      v-if="transcript.uiState.inspectedEventId !== null"
      :show="transcript.uiState.inspectedEventId !== null"
      @close="transcript.uiState.inspectedEventId = null"
      :event="transcript.getEventById(transcript.uiState.inspectedEventId)"
    />
    <wave-form
      v-if="transcript.audio !== null"
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
              @click="splitEventFromMenu(transcript.getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Split</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.split" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="keyboardShortcuts.joinEvents.disabled()"
              @click="joinEvents(transcript.uiState.selectedEventIds)">
              <v-list-tile-content>
                <v-list-tile-title>Join</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.joinEvents" />
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              :disabled="transcript.uiState.selectedEventIds.length === 0"
              @click="exportEventAudio(transcript.uiState.selectedEventIds)">
              <v-list-tile-content>
                <v-list-tile-title>
                  Export Audio {{
                    transcript.uiState.selectedEventIds.length > 1
                    ? '(' + transcript.uiState.selectedEventIds.length + ' Event' + (( transcript.uiState.selectedEventIds.length === 1 ) ? '' : 's') + ')'
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
            <v-list-tile @click="transcribeEvent(getSelectedEvent())">
              <v-list-tile-content>
                <v-list-tile-title>Auto-Transcribe Event…</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                <keyboard-shortcut :value="keyboardShortcuts.autoTranscribeEvent" />
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
          </v-list>
        </v-menu>
      </div>
      <div slot="overview">
        <div class="error-overview-container">
          <div
            v-for="(error) in errors"
            :key="error.eventId"
            class="error-overview"
            :style="{ left: `${ error.startTime / duration * 100}%` }" />
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
    <player-bar :transcript="transcript" />
    <transcript-editor />
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator'
import { saveAs } from 'file-saver'
import * as Sentry from '@sentry/browser'

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
  exportEventAudio
} from '../store/transcript'

import { saveChangesToServer } from '../service/backend-server'
import { handleGlobalShortcut, keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'
import kaldiService from '../service/kaldi/kaldiService'

import {
  isCmdOrCtrl
} from '../util'

import {
  history,
  mutation,
  startListening as startUndoListener,
  stopListening as stopUndoListener
} from '../store/history'

import {
  isWaveformEventVisible,
  getScrollLeftAudio
} from '../service/dom-methods'

import settings from '../store/settings'
import audio from '../service/audio'
import fileService from '../service/disk'
import eventBus from '../service/event-bus'
import store from '@/store'
import Transcript from '@/service/transcript.class'
import TranscriptAudio from '@/service/transcript-audio.class'

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

  @Prop({ required: true }) transcript!: Transcript

  errors: LocalTranscriptEvent[] = []
  store = store
  history = history
  playEvent = this.transcript.audio?.playEvent
  getSelectedEvent = this.transcript.getSelectedEvent
  isEventSelected = this.transcript.isEventSelected
  exportEventAudio = exportEventAudio
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction

  snackbar: {
    show: boolean
    text: string
    progressType: 'determinate'|'indeterminate'|null,
    progress: 0,
    timeout: number|null
  } = {
    show: false,
    text: '',
    progressType: 'determinate',
    progress: 0,
    timeout: null
  }

  scrollTranscriptIndex: number = 0
  scrollTranscriptTime: number = 0

  settings = settings
  showSearch = false
  showMenu = false
  isSaving = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  get duration() {
    return this.transcript.audio?.duration || 0
  }

  async loadAudioFromFile(f: File|Uint8Array) {
    this.transcript.audio = new TranscriptAudio(f)
  }

  reload() {
    window.location.reload()
  }

  joinEvents(es: number[]) {
    return mutation(this.transcript.joinEvents(es))
  }

  deleteSelectedEvents() {
    return mutation(this.transcript.deleteSelectedEvents())
  }

  async exportProject() {
    const overviewWave = (document.querySelector('.overview-waveform svg') as HTMLElement).innerHTML
    const f = await fileService.generateProjectFile(this.transcript, overviewWave, this.transcript.audio?.buffer || null, history.actions)
    if (this.transcript.meta.transcriptName === null || this.transcript.meta.transcriptName === '') {
      const name = (prompt('Please enter a name for the transcript', 'untitled_transcript') || 'untitled_transcript') + '.transcript'
      saveAs(f, name)
    } else {
      saveAs(f, this.transcript.meta.transcriptName)
    }
    this.isSaving = false
  }

  async transcribeEvent(e?: LocalTranscriptEvent) {
    if (e !== undefined) {
      const buffer = await TranscriptAudio.decodeBufferTimeSlice(e.startTime, e.endTime, audio.store.uint8Buffer.buffer)
      const result = await kaldiService.transcribeAudio(
        window.location.origin + '/kaldi-models/german.zip',
        buffer,
        (status) => {
          if (status === 'DOWNLOADING_MODEL') {
            this.snackbar = {
              text: 'Downloading German Language Model…',
              show: true,
              progressType: 'indeterminate',
              progress: 0,
              timeout: null
            }
          } else if (status === 'INITIALIZING_MODEL') {
            this.snackbar = {
              text: 'Initializing Model…',
              show: true,
              progressType: 'indeterminate',
              progress: 0,
              timeout: null
            }
          } else if (status === 'PROCESSING_AUDIO') {
            this.snackbar = {
              text: 'Transcribing Audio…',
              show: true,
              progressType: null,
              progress: 0,
              timeout: 2000
            }
          } else if (status === 'DONE') {
            this.snackbar.show = false
          }
        }
      )
      const cleanResult = result.replaceAll(/\d\.\d\d\s/g, '')
      eventBus.$emit('updateSpeakerEventText', {
        eventId: e.eventId,
        speakerId: Object.keys(this.transcript.meta.speakers)[0],
        text: cleanResult
      })
    }
  }

  async saveTranscript() {
    // if (this.history.actions.length > 0) {
    this.isSaving = true
    if (settings.backEndUrl !== null) {
      try {
        this.transcript.events = await saveChangesToServer(this.transcript)
      } catch (e) {
        Sentry.captureException(e)
        alert('Could not save transcript to server.')
        console.log(e)
      } finally {
        this.isSaving = false
      }
    } else {
      await fileService.saveFile(this.transcript, history.actions)
    }
    this.isSaving = false
  }

  async doShowMenu(e: MouseEvent) {
    // this is used for splitting
    this.layerX = e.offsetX
    const ev = this.transcript.findEventAt(((await getScrollLeftAudio()) + e.x) / settings.pixelsPerSecond)
    if (ev !== undefined) {
      if (isCmdOrCtrl(e)) {
        this.transcript.addEventsToSelection([ev])
      } else {
        if (!this.transcript.isEventSelected(ev.eventId)) {
          this.transcript.selectEvents([ ev ])
        }
      }
    }
    this.menuX = e.x
    this.menuY = e.y
    this.showMenu = true
  }

  splitEventFromMenu(event?: LocalTranscriptEvent) {
    if (event) {
      const splitAt = this.layerX / settings.pixelsPerSecond
      this.splitEvent(event, splitAt)
    }
  }

  showEventInspector(e?: LocalTranscriptEvent) {
    if (e !== undefined) {
      this.transcript.uiState.inspectedEventId = e.eventId
    }
  }

  async splitEvent(e: LocalTranscriptEvent, at: number) {
    const [ leftEvent ] = mutation(this.transcript.splitEvent(e, at))
    if (!(await isWaveformEventVisible(leftEvent))) {
      this.transcript.scrollToAudioEvent(leftEvent)
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
    if (store.status === 'new') {
      this.transcript.uiState.showTranscriptMetaSettings = true
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
