<template>
  <v-app>
    <v-content class="main-content" app>
      <v-container fluid fill-height>
        <vue-full-screen-file-drop @drop='onFileDrop'>&nbsp;</vue-full-screen-file-drop>
        <v-layout class="max-width" :align-center="audioElement === null" justify-center>
          <div v-if="transcript === null" class="text-xs-center">
            <h1>Drop an audio file here.</h1>
            <p>or, use the <a @click="loadSampleFile" href="#">sample file</a></p>
          </div>
          <v-flex xs12 v-if="transcript !== null">
            <editor
              :transcript="transcript"
              :audio-element="audioElement" />
            <router-view />
            <v-card class="mt-4 help">
              <v-card-title class="pb-0 mb-0" primary-title>
                <h4 class="headline mb-0">Tips & Shortcuts</h4>
              </v-card-title>
              <v-card-text class="mt-0 ml-3 mr-3">
                <ul>
                  <li>Double Click the waveform to add a segment in-place.</li>
                  <li>Press Ctrl+Space to play the current segment</li>
                </ul>
              </v-card-text>
            </v-card>
            <player-bar v-if="audioElement" :audioElement="audioElement" />
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
  segments: Array<{
    id: string
    startTime: number
    endTime: number
  }>
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
  file: File
  xmlText: string|null = null
  xml: any = null

  isAudio(file: File) {
    return file.type.includes('audio/')
  }

  transcriptTreeToTranscribable(tree: ParsedXML): any {
    const segments = _(tree.speakers)
      .map(tiers => _.map(tiers, tier => _.map(tier.events, event => ({
        id: `${event.start}-${event.end}`,
        startTime: Number(event.startTime),
        endTime: Number(event.endTime)
      }) )))
      .flatten()
      .flatten()
      .flatten()
      .uniqBy(segment => segment.id)
      .value()
    const speakers = _(tree.speakers).map((t, v) => v).value()
    const speakerEvents = _(tree.speakers)
      .map((t, key) => {
        // only the first tier for now
        return _.toArray(t)[0].events.map(e => {
          return {
            start: e.start,
            end: e.end,
            tokens : e.text !== null ? e.text.trim().split(' ') : [],
            speaker : key
          }
        })
      })
      .flatten()
      .groupBy(e => `${e.start}-${e.end}`)
      .mapValues(spe => _.keyBy(spe, 'speaker'))
      .value()
    this.transcript = {
      name: 'test transcript',
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
    // return {
    //   name: 'bla',
    //   audioUrl: sampleTranscript.audioUrl,
    //   speakers : tree.speakers.map(s => s.display_name),
    //   segments : tree.speakers.,
    //   speakerEvents: tree.speakers
    // }
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
        this.audioUrl = x
        const y = document.createElement('audio')
        y.src = x
        this.audioElement = y
        console.log(x)
      } else if (this.isXML(file)) {
        const reader = new FileReader()
        reader.onload = (e: Event) => {
          // tslint:disable-next-line:max-line-length
          this.xml = this.transcriptTreeToTranscribable(parseTranscriptFromTree(parseXML((e.target as FileReaderEventTarget).result)))
        }
        reader.readAsText(file)
        console.log('xml')
      } else {
        alert('unsupported file type')
        console.log('unsupported file type', file)
      }
    })
  }

  loadSampleFile() {
    this.transcript = sampleTranscript
    const y = document.createElement('audio')
    y.src = sampleTranscript.audioUrl
    this.audioElement = y
  }

  async mounted() {
    console.log('mounted')
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
</style>
