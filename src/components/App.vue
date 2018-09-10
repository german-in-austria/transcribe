<template>
  <v-app dark>
    <v-content class="main-content" app>
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
            v-if="transcript !== null">
            <editor
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
import peakjs from './Peakjs.vue'
import playerBar from './PlayerBar.vue'
import VueFullScreenFileDrop from 'vue-full-screen-file-drop'
import 'vue-full-screen-file-drop/dist/vue-full-screen-file-drop.css'
import * as parseXML from '@rgrove/parse-xml'
import parseTranscriptFromTree, { ParsedXML } from '../service/transcript-parser'
import editor from './Editor.vue'
import audio from '../service/audio'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
    peaks: any
  }
}

interface FileReaderEventTarget extends EventTarget {
  result: string
}

export interface SpeakerEvent {
  [key: string]: {
    tokens: string[]
  }
}

export interface Transcript {
  name: string
  audioUrl: string
  speakers: string[]
  segments: Segment[]
  speakerEvents: _.Dictionary<SpeakerEvent>
}

const sampleTranscript = {
  name: 'Thermodynamics',
  audioUrl: '/static/audio/thermodynamics.ogg',
  speakers : [ 'HJS', 'MS' ],
  segments : _(0).range(1000).map((i) => {
    return {
      id: String(i),
      startTime: i + 1,
      endTime: i + 1 + 0.95
    }
  }).value(),
  speakerEvents : _(_.range(0, 1000)).reduce((m: any, e, i, l) => {
    m[i] = {
      HJS : {
        tokens : [
          'in', 'this', 'house'
        ]
      }
    }
    return m
  }, {})
}

@Component({
  components : {
    editor,
    peakjs,
    VueFullScreenFileDrop,
    playerBar
  }
})
export default class App extends Vue {

  drawer = true
  audioUrl: string|null = null
  audioElement: HTMLAudioElement|null = null
  transcript: Transcript|null = null
  xmlText: string|null = null
  xml: any = null

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

  transcriptTreeToTranscribable(tree: ParsedXML, name: string): any {
    const segments = _(tree.speakers)
      .map(tiers => _.map(tiers, tier => _.map(tier.events, event => ({
        id: `${event.start}-${event.end}`,
        startTime: Number(event.startTime),
        endTime: Number(event.endTime)
      }) )))
      .flatten()
      .flatten()
      .flatten()
      .uniqBy(s => s.id)
      .orderBy(s => s.startTime)
      .value()
    const speakers = _(tree.speakers).map((t, v) => v).value()
    const speakerEvents = _(tree.speakers)
      .map((t, key) => {
        // only the first tier for now
        return _.toArray(t)[0].events.map(e => {
          return {
            start  : e.start,
            end    : e.end,
            tokens : e.text !== null ? e.text.trim().split(' ') : [],
            speaker: key
          }
        })
      })
      .flatten()
      .groupBy(e => `${e.start}-${e.end}`)
      .mapValues(spe => _.keyBy(spe, 'speaker'))
      .value()
    this.transcript = {
      name,
      audioUrl: '',
      speakerEvents,
      segments,
      speakers
    }
    sampleTranscript.speakerEvents = speakerEvents
    sampleTranscript.segments = segments
    sampleTranscript.speakers = speakers
    console.log(segments)
    return tree
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
        this.audioElement = y
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
          this.xml = this.transcriptTreeToTranscribable(parseTranscriptFromTree(parseXML((e.target as FileReaderEventTarget).result)), file.name)
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
    this.transcriptTreeToTranscribable(parseTranscriptFromTree(parseXML(xmlString)), 'NECK_jungII_m_INT')
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
