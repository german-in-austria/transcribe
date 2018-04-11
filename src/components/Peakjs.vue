<template>
  <div @keyup.ctrl.space.stop.prevent="handleSpace">
    <div
      @mousewheel="handleScroll"
      class="peaks-container"
      ref="peaksContainer"></div>
    <v-layout>
      <v-flex>
        <v-btn
          @click="addSegmentAtCurrentPosition"
          color="primary"
          flat small>
          <v-icon>add</v-icon>
          Segment
        </v-btn>
        <v-btn
          @click="addSpeaker(undefined)"
          color="primary"
          flat small>
          <v-icon>add</v-icon>
          Speaker
        </v-btn>
      </v-flex>
      <v-flex xs2 text-xs-right>
        <v-slider
          prepend-icon="zoom_in"
          color="grey"
          thumb-color="grey darken-2"
          hide-details
          :min="1"
          :max="zoomLevels.length"
          :step="1"
          ticks
          thumb-label
          v-model="currentZoomLevelIndex" />
      </v-flex>
    </v-layout>
    <v-layout class="max-width">
      <v-flex class="speakers text-xs-center" xs1>
        <div
          v-for="(speaker) in speakers"
          :ref="'speaker_' + speaker"
          :key="speaker"
          class="speaker-icon">
          {{ speaker }}
        </div>
      </v-flex>
       <v-flex xs11 ref="tracks" class="tracks">
        <div
          v-for="(segment, indexSegment) in segmentsInOrder"
          :class="{segment: true, seekedSegment: seekedSegment == indexSegment}"
          :ref="'segment_' + indexSegment"
          :key="indexSegment">
          <div>
            <div
              @click="selectSegment(segment, indexSegment)"
              :class="{times: true, seekedTime: seekedSegment == indexSegment}"
              :style="seekedSegment == indexSegment ? `background: ${segment.color}` : ''">
              {{ segment.startTime.toFixed(2) }}
            </div>
            <div
              v-for="(speaker) in speakers"
              class="track"
              :key="speaker">
              <speaker-event
                v-if="speakerEvents[segment.id] !== undefined"
                :metadata="speakerEvents[segment.id][speaker]"
                :segment="segment"
                :id="segment.id"
                :speaker="speaker"
                @focusEvent="this.focusedSpeaker = speaker"
                @updateSpeakerEvent="updateSpeakerEvent"
                @remove="removeSpeakerEvent(segment.id, speaker)"
                @play="playSegment(segment)"
              />
            </div>
          </div>
        </div>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import peaks from 'peaks.js'
import SpeakerEvent from './SpeakerEvent.vue'
import * as uuid from 'uuid/v4'
import * as _ from 'lodash'
const scrollTo = require('vue-scrollto')

const scrollToOptions = {
  container: '.tracks',
  easing: 'ease-out',
  offset: -200,
  cancelable: true,
  x: true,
  y: false
}

const wait = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
@Component({
  components: {
    SpeakerEvent
  }
})
export default class Transcript extends Vue {

  peaks: any = null
  segments: any[] = []
  speakerEvents: any = {}
  seekedSegment: number|null = null
  focusedSpeaker: string|null = null
  zoomLevels = [ 32, 64, 128, 256, 512, 1024, 2048 ]
  currentZoomLevelIndex = 5

  @Prop() audioElement: HTMLAudioElement
  @Prop() transcript: any

  speakers: string[] = [
    'Sp0'
  ]

  colors = [
    '#7ddb7f',
    '#6e5fe8',
    '#409700',
    '#ff6de0',
    '#82a500',
    '#d588ff',
    '#ef8104',
    '#008cf1',
    '#a34d00',
    '#683f92',
    '#e8c07f',
    '#c0007a',
    '#799360',
    '#aa002b',
    '#d2bbff',
    '#735300',
    '#ff90c3',
    '#51571c',
    '#ff8a7b',
    '#fbaeb0'
  ]

  handleSpace(e: KeyboardEvent) {
    if (this.seekedSegment !== null) {
      this.playSegment(this.segments[this.seekedSegment])
    }
    console.log(e)
  }
  @Watch('audioElement')
  onAudioChange() {
    this.initPeaks()
  }

  @Watch('seekedSegment')
  onSeekedSegmentChange(newVal: number) {
    scrollTo.scrollTo(document.querySelector('.seekedSegment'), 200, scrollToOptions)
    // this.$refs.tracks.
  }
  @Watch('currentZoomLevelIndex')
  onZoomChange(index: number) {
    this.setZoom(index)
  }
  setZoom(index: number) {
    const reversedIndex = this.zoomLevels.length - index
    this.peaks.zoom.setZoom(reversedIndex)
  }
  handleScroll(e: WheelEvent) {
    e.preventDefault()
    const next = this.peaks.player.getCurrentTime() + e.wheelDeltaX * -1 * 0.005
    const duration = this.peaks.player.getDuration()
    // prevent over-seek
    if (next < duration - .25) {
      this.peaks.player.seek(next)
    }
  }
  addSpeaker(name: string) {
    this.speakers.push(name || _.uniqueId('Sp'))
  }
  removeSegment(id: string) {
    this.peaks.segments.removeById(id)
  }
  async playSegment(segment: any) {
    this.peaks.player.pause()
    this.peaks.player.playSegment(segment)
  }
  selectSegment(segment: Segment, i: number) {
    if (i) {
      this.seekedSegment = i
    }
    this.jumpToTime(segment.startTime)
  }
  jumpToTime(time: number) {
    this.peaks.player.seek(time)
  }
  addSegmentAtCurrentPosition() {
    const currentTime = this.peaks.player.getCurrentTime()
    const id = uuid()
    this.peaks.segments.add({
      startTime: currentTime,
      endTime: currentTime + 1,
      editable: true,
      id
    })
    this.peaks.player.seek(currentTime + 1)
    this.speakerEvents[id] = {}
  }

  get segmentsInOrder(): Segment[] {
    return _(this.segments).orderBy('startTime').value()
  }
  updateSpeakerEvent(speaker: string, segment_id: string, tokens: any[]) {
    this.speakerEvents[segment_id][speaker] = { tokens }
  }
  async initPeaks() {
    if (this.peaks) {
      this.peaks.destroy()
      this.peaks = null
    }
    const AudioContext: any = window.webkitAudioContext || window.AudioContext || null
    console.log(AudioContext)
    if (AudioContext) {
      await wait(100)
      this.peaks = peaks.init({
        container: this.$refs.peaksContainer,
        mediaElement: this.audioElement,
        audioContext: new AudioContext(),
        keyboard: true,
        zoomAdapter: 'animated',
        zoomWaveformColor: 'rgba(0,0,0,0.2)',
        zoomLevels: this.zoomLevels
      })
      window.peaks = this.peaks
      this.peaks.on('peaks.ready', () => {
        // init with transcript
        if (this.transcript) {
          this.peaks.segments.add(this.transcript.segments.map((x: any) => {
            x.editable = true
            return x
          }))
          this.speakerEvents = this.transcript.speakerEvents
          this.speakers = this.transcript.speakers
          // add segment on double click
          const zoomContainer = document.querySelector('.zoom-container')
          console.log(zoomContainer)
          if (zoomContainer) {
            zoomContainer.addEventListener('dblclick', (e) => {
              this.addSegmentAtCurrentPosition()
            })
          }
        }
        this.segments = this.peaks.segments.getSegments()
        this.$emit('ready')
      })
      this.peaks.on('segments.add', (e: Event) => {
        // console.log(e)
      })
      this.peaks.on('segments.dragged', (e: Event) => {
        // console.log(e)
      })
      // this.peaks.on('user_seek', (e: number) => {
      //   const i = _(this.segmentsInOrder).findIndex((s) => {
      //     return s.startTime <= e && s.endTime >= e
      //   })
      //   if (i !== undefined) {
      //     this.seekedSegment = i
      //   } else {
      //     this.seekedSegment = null
      //   }
      // })
      this.setZoom(this.currentZoomLevelIndex)
      this.audioElement.addEventListener('timeupdate', _.debounce(() => {
        const time = this.audioElement.currentTime
        const i = _(this.segmentsInOrder).findIndex((s) => {
          return s.startTime <= time && s.endTime >= time
        })
        if (i !== undefined) {
          this.seekedSegment = i
        } else {
          this.seekedSegment = null
        }
      }, 50))
    }
  }
  async mounted() {
    this.initPeaks()
  }
}
</script>
<style lang="scss">
.overview-container{
  height: 65px;
}
.input-group--slider{
  padding-top: 0;
}
.input-group.input-group--slider.input-group--prepend-icon .slider{
  margin-left: 10px;
}
</style>

<style lang="scss" scoped>
.max-width{
  max-width: 100vw
}
.peaks-container{
  height: 300px;
}
.tracks{
  white-space: nowrap;
  overflow-x: scroll;
  .track{
    height: 40px;
  }
}
.seekedSegment{
  background: #f4f4f4;
}
.speaker-icon{
  margin-top: 10px;
  margin-bottom: 10px;
  width: 40px;
  height: 40px;
  background: cornflowerblue;
  color: white;
  border-radius: 100%;
  line-height: 40px;
  text-align: center;
}
.segment{
  transition: .4s background;
  padding: .5em .5em .5em .5em;
  border-right: 1px solid #dfdede;
  display: inline-block;
}
.times{
  -webkit-user-select: none;
  cursor: default;
  padding: .15em .75em 0 .75em;
  margin: .25em 0em;
  color: #ccc;
  font-size: 90%;
  border-radius: .8em;
  transition: .5s background, .5s color;
  &:hover{
    background: #f4f4f4;
    color: #333;
  }
  &.seekedTime{
    color: white;
  }
}
</style>
