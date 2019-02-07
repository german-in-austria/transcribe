<template>
  <v-app :dark="settings.darkMode">
    <v-navigation-drawer
      style="padding: 0"
      v-model="drawer"
      right
      app>
      <sidebar :errors="errors" />
    </v-navigation-drawer>
    <v-content class="main-content">
      <v-container fluid fill-height class="pa-0">
        <vue-full-screen-file-drop
          class="file-dropper"
          @drop='onFileDrop'>
          &nbsp;
        </vue-full-screen-file-drop>
        <v-layout
          v-if="audioElement === null && eventStore.status === 'empty'"
          class="max-width pick-transcript-container"
          :align-center="transcriptList === null"
          justify-center>
          <div v-if="loggedIn === false">
            Please <a href="https://dissdb.dioe.at/login" target="_blank">login</a> and <a href="/">refresh</a>
          </div>
          <v-progress-circular
            indeterminate
            v-if="transcriptList === null && loggedIn === true"/>
          <v-flex class="pt-5" xs6 md4 v-if="transcriptList !== null">
            <h1 class="title text-xs-center text-light text-uppercase mt-3 mb-4">
              Transcribe
            </h1>
            <v-text-field
              v-model="searchTerm"
              placeholder="search…"
              prepend-icon="search"
              autofocus />
            <v-list
              class="transparent scrollable"
              dense
              subheader
              two-line>
              <v-list-tile
                disabled
                @click="initializeEmptyTranscript()">
                <v-list-tile-content>
                  <v-list-tile-title>
                    Create new Transcript
                  </v-list-tile-title>
                </v-list-tile-content>
              </v-list-tile>
              <v-subheader>
                Pick a Transcript
              </v-subheader>
              <v-list-tile
                @click="loadTranscript(transcript.pk)"
                :key="transcript.pk"
                v-for="transcript in filteredTranscriptList">
                <v-list-tile-content>
                  <v-list-tile-title>
                    {{ transcript.n }}
                  </v-list-tile-title>
                  <v-list-tile-sub-title>
                    {{ transcript.ut }}
                  </v-list-tile-sub-title>
                  <v-progress-linear class="ma-0 pa-0" height="2" v-if="loadingTranscriptId === transcript.pk" indeterminate />
                </v-list-tile-content>
              </v-list-tile>
              <v-list-tile class="text-xs-center" v-if="filteredTranscriptList.length === 0">
                <span class="caption">
                  no matching transcripts found
                </span>
              </v-list-tile>
            </v-list>
          </v-flex>
        </v-layout>
        <v-layout
          v-if="eventStore.status !== 'empty'"
          class="max-width"
          justify-center>
          <v-flex xs12>
            <editor
              @toggle-drawer="e => drawer = !drawer"
              :errors="errors"
              :audio-element="audioElement" />
            <router-view />
            <player-bar
              v-if="audioElement"
              :audioElement="audioElement" />
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
import 'vue-full-screen-file-drop/dist/vue-full-screen-file-drop.css'
import VueFullScreenFileDrop from 'vue-full-screen-file-drop'
import editor from './Editor.vue'
import sidebar from './Sidebar.vue'

import audio from '../service/audio'
import settings from '../store/settings'
// tslint:disable-next-line:max-line-length
import { LocalTranscriptEvent, eventStore, speakerEventHasErrors } from '../store/transcript'
import { getTranscript } from '../service/data-backend/server-backend'
import { loadExmeraldaFile } from '../service/data-backend/exmaralda-backend'

interface FileReaderEventTarget extends EventTarget {
  result: string
}

@Component({
  components : {
    editor,
    sidebar,
    VueFullScreenFileDrop,
    playerBar
  }
})
export default class App extends Vue {

  drawer = false
  audioElement: HTMLAudioElement|null = null
  xmlText: string|null = null
  xml: any = null
  settings = settings
  transcriptList: ServerTranscriptListItem[]|null = null
  loadingTranscriptId: number|null = null
  searchTerm = ''
  loggedIn = true
  eventStore = eventStore

  async mounted() {
    const res = (await (await fetch('https://dissdb.dioe.at/routes/transcripts', {
      credentials: 'include'
    })).json())
    if (res.transcripts !== undefined) {
      this.transcriptList = res.transcripts
    } else if (res.error === 'login') {
      this.loggedIn = false
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

  onFileDrop(formData: FormData, files: FileList) {
    console.log(files[0].type)
    _(files).forEach(file => {
      if (this.isAudio(file)) {
        const x = URL.createObjectURL(file)
        this.eventStore.metadata.audioUrl = x
        const y = document.createElement('audio')
        y.src = x
        const reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = function() {
          audio.store.isLocalFile = true
          audio.store.uint8Buffer = new Uint8Array(this.result as ArrayBuffer)
        }
        y.addEventListener('durationchange', () => {
          this.audioElement = y
        })
        // initialize with empty transcript,
        // if there is none.
      } else if (this.isXML(file)) {
        const reader = new FileReader()
        reader.onload = (e: Event) => {
          // tslint:disable-next-line:max-line-length
          loadExmeraldaFile((e.target as FileReaderEventTarget).result, file.name)
        }
        reader.readAsText(file)
        console.log('xml')
      } else {
        alert('unsupported file type')
        console.log('unsupported file type', file)
      }
    })
  }

  initializeEmptyTranscript() {
    this.eventStore.status = 'new'
  }

  async loadTranscript(pk: number) {
    this.loadingTranscriptId = pk
    const y = document.createElement('audio')
    getTranscript(pk, (p, es) => {
      if (this.eventStore.metadata.audioUrl !== null) {
        console.log(this.eventStore.metadata)
        y.src = this.eventStore.metadata.audioUrl
        this.loadingTranscriptId = null
      }
      console.log(p)
    })

    y.addEventListener('durationchange', (e) => {
      this.audioElement = y
    })
  }

  get errors() {
    return eventStore.events.filter(e => {
      return speakerEventHasErrors(e)
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
