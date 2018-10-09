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
          class="max-width"
          :align-center="audioElement === null || transcript === null"
          justify-center>
          <div
            v-if="transcript === null"
            class="text-xs-center">
            <h1>Drop an audio file here.</h1>
            <p>or, use the <a @click="loadSampleFile" href="#">sample file</a></p>
          </div>
          <v-flex
            xs12
            v-if="transcript !== null && audioElement !== null">
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
import transcript, { loadExmeraldaFile } from '../store/transcript'

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
  emptyTranscript = {
    name: '',
    audioUrl: this.audioUrl || '',
    speakers: [],
    segments : [],
    speakerEvents: {}
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
        console.log(x)
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

  async loadSampleFile() {
    // tslint:disable-next-line:max-line-length
    const xmlString = await (await fetch('https://transcribe.dioe.at/files/0025_NECK_jungII_m_INT_vollständig.exb')).text()
    // tslint:disable-next-line:max-line-length
    this.transcript = loadExmeraldaFile('NECK_jungII_m_INT', xmlString)

    const y = document.createElement('audio')
    y.src = 'https://transcribe.dioe.at/files/0025_NECK_jungII_m_INT.ogg'
    y.addEventListener('durationchange', (e) => {
      this.audioElement = y
    })
  }
}
</script>
<style lang="stylus" scoped>
.max-width{
  max-width: 100%;
}
.help {
  border-top 1px solid rgba(0,0,0,.1)
  border-radius 0
  background transparent
  box-shadow none
  font-weight: 300
}
.file-dropper{
  position: absolute;
}
</style>
