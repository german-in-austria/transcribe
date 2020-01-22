<template>
  <v-app :dark="settings.darkMode">
    <v-navigation-drawer
      v-if="eventStore.status !== 'empty'"
      stateless
      style="padding: 0"
      :value="true"
      :width="settings.showDrawer ? settings.drawerWidth : 70"
      right
      disable-resize-watcher
      app>
      <sidebar :active="settings.showDrawer" />
    </v-navigation-drawer>
    <v-content class="main-content">
      <v-container fluid fill-height class="pa-0">
        <exmaralda-importer
          v-if="importableExmaraldaFile !== null"
          :transcripts="transcriptList"
          :importable="importableExmaraldaFile"
          @close="importableExmaraldaFile = null"
          @finish="loadImportedTranscript"
        />
        <v-layout
          @dragover.prevent=""
          @drop.stop.prevent="onDropFile"
          v-if="eventStore.status === 'empty'"
          class="max-width pick-transcript-container"
          :align-center="transcriptList === null"
          justify-center
          column>
          <v-flex xs1>
            <v-combobox
              style="width: 300px; margin: 20px auto 0 auto"
              @change="connectToBackend"
              :loading="isLoadingBackendUrl"
              :error-messages="this.errorMessage !==  null ? [ this.errorMessage ] : []"
              auto-select-first
              v-model="settings.backEndUrl"
              :items="backEndUrls"
              label="Select a Back End"
            ></v-combobox>
          </v-flex>
          <div v-if="settings.backEndUrl !== null && loggedIn === false">
            Please <a :href="`${ settings.backEndUrl }/login/`" target="_blank">login</a> and <a @click="loadTranscriptList">refresh</a>
          </div>
          <v-progress-circular
            indeterminate
            v-if="transcriptList === null && loggedIn === true && settings.backEndUrl !== null"/>
            <v-flex v-if="transcriptList !== null">
              <v-layout justify-center row>
              <v-flex class="pt-5 pl-4 pr-4" xs12 md6>
                <h1 class="text-xs-center text-light text-uppercase mt-3 mb-4">
                  Transcribe
                </h1>
                <v-layout>
                  <v-flex class="pr-1" xs6>
                    <v-btn
                      :loading="importingLocalFile" @click="openFileDialog" class="mb-2 elevation-0" style="height: 40px;" block>
                      Open/Import File
                    </v-btn>
                  </v-flex>
                  <v-flex class="pl-1" xs6>
                    <v-btn @click="newTranscript" class="mb-2 elevation-0" style="height: 40px;" block>
                      New File
                    </v-btn>
                  </v-flex>
                </v-layout>
                <v-text-field
                  solo
                  v-model="searchTerm"
                  placeholder="search…"
                  hide-details
                  prepend-inner-icon="search"
                  autofocus />
                <v-list two-line style="background: transparent">
                  <v-subheader>
                    Server Transcripts
                  </v-subheader>
                  <template v-for="(transcript) in filteredTranscriptList">
                    <v-divider :key="'dk' + transcript.pk" />
                    <v-list-tile
                      :key="transcript.pk" 
                      :disabled="loadingTranscriptId !== null || transcript.locked === true"
                      @click="loadRemoteTranscript(transcript)">
                      <v-list-tile-avatar>
                        <v-icon v-if="transcript.locked">lock</v-icon>
                        <v-progress-circular
                          class="mb-2"
                          size="20"
                          width="2"
                          v-else-if="loadingTranscriptId === transcript.pk"
                          indeterminate />
                        <v-icon color="grey" v-else>cloud_queue</v-icon>
                      </v-list-tile-avatar>
                      <v-list-tile-content>
                        <v-list-tile-title>
                          {{ transcript.n }}
                        </v-list-tile-title>
                        <v-list-tile-sub-title>
                          {{ transcript.ut }}
                        </v-list-tile-sub-title>
                      </v-list-tile-content>
                      <v-list-tile-action>
                        <v-chip small v-for="(user, i) in transcript.users" :key="i">
                          {{ user }}
                        </v-chip>
                      </v-list-tile-action>
                    </v-list-tile>
                  </template>
                  <v-list-tile class="text-xs-center" v-if="filteredTranscriptList.length === 0">
                    <span class="caption">
                      no matching transcripts found
                    </span>
                  </v-list-tile>
                </v-list>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout
          v-if="eventStore.status !== 'empty'"
          class="max-width"
          justify-center>
          <v-flex xs12>
            <editor />
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import localForage from 'localforage'

import playerBar from './PlayerBar.vue'
import editor from './Editor.vue'
import sidebar from './Sidebar.vue'
import exmaraldaImporter from './ExmaraldaImporter.vue'

import * as socket from '../service/socket'
import audio from '../service/audio'
import settings from '../store/settings'

import {
  LocalTranscriptEvent,
  eventStore,
  speakerEventHasErrors,
  loadAudioFromFile,
  loadAudioFromUrl,
} from '../store/transcript'

import { computeTokenTypesForEvents } from '../service/token-types'

import {
  fileToUint8ArrayAndName,
  fileToTextAndName
} from '../util'

import {
  ServerTranscript,
  ServerTranscriptListItem,
  getServerTranscripts,
  getTranscript,
  mergeServerTranscript,
  serverTranscriptToLocal,
  getMetadataFromServerTranscript,
  getAudioUrlFromServerNames
} from '../service/backend-server'

import {
  parseProjectFile
} from '../service/backend-files'

import {
  ParsedExmaraldaXML,
  exmaraldaToImportable
} from '../service/backend-exmaralda'

import {
  history,
  HistoryEventAction,
  handleRemotePeerEvent
} from '../store/history'

@Component({
  components : {
    editor,
    exmaraldaImporter,
    sidebar,
    playerBar
  }
})
export default class App extends Vue {

  @Prop() transcript_id: number|null

  eventStore = eventStore
  settings = settings

  backEndUrls = [
    'https://dioedb.dioe.at',
    'https://dissdb.dioe.at',
    'https://dissdb-test.dioe.at',
    'http://localhost:8000',
    'https://dioedb.demo.dioe.at'
  ]

  searchTerm = ''
  importingLocalFile = false
  transcriptList: ServerTranscriptListItem[]|null = null
  loadingTranscriptId: number|null = null
  loggedIn: boolean = false
  importableExmaraldaFile: ParsedExmaraldaXML|null = null
  errorMessage: string|null = null
  isLoadingBackendUrl = false

  async connectToBackend(url: string) {
    this.isLoadingBackendUrl = true
    settings.backEndUrl = url
    this.updateTokenTypePreset(url)
    await this.loadTranscriptList(url)
    this.isLoadingBackendUrl = false
    socket.connectToSocket('https://dioedb.dioe.at')
    socket.onMessage(console.log)
    socket.onMessage((m) => {
      if (m.type === 'list_open_transcripts' && this.transcriptList !== null) {
        this.transcriptList = this.transcriptList.map(t => {
          return {
            ...t,
            users: m.transcripts.filter(ts => ts.transcript_id === t.pk).map(ts => ts.user.name),
            locked: m.transcripts.some(ts => ts.transcript_id === t.pk && ts.app === 'anno')
          }
        })
      }
    })
  }

  onDropFile(e: DragEvent) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      if (e.dataTransfer.files !== null && e.dataTransfer.files.length === 1) {
        this.openFile(e.dataTransfer.files[0])
      }
    }
  }

  // FIXME: very hacky.
  async updateTokenTypePreset(url: string) {
    if (url !== null && url.includes('dioedb')) {
      settings.tokenTypesPreset = 'dioeDB'
    } else if (url !== null && url.includes('dissdb')) {
      settings.tokenTypesPreset = 'dissDB'
    }
  }

  async mounted() {
    if (settings.backEndUrl !== null) {
      this.connectToBackend(settings.backEndUrl)
    }
  }

  async loadTranscriptList(url: string) {
    try {
      this.errorMessage = null
      const res = await getServerTranscripts(url)
      if (res.transcripts !== undefined) {
        this.loggedIn = true
        this.transcriptList = res.transcripts
      } else if ((res as any).error === 'login') {
        this.loggedIn = false
      }
    } catch (e) {
      this.loggedIn = false
      this.transcriptList = null
      this.errorMessage = 'could not load transcripts from back end.'
    }
  }

  get filteredTranscriptList(): ServerTranscriptListItem[] {
    if (this.transcriptList !== null) {
      return this.transcriptList.filter((v, i) => {
        return v.n.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
      })
    } else {
      return []
    }
  }

  isAudio(file: File) {
    return file.name.includes('.ogg') || file.type.includes('/ogg')
  }

  // TODO: better sanity check.
  isXML(file: File) {
    return file.type.includes('/xml') || file.name.includes('.exb')
  }

  async openProjectFile(f: File) {
    this.importingLocalFile = true
    const p = await parseProjectFile(f)
    const audioUrl = await this.loadLocalTranscript(p.serverTranscript, p.audioBuffer)
    this.loadPreviousUserState(p.eventStore, audioUrl, p.overviewSvg, p.historyActions)
  }

  loadPreviousUserState(
    previousEventStore: any,
    audioUrl: string,
    overviewSvg: string,
    historyFile: HistoryEventAction[]
  ) {
    localForage.setItem('waveformOverview__' + audioUrl, overviewSvg)
    eventStore.events                     = previousEventStore.events
    eventStore.selectedEventIds           = previousEventStore.selectedEventIds
    eventStore.selectedSearchResult       = previousEventStore.selectedSearchResult
    eventStore.searchResults              = previousEventStore.searchResults
    eventStore.searchTerm                 = previousEventStore.searchTerm
    eventStore.metadata                   = previousEventStore.metadata
    eventStore.userState                  = previousEventStore.userState
    eventStore.transcriptDownloadProgress = previousEventStore.transcriptDownloadProgress
    eventStore.status                     = 'finished'
    history.actions                       = historyFile
  }

  async loadImportedTranscript(t: ServerTranscript, audioData: File|null, audioUrl?: string): Promise<string> {
    const url = await this.loadLocalTranscript(t, audioData, audioUrl)
    this.importableExmaraldaFile = null
    return url
  }

  async loadLocalTranscript(t: ServerTranscript, audioData: File|Uint8Array|null, audioUrl?: string): Promise<string> {
    this.importingLocalFile = false
    this.loadingTranscriptId = null
    mergeServerTranscript(t)
    eventStore.metadata = getMetadataFromServerTranscript(t)
    const events = serverTranscriptToLocal(t, eventStore.metadata.defaultTier || 'text')
    eventStore.events = computeTokenTypesForEvents(
      events,
      eventStore.metadata.defaultTier || 'text',
      _(eventStore.metadata.speakers).map((s, k) => k).value()
    )
    if (audioData !== null) {
      const audioElement = await loadAudioFromFile(audioData)
      eventStore.status = 'finished'
      return audioElement.src
    } else if (audioUrl !== undefined) {
      const audioElement = await loadAudioFromUrl(audioUrl)
      eventStore.status = 'finished'
      return audioElement.src
    } else {
      return ''
    }
  }

  async openExmaraldaFile(f: File) {
    this.importingLocalFile = true
    const { t, n } = await fileToTextAndName(f)
    this.importableExmaraldaFile = exmaraldaToImportable(n, t)
    this.importingLocalFile = false
  }

  newTranscript() {
    eventStore.status = 'new'
  }

  openFileDialog() {
    const el = document.createElement('input')
    el.type = 'file'
    el.accept = '.transcript,.exb'
    el.addEventListener('input', (e) => {
      if (el.files !== null) {
        this.openFile(el.files[0])
      }
    })
    this.$nextTick(() => {
      el.click()
    })
  }

  openFile(f: File) {
    if (f.name.endsWith('.transcript')) {
      this.openProjectFile(f)
    } else if (f.name.endsWith('.exb')) {
      this.openExmaraldaFile(f)
    } else if (f.name.endsWith('.ogg')) {
      this.initializeEmptyTranscript()
      loadAudioFromFile(f)
    } else {
      alert('Unrecognized File type.')
    }
  }

  initializeEmptyTranscript() {
    eventStore.status = 'new'
  }

  async loadRemoteTranscript(t: ServerTranscriptListItem) {
    // TODO: ugly
    this.loadingTranscriptId = t.pk
    const y = document.createElement('audio')
    socket.sendMessage({
      type: 'open_transcript',
      transcript_id: t.pk,
      app: 'transcribe'
    })
    socket.onMessage(m => {
      if (m.type === 'transcript_operation' && m.transcript_id === t.pk) {
        handleRemotePeerEvent(m.operation)
      }
    })
    getTranscript(t.pk, (progress, events) => {
      eventStore.transcriptDownloadProgress = progress
      if (eventStore.metadata.audioUrl !== null) {
        y.src = eventStore.metadata.audioUrl
        y.addEventListener('durationchange', (e) => {
          this.loadingTranscriptId = null
          eventStore.audioElement = y
          if (eventStore.status !== 'finished') {
            eventStore.status = 'loading'
          }
        })
      }
    })
  }
}
</script>
