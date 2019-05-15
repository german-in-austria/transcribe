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
          @close="parsedExmaraldaFile = null"
          @finish="loadTranscript"
          v-if="parsedExmaraldaFile !== null"
          :tree="parsedExmaraldaFile" />
        <!-- <vue-full-screen-file-drop
          class="file-dropper"
          @drop='onFileDrop'>
          &nbsp;
        </vue-full-screen-file-drop> -->
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
import * as jszip from 'jszip'
import audio from '../service/audio'
import settings from '../store/settings'
import { ParsedExmaraldaXML } from '../service/exmaralda-parser'
import { LocalTranscriptEvent, eventStore, speakerEventHasErrors, ServerTranscript } from '../store/transcript'
import {
  getTranscript,
  mergeServerTranscript,
  serverTranscriptToLocal,
  getMetadataFromServerTranscript
} from '../service/data-backend/server-backend'
import { loadExmaraldaFile } from '../service/data-backend/exmaralda-backend'

interface FileReaderEventTarget extends EventTarget {
  result: string
}

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
  parsedExmaraldaFile: ParsedExmaraldaXML|null = null
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
    const zip = new jszip()
    await zip.loadAsync(f)
    const audioBuffer = await zip.file('audio.ogg').async('uint8array')
    const sT = JSON.parse(await zip.file('transcript.json').async('text')) as ServerTranscript
    const eS = JSON.parse(await zip.file('eventStore.json').async('text'))
    const overviewSvg = await zip.file('overview.svg').async('text')
    const blob = new Blob([audioBuffer], { type: 'audio/ogg' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('audio')
    audio.store.uint8Buffer = audioBuffer
    a.src = u
    a.addEventListener('durationchange', () => {
      this.importingLocalFile = false
      this.loadingTranscriptId = null
      eventStore.events = eS.events
      mergeServerTranscript(sT)
      localStorage.setItem(u + '_overview', overviewSvg)
      audio.store.isLocalFile = true
      eventStore.selectedEventIds = eS.selectedEventIds
      eventStore.backEndUrl = eS.backEndUrl
      eventStore.selectedSearchResult = eS.selectedSearchResult
      eventStore.searchResults = eS.searchResults
      eventStore.searchTerm = eS.searchTerm
      eventStore.metadata = eS.metadata
      eventStore.userState = eS.userState
      eventStore.transcriptDownloadProgress = eS.transcriptDownloadProgress
      eventStore.audioElement = a
      eventStore.status = 'finished'
    })
  }

  openExmaraldaFile(f: File) {
    this.importingLocalFile = true
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent) => {
      this.parsedExmaraldaFile = loadExmaraldaFile(f.name, (e.target as FileReaderEventTarget).result)
      // console.log(x)
      this.importingLocalFile = false
    }
    reader.readAsText(f, 'UTF-8')
  }

  openFile() {
    const x = document.createElement('input')
    x.type = 'file'
    x.accept = '.zip,.transcript,.json,.exb'
    x.addEventListener('change', async (e) => {
      if (x.files !== null) {
        if (x.files[0].name.endsWith('.transcript')) {
          this.openProjectFile(x.files[0])
        } else if (x.files[0].name.endsWith('.exb')) {
          this.openExmaraldaFile(x.files[0])
        }
      }
    })
    x.click()
  }

  initializeEmptyTranscript() {
    this.eventStore.status = 'new'
  }

  loadTranscript(t: ServerTranscript) {
    const y = document.createElement('audio')
    mergeServerTranscript(t)
    eventStore.metadata = getMetadataFromServerTranscript(t)
    eventStore.events = serverTranscriptToLocal(t)
    eventStore.status = 'finished'
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
  background url('/static/img/bg-waveform.png')
  background-repeat no-repeat
  background-position center 100px
  background-size 1740px 290px
  background-color rgba(0,0,0,.3)

.max-width
  max-width 100%

.help
  border-top 1px solid rgba(0,0,0,.1)
  border-radius 0
  background transparent
  box-shadow none
  font-weight 300

.file-dropper
  position: absolute

</style>
