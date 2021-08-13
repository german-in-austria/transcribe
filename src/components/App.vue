<template>
  <v-app :dark="settings.darkMode">
    <v-navigation-drawer
      v-if="store.transcript !== null"
      stateless
      style="padding: 0"
      :value="true"
      :width="settings.showDrawer ? settings.drawerWidth : 70"
      right
      disable-resize-watcher
      app>
      <sidebar
        :active="settings.showDrawer"
        :transcript="store.transcript"
      />
    </v-navigation-drawer>
    <v-content class="main-content">
      <v-container fluid fill-height class="pa-0">
        <exmaralda-importer
          v-if="importableExmaraldaFile !== null"
          :transcripts="store.allTranscripts"
          :importable="importableExmaraldaFile"
          @close="importableExmaraldaFile = null"
          @finish="loadImportedTranscript"
        />
        <v-layout
          @dragover.prevent=""
          @drop.stop.prevent="onDropFile"
          v-if="store.transcript === null"
          class="max-width pick-transcript-container"
          :align-center="store.allTranscripts === null"
          justify-center
          column>
          <v-progress-circular
            indeterminate
            v-if="store.allTranscripts === null && loggedIn === true && settings.backEndUrl !== null"
          />
          <v-flex v-if="store.allTranscripts !== null">
            <v-layout justify-center row>
              <v-flex class="pt-5 mt-3 pl-4 pr-4" xs12 md6>
                <h1 class="text-xs-center text-light text-uppercase mt-3 mb-4">
                  Transcribe
                </h1>
                <v-combobox
                  @change="connectToBackend"
                  :loading="isLoadingBackendUrl"
                  :error-messages="this.errorMessage !==  null ? [ this.errorMessage ] : []"
                  auto-select-first
                  data-cy="select-backend"
                  solo
                  hide-details
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
                <div
                  v-if="settings.backEndUrl !== null && loggedIn === false"
                  class="text-xs-center mt-5"
                >
                  Please <a data-cy="login-link" :href="`${ settings.backEndUrl }/login/`" target="_blank">login</a> and <a @click="loadTranscriptList(settings.backEndUrl)">refresh</a>
                </div>
                <div v-else>
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
                    class="sticky-header"
                    clearable
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
                </div>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout
          v-if="store.transcript !== null"
          class="max-width"
          justify-center>
          <v-flex xs12>
            <editor :transcript="store.transcript" />
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">

import { Vue, Component, Watch } from 'vue-property-decorator'

import editor from './Editor.vue'
import sidebar from './Sidebar.vue'
import exmaraldaImporter from './ExmaraldaImporter.vue'

// import * as socket from '../service/socket'
import diskService, { LocalTranscriptListItem } from '../service/disk.service'

import store from '@/store'
import settings from '@/store/settings.store'
import { fileToTextAndName } from '@/util'

import {
  ServerTranscript,
  ServerTranscriptListItem,
  getServerTranscripts,
  mergeServerTranscript,
  serverTranscriptToLocal,
  getMetadataFromServerTranscript
} from '@/service/backend-server.service'

import * as Sentry from '@sentry/browser'

import {
  ParsedExmaraldaXML,
  exmaraldaToImportable
} from '@/service/backend-exmaralda.service'

import FIcon from './helper/FIcon.vue'
import Transcript from '@/classes/transcript.class'

const SEARCH_TERM_PREFIX = 'transcribe_app_search_term'

@Component({
  components: {
    editor,
    exmaraldaImporter,
    sidebar,
    FIcon
  }
})
export default class App extends Vue {

  store = store
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

  searchTerm = localStorage.getItem(this.searchTermStorageKey) || ''
  importingLocalFile = false
  loadingTranscriptId: number|null = null
  loggedIn: boolean = false
  importableExmaraldaFile: ParsedExmaraldaXML|null = null
  errorMessage: string|null = null
  isLoadingBackendUrl = false

  @Watch('searchTerm')
  onChangeSearchTerm(v: string|null) {
    localStorage.setItem(this.searchTermStorageKey, v || '')
  }

  @Watch('settings.backEndUrl', { immediate: true })
  async onUpdateBackEndUrl(url: string|null) {
    if (url !== null) {
      this.connectToBackend(url)
    } else {
      this.useLocalTranscripts()
    }
    this.searchTerm = localStorage.getItem(this.searchTermStorageKey) || ''
  }

  get searchTermStorageKey(): string {
    return SEARCH_TERM_PREFIX + '__' + (settings.backEndUrl || '')
  }

  useLocalTranscripts() {
    store.allTranscripts = diskService.localTranscripts
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

  // FIXME:
  // Here, we’re picking the project preset based on the backend url.
  // This is insanely hacky.
  // The right way to do it would be to store the project part (PP) in the
  // DB alongside the transcript.
  async updateTokenTypePreset() {
    if (settings.backEndUrl !== null && settings.backEndUrl !== undefined && settings.backEndUrl.includes('dioedb')) {
      // settings.projectPreset = 'PP03'
    } else if (settings.backEndUrl !== null && settings.backEndUrl !== undefined && settings.backEndUrl.includes('dissdb')) {
      settings.projectPreset = 'dissDB'
    }
  }

  async loadTranscriptList(url: string|null) {
    console.log('url when loading', url)
    if (url === null) {
      store.allTranscripts = await diskService.loadTranscriptList()
    } else {
      try {
        this.errorMessage = null
        const res = await getServerTranscripts(url)
        if (res.transcripts !== undefined) {
          this.loggedIn = true
          store.allTranscripts = res.transcripts
        } else if ((res as any).error === 'login') {
          this.loggedIn = false
        }
      } catch (e) {
        this.loggedIn = false
        store.allTranscripts = []
        this.errorMessage = 'could not load transcripts from back end.'
      }
    }
  }

  get filteredTranscriptList(): ServerTranscriptListItem[] {
    if (store.allTranscripts !== null) {
      if (this.searchTerm !== null) {
        return store.allTranscripts.filter(v => {
          return v.n.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1
        })
      } else {
        return store.allTranscripts
      }
    } else {
      return []
    }
  }

  async loadImportedTranscript(t: ServerTranscript, audioData: File|null, audioUrl?: string) {
    mergeServerTranscript(t)
    const meta = getMetadataFromServerTranscript(t)
    const defaultTier = meta.defaultTier || 'text'
    const events = serverTranscriptToLocal(t, defaultTier)
    store.transcript = new Transcript({ events, meta: { ...meta, lockedTokens: [] } }, audioData || audioUrl)
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
      this.importingLocalFile = true
      store.transcript = new Transcript(f)
    } else if (f.name.endsWith('.exb')) {
      this.openExmaraldaFile(await f.getFile())
    } else if (f.name.endsWith('.ogg')) {
      store.transcript = new Transcript(await f.getFile())
    } else {
      alert('Unrecognized File type.')
    }
  }

  initializeEmptyTranscript() {
    store.status = 'new'
    store.transcript = new Transcript()
  }

  async openTranscript(t: LocalTranscriptListItem|ServerTranscriptListItem) {
    if ('fileHandle' in t) {
      if (await diskService.getPermission(t.fileHandle)) {
        store.transcript = new Transcript(t.fileHandle)
        Sentry.setContext('transcript', {
          name: t.fileHandle.name,
          id: -1,
          type: 'local'
        })
      }
    } else {
      Sentry.setContext('transcript', {
        name: t.n,
        id: t.pk,
        type: 'remote'
      })
      this.loadRemoteTranscript(t)
    }
  }

  async loadRemoteTranscript(t: ServerTranscriptListItem) {
    // socket.sendMessage({
    //   type: 'open_transcript',
    //   transcript_id: t.pk,
    //   app: 'transcribe'
    // })
    if (settings.backEndUrl !== null) {
      store.transcript = new Transcript({
        id: t.pk,
        backEndUrl: settings.backEndUrl
      })
    }
  }
}
</script>
