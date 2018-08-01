<template>
  <div>
    <v-layout>
      <v-flex xs1 />
      <v-flex>
        <h3 class="pa-4 transcript-title text-xs-center">
          {{ transcript.name || 'Untitled Transcript' }}
        </h3>
      </v-flex>
      <v-flex xs1 align-content-center justify-center>
        <v-spacer></v-spacer>
        <v-btn @click.stop="showSettings = true" icon flat>
          <v-icon>settings</v-icon>
        </v-btn>
      </v-flex>
      <settings @close="showSettings = false" :show="showSettings" />
    </v-layout>
    <wave-form
      tabindex="-1"
      @keyup.native="handleKey"
      @change-metadata="changeMetadata"
      @scroll="handleScroll"
      @add-segment="addSegment"
      :height="300"
      :scroll-to-segment="scrollToSegment"
      :audio-element="audioElement">
      <play-head
        :playing-segment="playingSegment"
        :audio-element="audioElement"
        @change-position="scrub"
        :metadata="metadata" />
      <div class="absolute">
        <segment-box
          v-for="(segment, key) in visibleSegments"
          :key="segment.id"
          :segmentKey="key"
          @contextmenu.native.stop.prevent="doShowMenu"
          @delete-segment="deleteSegment"
          @select-segment="selectSegment"
          @select-previous="selectPrevious"
          @select-next="selectNext"
          @play-segment="playSegment"
          @split-segment="splitSegment"
          :segment="segment"
          :previous-segment="visibleSegments[key - 1]"
          :next-segment="visibleSegments[key + 1]"
          :speaker-events="transcript.speakerEvents"
          :selected-segment="selectedSegment"
          :metadata="metadata">
          <template slot-scope="segment">
            <!-- inner elements go here -->
          </template>
        </segment-box>
        <v-menu
          min-width="150"
          lazy
          v-model="showMenu"
          :position-x="menuX"
          :position-y="menuY"
          absolute
          offset-y>
          <v-list class="context-menu-list" dense>
            <v-list-tile
              @click="playSegment(0, selectedSegment)">
              <v-list-tile-content>
                <v-list-tile-title>Play</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &#9251;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="splitSegmentFromMenu(0, selectedSegment)">
              <v-list-tile-content>
                <v-list-tile-title>Split</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                ⌘S
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="() => null">
              <v-list-tile-content>
                <v-list-tile-title>Show Transcript</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                ⌘&#9166;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              disabled
              @click="() => null">
              <v-list-tile-title>Show Spectrogram…</v-list-tile-title>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              @click="deleteSegment(0, selectedSegment)">
              <v-list-tile-content>
                <v-list-tile-title>Delete</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &larr;
              </v-list-tile-action>
            </v-list-tile>
          </v-list>
        </v-menu>
      </div>
    </wave-form>
    <!-- <h3 class="text-xs-center">
      <div
        v-for="(speaker, key) in transcript.speakerEvents[selectedSegment.id]"
        :key="key"
        v-if="selectedSegment !== null">
        <span>{{ key }}: </span>
        <span :key="key" v-for="(token, key) in speaker.tokens">
          {{ token }}
        </span>
      </div>
    </h3> -->
    <div v-if="
      transcript.segments &&
      transcript.speakers &&
      transcript.speakerEvents" class="tracks">
      <div
        v-for="(chunk, i) in chunkedSegments"
        :key="i"
        class="segment-chunk">
        <div
          v-for="segment in chunk"
          :key="segment.id"
          :class="['segment', segment.id === selectedSegment.id && 'segment-selected']">
          <div class="time" @dblclick="playSegment(0, segment)" @mousedown="selectAndScrollToSegment(segment)">
            {{ toTime(segment.startTime) }} - {{ toTime(segment.endTime) }}
          </div>
          <div
            class="speaker-segment"
            v-for="(speaker, key) in transcript.speakers"
            :key="key">
            <segment-transcript
              v-if="
                transcript.speakerEvents[segment.id] !== undefined &&
                transcript.speakerEvents[segment.id][speaker] !== undefined &&
                transcript.speakerEvents[segment.id][speaker].tokens !== undefined"
              class="tokens"
              :tokens="transcript.speakerEvents[segment.id][speaker].tokens"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import waveForm from './Waveform.vue'
import Settings from './Settings.vue'
import { Transcript } from './App.vue'
import segments from '@components/Segments.vue'
import segmentTranscript from '@components/SegmentTranscript.vue'
import segmentBox from '@components/SegmentBox.vue'
import playHead from '@components/PlayHead.vue'
import * as _ from 'lodash'
import * as fns from 'date-fns'
import audio from '../service/audio'

@Component({
  components: {
    waveForm,
    Settings,
    segments,
    segmentTranscript,
    playHead,
    segmentBox
  }
})
export default class Editor extends Vue {

  @Prop() audioElement: HTMLAudioElement
  @Prop() transcript: Transcript
  // TODO: percentages are impractical. use pixels
  segmentBufferPercent = .02
  metadata: any = null
  boundLeft = 0
  boundRight = 10
  selectedSegment: Segment|null = {id: undefined, startTime: 0, endTime: 0 }
  scrollToSegment: Segment|null = null
  playingSegment: Segment|null = null
  segmentPlayingTimeout: any = null
  playHeadPos = 0
  showSettings = false
  showMenu = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  doShowMenu(e: MouseEvent) {
    console.log(e)
    // this is used for splitting
    this.layerX = e.layerX
    this.menuX = e.x
    this.menuY = e.y
    this.showMenu = true
  }

  splitSegmentFromMenu(segmentKey: number, segment: Segment) {
    const splitAt = this.layerX / this.pixelsPerSecond
    this.splitSegment(segmentKey, segment, splitAt)
  }

  handleKey(e: KeyboardEvent) {
    console.log(e.key)
    if (e.key === 'c') {
      console.log(this.metadata.pixelsPerSecond, this.playHeadPos)
      console.log('cut!')
    }
  }

  mounted() {
    this.audioElement.addEventListener('pause', () => {
      if (this.segmentPlayingTimeout !== null) {
        clearTimeout(this.segmentPlayingTimeout)
        this.segmentPlayingTimeout = null
      }
    })
  }

  scrub(time: number) {
    this.playHeadPos = time
    this.audioElement.currentTime = time
  }

  selectAndScrollToSegment(segment: Segment) {
    this.selectSegment(segment)
    this.$nextTick(() => {
      this.scrollToSegment = segment
    })
  }

  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }

  handleScroll(e: Event) {
    if (this.playingSegment === null) {
      requestAnimationFrame(() => {
        const el = (e.target as HTMLElement)
        const scrollFactorLeft = el.scrollLeft / el.scrollWidth
        const scrollFactorRight = (el.scrollLeft + el.clientWidth) / el.scrollWidth
        this.boundLeft = this.audioElement.duration * (scrollFactorLeft - this.segmentBufferPercent),
        this.boundRight = this.audioElement.duration * (scrollFactorRight + this.segmentBufferPercent)
      })
    }
  }

  detuneBy(speed: number): number {
    return ((1 / speed) - 1) * 1000
  }

  playBuffer(buffer: AudioBuffer, start = 0, offset?: number, duration?: number) {
    const src = audio.store.audioContext.createBufferSource()
    const speed = this.audioElement.playbackRate
    if (speed !== 1) {
      const x = document.createElement('audio')
      const wav = audio.audioBufferToWav(buffer)
      const blob = new Blob([new Uint8Array(wav)])
      x.src = URL.createObjectURL(blob)
      x.playbackRate = speed
      x.crossOrigin = 'anonymous'
      x.play()
      // TODO: remove audio element
      return src
    } else {
      src.buffer = buffer
      src.connect(audio.store.audioContext.destination)
      src.start(0, offset, duration)
      return src
    }
  }

  async playSegment(key: number, segment: Segment) {
    this.playingSegment = null
    if (audio.store.uint8Buffer.byteLength > 0) {
      const buffer = await audio.decodeBufferTimeSlice(
        segment.startTime,
        segment.endTime,
        audio.store.uint8Buffer.buffer
      )
      if (buffer !== undefined) {
        requestAnimationFrame(() => {
          this.playingSegment = segment
          this.playBuffer(buffer).addEventListener('ended', (e: Event) => {
            this.playingSegment = null
          })
        })
      }
    }
    // const listener = (e: Event) => {
    //   console.log(e)
    //   const playbackTimeInSeconds = (s.endTime - s.startTime) * (1 / this.audioElement.playbackRate)
    //   this.segmentPlayingTimeout = setTimeout(() => {
    //     console.log('pausing')
    //     this.audioElement.pause()
    //     console.log('paused')
    //     this.audioElement.removeEventListener('play', listener)
    //     this.playingSegment = null
    //   }, (playbackTimeInSeconds - 0.05) * 1000)
    // }
    // if (this.audioElement !== null) {
    //   this.audioElement.currentTime = segment.startTime
    //   this.audioElement.addEventListener('play', listener)
    //   this.audioElement.play()
    // }
  }

  selectSegment(segment: Segment) {
    this.selectedSegment = segment
  }

  selectPrevious(i: number) {
    this.selectAndScrollToSegment(this.transcript.segments[i - 1])
  }

  selectNext(i: number) {
    this.selectAndScrollToSegment(this.transcript.segments[i + 1])
  }

  addSegment(atTime: number) {
    const newSegment: Segment = {
      startTime: atTime,
      endTime: atTime + 1,
      labelText: '',
      id: _.uniqueId('user-segment-')
    }
    this.transcript.segments.push(newSegment)
  }

  deleteSegment(key: number, segment: Segment) {
    const i = _(this.transcript.segments).findIndex(s => s.id === segment.id)
    this.transcript.segments.splice(i, 1)
  }

  splitSegment(key: number, segment: Segment, splitAt: number) {
    const i = _(this.transcript.segments).findIndex(s => s.id === segment.id)
    const oldEndTime = segment.endTime
    const newSegment: Segment = {
      startTime: segment.startTime + splitAt,
      endTime: oldEndTime,
      labelText: segment.labelText,
      id: _.uniqueId('user-segment-')
    }
    segment.endTime = segment.startTime + splitAt
    this.transcript.segments.splice(i + 1, 0, newSegment)
  }

  get visibleSegments() {
    return _(this.transcript.segments)
      .filter((s) => {
        return s.startTime >= this.boundLeft && s.endTime <= this.boundRight
      })
      .sortBy('startTime')
      .value()
  }

  changeMetadata(metadata: any) {
    console.log({metadata})
    this.metadata = metadata
  }

  get chunkedSegments() {
    return [_(this.transcript.segments).chunk(250).value()[0]]
  }

  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.pixelsPerSecond
    } else {
      return 0
    }
  }

}
</script>
<style lang="stylus" scoped>
.transcript-title
  font-weight 300
  opacity .5
.tracks
  white-space nowrap
  overflow-x scroll
  padding 10px 40px 20px 40px
  &::-webkit-scrollbar
  &::-webkit-scrollbar-button
  &::-webkit-scrollbar-track
  &::-webkit-scrollbar-track-piece
    opacity 0
  &::-webkit-scrollbar-thumb
    background-color rgba(255,255,255,.4)
    border-radius 5px
    border 3px solid transparent
    border-radius 9px
    background-clip content-box
  // &::-webkit-scrollbar-corner
  // &::-webkit-resizer

.segment
  display inline-block
  vertical-align top
  border-right 1px solid rgba(255,255,255,.1)
  padding 0 6px
  color #444

.segment-selected
  color #000
  .token-type-indicator
    opacity 1
  .time
    color #ddd

.speaker-segment
  display block
  min-height 2em

.segment-chunk
  display inline-block

.time
  cursor default
  font-size 85%
  color #aaa
  text-align center

.jump-to
  opacity 0
  positon absolute
  top 5px
  right 5px

.context-menu-list
  color #b7b7b7
  a
    cursor default !important
</style>
