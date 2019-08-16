<template>
  <v-app
    :style="settings.contrast > 1
      ? `filter: contrast(${settings.contrast})`
      : ''"
    :dark="settings.darkMode"
    >
    <v-navigation-drawer
      stateless
      style="padding: 0"
      v-model="settings.showDrawer"
      right
      app>
      <sidebar disable-resize-watcher :active="settings.showDrawer"/>
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
              @change="updateBackEndUrl"
              :error-messages="this.errorMessage !==  null ? [ this.errorMessage ] : []"
              auto-select-first
              v-model="eventStore.backEndUrl"
              :items="backEndUrls"
              label="Select a Back End"
            ></v-combobox>
          </v-flex>
          <div v-if="loggedIn === false">
            Please <a :href="`${ eventStore.backEndUrl }/login`" target="_blank">login</a> and <a @click="loadTranscriptList">refresh</a>
          </div>
          <v-progress-circular
            indeterminate
            v-if="transcriptList === null && loggedIn === true"/>
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
                  <v-subheader v-if="eventStore.recentlyOpened.length > 0 && searchTerm === ''">
                    Recently Opened
                  </v-subheader>
                  <template v-for="transcript in eventStore.recentlyOpened">
                    <v-divider v-if="searchTerm === ''" :key="'d' + transcript.pk" />
                    <transition-group :key="'t'+ transcript.pk">
                      <v-list-tile
                        v-if="searchTerm === ''"
                        :key="'recently_' + transcript.pk" 
                        :disabled="loadingTranscriptId !== null"
                        @click="loadRemoteTranscript(transcript)">
                        <v-list-tile-avatar>
                          <v-progress-circular
                            class="mb-2"
                            size="20"
                            width="2"
                            v-if="loadingTranscriptId === transcript.pk"
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
                      </v-list-tile>
                    </transition-group>
                  </template>
                  <v-subheader>
                    Server Transcripts
                  </v-subheader>
                  <template v-for="(transcript) in filteredTranscriptList">
                    <v-divider :key="'dk' + transcript.pk" />
                    <transition-group :key="'ts'+ transcript.pk">
                      <v-list-tile
                        :key="transcript.pk" 
                        :disabled="loadingTranscriptId !== null"
                        @click="loadRemoteTranscript(transcript)">
                        <v-list-tile-avatar>
                          <v-progress-circular
                            class="mb-2"
                            size="20"
                            width="2"
                            v-if="loadingTranscriptId === transcript.pk"
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
                      </v-list-tile>
                    </transition-group>
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
            <player-bar />
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'

import playerBar from './PlayerBar.vue'
import editor from './Editor.vue'
import sidebar from './Sidebar.vue'
import exmaraldaImporter from './ExmaraldaImporter.vue'

import audio from '../service/audio'
import settings from '../store/settings'

import {
  LocalTranscriptEvent,
  eventStore,
  speakerEventHasErrors,
  loadAudioFile,
  addRecentlyOpened
} from '../store/transcript'

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
  createEmptyTranscript
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
  HistoryEventAction
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

  eventStore = eventStore
  settings = settings

  backEndUrls = [
    'https://dissdb-test.dioe.at',
    'https://dissdb.dioe.at',
    'http://localhost:8000',
    'https://dioedb.dioe.at'
  ]

  searchTerm = ''
  importingLocalFile = false
  transcriptList: ServerTranscriptListItem[]|null = null
  loadingTranscriptId: number|null = null
  loggedIn: boolean = true
  importableExmaraldaFile: ParsedExmaraldaXML|null = null
  errorMessage: string|null = null

  updateBackEndUrl(url: string) {
    localStorage.setItem('backEndUrl', url)
    this.loadTranscriptList()
  }

  onDropFile(e: DragEvent) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      if (e.dataTransfer.files !== null && e.dataTransfer.files.length === 1) {
        this.openFile(e.dataTransfer.files[0])
      }
    }
  }

  async mounted() {
    this.loadTranscriptList()
  }

  async loadTranscriptList() {
    try {
      this.errorMessage = null
      const res = await getServerTranscripts()
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
    localStorage.setItem(audioUrl + '_overview', overviewSvg)
    eventStore.events                     = previousEventStore.events
    eventStore.selectedEventIds           = previousEventStore.selectedEventIds
    eventStore.backEndUrl                 = previousEventStore.backEndUrl
    eventStore.selectedSearchResult       = previousEventStore.selectedSearchResult
    eventStore.searchResults              = previousEventStore.searchResults
    eventStore.searchTerm                 = previousEventStore.searchTerm
    eventStore.metadata                   = previousEventStore.metadata
    eventStore.userState                  = previousEventStore.userState
    eventStore.transcriptDownloadProgress = previousEventStore.transcriptDownloadProgress
    eventStore.status                     = 'finished'
    history.actions                       = historyFile
  }

  async loadImportedTranscript(t: ServerTranscript, audioData: File|null): Promise<string> {
    const { transcript_id } = await createEmptyTranscript(
      t.aEinzelErhebung!.pk,
      t.aTranskript!.n,
      t.aTranskript!.default_tier!
    )
    t.aTranskript!.pk = transcript_id
    const url = await this.loadLocalTranscript(t, audioData)
    this.importableExmaraldaFile = null
    return url
  }

  async loadLocalTranscript(t: ServerTranscript, audioData: File|Uint8Array|null): Promise<string> {
    const audioElement = await loadAudioFile(audioData)
    this.importingLocalFile = false
    this.loadingTranscriptId = null
    mergeServerTranscript(t)
    eventStore.metadata = getMetadataFromServerTranscript(t)
    eventStore.events = serverTranscriptToLocal(t)
    eventStore.status = 'finished'
    return audioElement.src
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
    } else {
      throw new Error('unrecognized file extension')
    }
  }

  initializeEmptyTranscript() {
    this.eventStore.status = 'new'
  }

  async loadRemoteTranscript(t: ServerTranscriptListItem) {
    // TODO: ugly
    this.loadingTranscriptId = t.pk
    const y = document.createElement('audio')
    getTranscript(t.pk, (progress, events, serverTranscript) => {
      eventStore.transcriptDownloadProgress = progress
      mergeServerTranscript(serverTranscript)
      if (eventStore.metadata.audioUrl !== null) {
        y.src = eventStore.metadata.audioUrl
        y.addEventListener('durationchange', (e) => {
          addRecentlyOpened(t)
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

<style lang="stylus" scoped>
</style>
