<template>
  <v-app :dark="settings.darkMode">
    <v-navigation-drawer
      stateless
      style="padding: 0"
      v-model="drawer"
      right
      app>
      <sidebar disable-resize-watcher :active="drawer"/>
    </v-navigation-drawer>
    <v-content class="main-content">
      <v-container fluid fill-height class="pa-0">
        <exmaralda-importer
          v-if="importableExmaraldaFile !== null"
          :importable="importableExmaraldaFile"
          @close="importableExmaraldaFile = null"
          @finish="loadImportedTranscript"
        />
        <v-layout
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
              <v-flex class="pt-5" xs12 md6>
                <h1 class="text-xs-center text-light text-uppercase mt-3 mb-4">
                  Transcribe
                </h1>
                <v-text-field
                  solo
                  v-model="searchTerm"
                  placeholder="search…"
                  prepend-inner-icon="search"
                  autofocus />
                <v-btn :loading="importingLocalFile" @click="openFile" class="mb-2 elevation-0" style="height: 40px;" block>
                  Open/Import File
                </v-btn>
                <v-sheet
                  :key="transcript.pk"
                  v-for="transcript in filteredTranscriptList"
                  v-ripple
                  color="#333"
                  class="pt-2 pb-2 pl-3 mb-2 elevation-0 cursor-pointer"
                  :disabled="loadingTranscriptId === transcript.pk"
                  @click="loadRemoteTranscript(transcript.pk)">
                  <v-layout class="pt-2 pb-1" align-content-space-around>
                    <v-flex class="pr-3" fill-height align-center xs1>
                      <v-progress-circular
                        class="mb-2"
                        size="20"
                        width="2"
                        v-if="loadingTranscriptId === transcript.pk"
                        indeterminate />
                      <v-icon color="grey" v-else>cloud_queue</v-icon>
                    </v-flex>
                    <v-flex class="pl-2">
                      {{ transcript.n }}
                    </v-flex>
                    <v-flex class="pl-2 pr-3 text-xs-right caption grey--text">
                      {{ transcript.ut }}
                    </v-flex>
                  </v-layout>
                </v-sheet>
                <v-list-tile class="text-xs-center" v-if="filteredTranscriptList.length === 0">
                  <span class="caption">
                    no matching transcripts found
                  </span>
                </v-list-tile>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout
          v-if="eventStore.status !== 'empty' && eventStore.audioElement !== null"
          class="max-width"
          justify-center>
          <v-flex xs12>
            <editor @toggle-drawer="e => drawer = !drawer" />
            <router-view />
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
  ServerTranscript
} from '../store/transcript'

import {
  fileToUint8ArrayAndName,
  fileToTextAndName
} from '../util'

import {
  getTranscript,
  mergeServerTranscript,
  serverTranscriptToLocal,
  getMetadataFromServerTranscript
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

  importingLocalFile = false
  drawer = false
  xmlText: string|null = null
  xml: any = null
  settings = settings
  transcriptList: ServerTranscriptListItem[]|null = null
  loadingTranscriptId: number|null = null
  searchTerm = ''
  loggedIn = true
  eventStore = eventStore
  log = console.log
  importableExmaraldaFile: ParsedExmaraldaXML|null = null
  errorMessage: string|null = null
  backEndUrls = [
    'https://dissdb.dioe.at',
    'http://localhost:8000',
    'https://dioedb.dioe.at'
  ]

  updateBackEndUrl(url: string) {
    localStorage.setItem('backEndUrl', url)
    this.loadTranscriptList()
  }

  async mounted() {
    this.loadTranscriptList()
  }

  async loadTranscriptList() {
    try {
      this.errorMessage = null
      const res = (await (await fetch(`${ this.eventStore.backEndUrl }/routes/transcripts`, {
        credentials: 'include'
      })).json())
      if (res.transcripts !== undefined) {
        this.loggedIn = true
        this.transcriptList = res.transcripts
      } else if (res.error === 'login') {
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
    const url = await this.loadLocalTranscript(t, audioData)
    this.importableExmaraldaFile = null
    return url
  }

  loadLocalTranscript(t: ServerTranscript, audioData: File|Uint8Array|null): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let u = ''
      const a = document.createElement('audio')
      if (audioData instanceof File) {
        const { b, n } = await fileToUint8ArrayAndName(audioData)
        const blob = new Blob([b], { type: 'audio/ogg' })
        u = URL.createObjectURL(blob)
        audio.store.uint8Buffer = b
      } else if (audioData instanceof Uint8Array) {
        const blob = new Blob([audioData], { type: 'audio/ogg' })
        u = URL.createObjectURL(blob)
        audio.store.uint8Buffer = audioData
      }
      a.src = u
      a.addEventListener('durationchange', () => {
        this.importingLocalFile = false
        this.loadingTranscriptId = null
        mergeServerTranscript(t)
        eventStore.metadata = getMetadataFromServerTranscript(t)
        eventStore.events = serverTranscriptToLocal(t)
        audio.store.isLocalFile = true
        eventStore.audioElement = a
        eventStore.status = 'finished'
        resolve(u)
      })
    })
  }

  async openExmaraldaFile(f: File) {
    this.importingLocalFile = true
    const { t, n } = await fileToTextAndName(f)
    this.importableExmaraldaFile = exmaraldaToImportable(n, t)
    this.importingLocalFile = false
  }

  openFile() {
    const x = document.createElement('input')
    x.addEventListener('input', (e) => {
      console.log('change', e)
      if (x.files !== null) {
        if (x.files[0].name.endsWith('.transcript')) {
          this.openProjectFile(x.files[0])
        } else if (x.files[0].name.endsWith('.exb')) {
          this.openExmaraldaFile(x.files[0])
        } else {
          throw new Error('unrecognized file extension')
        }
      }
    })
    x.type = 'file'
    x.accept = '.transcript,.exb'
    x.click()
  }

  initializeEmptyTranscript() {
    this.eventStore.status = 'new'
  }

  async loadRemoteTranscript(pk: number) {
    // TODO: ugly
    this.loadingTranscriptId = pk
    const y = document.createElement('audio')
    getTranscript(pk, (progress, events, serverTranscript) => {
      this.eventStore.transcriptDownloadProgress = progress
      mergeServerTranscript(serverTranscript)
      if (this.eventStore.metadata.audioUrl !== null) {
        console.log(this.eventStore.metadata)
        y.src = this.eventStore.metadata.audioUrl
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
<style lang="stylus" scoped>
.pick-transcript-container
  background #222
  // background url('/static/img/bg-waveform.png')
  // background-repeat no-repeat
  // background-position center 100px
  // background-size 1740px 290px
  // background-color rgba(0,0,0,.3)

</style>
