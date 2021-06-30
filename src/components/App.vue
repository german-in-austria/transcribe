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
          :transcripts="eventStore.transcripts"
          :importable="importableExmaraldaFile"
          @close="importableExmaraldaFile = null"
          @finish="loadImportedTranscript"
        />
        <v-layout
          @dragover.prevent=""
          @drop.stop.prevent="onDropFile"
          v-if="eventStore.status === 'empty'"
          class="max-width pick-transcript-container"
          :align-center="eventStore.transcripts === null"
          justify-center
          column>
          <v-flex xs1>
            <v-combobox
              @change="connectToBackend"
              :loading="isLoadingBackendUrl"
              :error-messages="this.errorMessage !==  null ? [ this.errorMessage ] : []"
              auto-select-first
              style="position: fixed; left: 0; right: 0; z-index: 1"
              solo
              flat
              v-model="settings.backEndUrl"
              :items="backEndUrls"
              :return-object="false"
              dense
              label="Select a Back End"
            >
            <template v-slot:prepend-inner>
              <span class="caption">Transcript Server</span>
            </template>
            </v-combobox>
          </v-flex>
          <div
            v-if="settings.backEndUrl !== null && loggedIn === false"
            class="text-xs-center"
          >
            Please <a :href="`${ settings.backEndUrl }/login/`" target="_blank">login</a> and <a @click="loadTranscriptList(settings.backEndUrl)">refresh</a>
          </div>
          <v-progress-circular
            indeterminate
            v-if="eventStore.transcripts === null && loggedIn === true && settings.backEndUrl !== null"
          />
          <v-flex v-if="eventStore.transcripts !== null">
            <v-layout justify-center row>
              <v-flex class="pt-5 mt-3 pl-4 pr-4" xs12 md6>
                <h1 class="text-xs-center text-light text-uppercase mt-3 mb-4">
                  Transcribe
                </h1>
                <v-layout>
                  <v-flex class="pr-1" xs6>
                    <v-btn
                      :loading="importingLocalFile" @click="openFileDialog" class="mb-2 elevation-0" style="height: 40px;" block>
                      Open/Import File …
                    </v-btn>
                  </v-flex>
                  <v-flex class="pl-1" xs6>
                    <v-btn @click="initializeEmptyTranscript" class="mb-2 elevation-0" style="height: 40px;" block>
                      New Transcript …
                    </v-btn>
                  </v-flex>
                </v-layout>
                <v-text-field
                  solo
                  flat
                  v-model="searchTerm"
                  placeholder="Search …"
                  hide-details
                  prepend-inner-icon="search"
                  autofocus />
                <v-list two-line style="background: transparent">
                  <v-subheader v-if="settings.backEndUrl !== null">
                    Server Transcripts
                  </v-subheader>
                  <v-subheader v-else>
                    Local Transcripts
                  </v-subheader>
                  <template v-for="(transcript) in filteredTranscriptList">
                    <v-divider :key="'dk' + transcript.pk" />
                    <v-list-tile
                      :key="transcript.pk"
                      :disabled="loadingTranscriptId !== null || transcript.locked === true"
                      @click="openTranscript(transcript)">
                      <v-list-tile-avatar>
                        <f-icon v-if="transcript.locked" value="lock" />
                        <v-progress-circular
                          v-else-if="loadingTranscriptId === transcript.pk"
                          class="mb-2"
                          size="20"
                          width="2"
                          indeterminate />
                        <f-icon
                          v-else-if="settings.backEndUrl !== null"
                          value="cloud_queue"
                          style="opacity: .5"
                        />
                        <f-icon
                          v-else-if="settings.backEndUrl === null"
                          value="mdi-file-document-outline"
                          style="opacity: .5"
                        />
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
                        <v-chip style="max-width: 120px;" small v-for="(user, i) in transcript.users" :key="i">
                          {{ user }}
                        </v-chip>
                      </v-list-tile-action>
                    </v-list-tile>
                  </template>
                  <div class="caption text-xs-center grey--text" v-if="filteredTranscriptList.length === 0">
                    no matching transcripts found
                  </div>
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
import _ from 'lodash'
import localForage from 'localforage'

import playerBar from './PlayerBar.vue'
import editor from './Editor.vue'
import sidebar from './Sidebar.vue'
import exmaraldaImporter from './ExmaraldaImporter.vue'

import * as socket from '../service/socket'
import diskService, { LocalTranscriptListItem } from '../service/disk'
import settings from '../store/settings'

import {
  eventStore,
  loadAudioFromFile,
  loadAudioFromUrl,
  insertPlaceholderTokens
} from '../store/transcript'

import { computeTokenTypesForEvents } from '../service/token-types'

import {
  fileToTextAndName
} from '../util'

import {
  ServerTranscript,
  ServerTranscriptListItem,
  getServerTranscripts,
  getTranscript,
  mergeServerTranscript,
  serverTranscriptToLocal,
  getMetadataFromServerTranscript
} from '../service/backend-server'

import Sentry from '@sentry/browser'

import {
  ParsedExmaraldaXML,
  exmaraldaToImportable
} from '../service/backend-exmaralda'

import {
  history,
  HistoryEventAction,
  handleRemotePeerEvent
} from '../store/history'
import FIcon from './helper/FIcon.vue'

@Component({
  components: {
    editor,
    exmaraldaImporter,
    sidebar,
    playerBar,
    FIcon
  }
})
export default class App extends Vue {

  eventStore = eventStore
  settings = settings

  backEndUrls = [
    {
      text: 'On This Computer',
      value: null
    },
    {
      text: 'dioedb.dioe.at',
      value: 'https://dioedb.dioe.at'
    },
    {
      text: 'dissdb.dioe.at',
      value: 'https://dissdb.dioe.at'
    },
    {
      text: 'dissdb-test.dioe.at',
      value: 'https://dissdb-test.dioe.at'
    },
    {
      text: 'localhost:8000 (development)',
      value: 'http://localhost:8000'
    },
    {
      text: 'dioedb.demo.dioe.at',
      value: 'https://dioedb.demo.dioe.at'
    }
  ]

  searchTerm = ''
  importingLocalFile = false
  loadingTranscriptId: number|null = null
  loggedIn: boolean = false
  importableExmaraldaFile: ParsedExmaraldaXML|null = null
  errorMessage: string|null = null
  isLoadingBackendUrl = false

  @Watch('settings.backEndUrl', { immediate: true })
  async onUpdateBackEndUrl(url: string|null) {
    if (url !== null) {
      this.connectToBackend(url)
    } else {
      this.useLocalTranscripts()
    }
  }

  useLocalTranscripts() {
    eventStore.transcripts = diskService.localTranscripts
  }

  async connectToBackend(url: string|null) {
    this.isLoadingBackendUrl = true
    settings.backEndUrl = url
    this.updateTokenTypePreset()
    await this.loadTranscriptList(url)
    this.isLoadingBackendUrl = false
    console.log('connect to backend', url, 'update server', process.env.UPDATE_SERVER)
    // FIXME:
    // if (process.env.UPDATE_SERVER !== undefined) {
    //   socket.connectToSocket('https://dioedb.dioe.at')
    //   // socket.connectToSocket('http://localhost:3000')
    //   socket.onMessage((m) => {
    //     if (m.type === 'list_open_transcripts' && this.transcriptList !== null) {
    //       this.transcriptList = this.transcriptList.map(t => {
    //         return {
    //           ...t,
    //           users: m.transcripts.filter(ts => ts.transcript_id === t.pk).map(ts => ts.user.name),
    //           locked: m.transcripts.some(ts => ts.transcript_id === t.pk && ts.app === 'anno')
    //         }
    //       })
    //     }
    //   })
    // }
  }

  async onDropFile(e: DragEvent) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      if (e.dataTransfer.files !== null && e.dataTransfer.files.length === 1) {
        const fh = await e.dataTransfer.items.item(0).getAsFileSystemHandle()
        if (fh?.kind === 'file') {
          this.openFile(fh)
        }
      }
    }
  }

  // FIXME: this is insanely hacky.
  // the way to do it would be to store the project part (PP) in the
  // db alongside the transcript
  async updateTokenTypePreset() {
    if (settings.backEndUrl !== null && settings.backEndUrl.includes('dioedb')) {
      // settings.projectPreset = 'PP03'
    } else if (settings.backEndUrl !== null && settings.backEndUrl.includes('dissdb')) {
      settings.projectPreset = 'dissDB'
    }
  }

  async loadTranscriptList(url: string|null) {
    if (url === null) {
      eventStore.transcripts = await diskService.loadTranscriptList()
    } else {
      try {
        this.errorMessage = null
        const res = await getServerTranscripts(url)
        if (res.transcripts !== undefined) {
          this.loggedIn = true
          eventStore.transcripts = res.transcripts
        } else if ((res as any).error === 'login') {
          this.loggedIn = false
        }
      } catch (e) {
        this.loggedIn = false
        eventStore.transcripts = []
        this.errorMessage = 'could not load transcripts from back end.'
      }
    }
  }

  get filteredTranscriptList(): ServerTranscriptListItem[] {
    if (eventStore.transcripts !== null) {
      return eventStore.transcripts.filter(v => {
        return v.n.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
      })
    } else {
      return []
    }
  }

  async openProjectFile(f: FileSystemFileHandle) {
    this.importingLocalFile = true
    const p = await diskService.loadProjectFile(f)
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
    eventStore.events = previousEventStore.events
    eventStore.selectedEventIds = previousEventStore.selectedEventIds
    eventStore.selectedSearchResult = previousEventStore.selectedSearchResult
    eventStore.searchResults = previousEventStore.searchResults
    eventStore.searchTerm = previousEventStore.searchTerm
    eventStore.metadata = previousEventStore.metadata
    eventStore.userState = previousEventStore.userState
    eventStore.transcriptDownloadProgress = previousEventStore.transcriptDownloadProgress
    eventStore.status = 'finished'
    history.actions = historyFile
  }

  async loadImportedTranscript(t: ServerTranscript, audioData: File|null, audioUrl?: string): Promise<string> {
    const url = await this.loadLocalTranscript(t, audioData, audioUrl)
    this.importableExmaraldaFile = null
    return url
  }

  async loadLocalTranscript(t: ServerTranscript, audioData: File|Uint8Array|null, audioUrl?: string): Promise<string> {
    // update the UI state
    this.importingLocalFile = false
    this.loadingTranscriptId = null
    // update the state in the server transcript module
    mergeServerTranscript(t)
    // get the metadata
    eventStore.metadata = getMetadataFromServerTranscript(t)
    const defaultTier = eventStore.metadata.defaultTier || 'text'
    // convert the transcript
    const events = serverTranscriptToLocal(t, defaultTier)
    // compute all types
    eventStore.events = computeTokenTypesForEvents(
      events,
      eventStore.metadata.defaultTier || 'text',
      _(eventStore.metadata.speakers).map((s, k) => k).value()
    )
    // insert placeholders where necessary
    eventStore.events = insertPlaceholderTokens(eventStore.events, defaultTier)
    // TODO: if is local!!!
    history.autoSaver = async () => {
      console.log('auto saving 123!')
      eventStore.status = 'loading'
      await diskService.saveFile()
      eventStore.status = 'finished'
      console.log('auto saving 123! DONE.')
    }
    // get audio url
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

  async openFileDialog() {
    const f = await diskService.openFile({
      'application/zip': '.transcript',
      'text/xml': '.exb',
      'audio/ogg': '.ogg'
    })
    this.openFile(f)
  }

  async openFile(f: FileSystemFileHandle) {
    if (f.name.endsWith('.transcript')) {
      this.openProjectFile(f)
    } else if (f.name.endsWith('.exb')) {
      this.openExmaraldaFile(await f.getFile())
    } else if (f.name.endsWith('.ogg')) {
      this.initializeEmptyTranscript()
      loadAudioFromFile(await f.getFile())
    } else {
      alert('Unrecognized File type.')
    }
  }

  initializeEmptyTranscript() {
    eventStore.status = 'new'
  }

  async openTranscript(t: LocalTranscriptListItem|ServerTranscriptListItem) {
    if ('fileHandle' in t) {
      if (await diskService.getPermission(t.fileHandle)) {
        this.openProjectFile(t.fileHandle)
      }
    } else {
      Sentry.setContext('transcript', {
        name: t.n,
        id: t.pk
      })
      this.loadRemoteTranscript(t)
    }
  }

  async loadRemoteTranscript(t: ServerTranscriptListItem) {
    // TODO: ugly
    console.log({ t })
    this.loadingTranscriptId = t.pk
    const y = document.createElement('audio')
    socket.sendMessage({
      type: 'open_transcript',
      transcript_id: t.pk,
      app: 'transcribe'
    })
    socket.onMessage(m => {
      if (m.type === 'transcript_action' && m.transcript_id === t.pk) {
        // handleRemotePeerEvent(m.action)
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
