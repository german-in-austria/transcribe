<template>
  <v-app :dark="settings.darkMode">
    <v-navigation-drawer
      style="padding: 0"
      v-model="drawer"
      right
      app>
      <history />
    </v-navigation-drawer>
    <v-content class="main-content">
      <v-container fluid fill-height class="pa-0">
        <vue-full-screen-file-drop
          class="file-dropper"
          @drop='onFileDrop'>
          &nbsp;
        </vue-full-screen-file-drop>
        <v-layout
          v-if="audioElement === null && transcript === null"
          class="max-width pick-transcript-container"
          :align-center="transcriptList === null"
          justify-center>
          <v-progress-circular
            indeterminate
            v-if="transcriptList === null"/>
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
          v-if="transcript !== null && audioElement !== null"
          class="max-width"
          justify-center>
          <v-flex xs12>
            <editor
              @toggle-drawer="e => drawer = !drawer"
              :transcript="transcript"
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
import history from './History.vue'

import audio from '../service/audio'
import settings from '../store/settings'
import transcript, { loadExmeraldaFile, getTranscript } from '../store/transcript'

interface FileReaderEventTarget extends EventTarget {
  result: string
}

@Component({
  components : {
    editor,
    history,
    VueFullScreenFileDrop,
    playerBar
  }
})
export default class App extends Vue {

  drawer = false
  audioUrl: string|null = null
  audioElement: HTMLAudioElement|null = null
  transcript: Transcript|null = transcript
  xmlText: string|null = null
  xml: any = null
  settings = settings
  transcriptList: ServerTranscriptListItem[]|null = null
  loadingTranscriptId: number|null = null
  searchTerm = ''

  emptyTranscript = {
    name: '',
    audioUrl: this.audioUrl || '',
    speakers: [],
    segments : [],
    speakerEvents: {}
  }

  async mounted() {
    this.transcriptList = (await (await fetch('https://dissdb.dioe.at/routes/transcripts', {
      credentials: 'include'
    })).json()).transcripts
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
      console.log(JSON.stringify(file))
      if (this.isAudio(file)) {
        const x = URL.createObjectURL(file)
        this.audioUrl = x
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
        if (this.transcript === null) {
          this.transcript = this.emptyTranscript
        }
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

  async loadTranscript(pk: number) {
    this.loadingTranscriptId = pk
    const y = document.createElement('audio')
    getTranscript(pk, (p, t) => {
      this.transcript = t
      if (!y.src && this.transcript && this.transcript.audioUrl) {
        y.src = this.transcript.audioUrl
        this.loadingTranscriptId = null
      }
    })
    y.addEventListener('durationchange', (e) => {
      this.audioElement = y
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
