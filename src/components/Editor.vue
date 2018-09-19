<template>
  <div>
    <v-toolbar class="elevation-0" fixed app>
      <div>{{ transcript.name || 'Untitled Transcript' }}</div>
      <v-spacer></v-spacer>
      <v-btn @click.stop="showSearch = true" icon flat>
        <v-icon>search</v-icon>
      </v-btn>
      <v-btn @click.stop="showSettings = true" icon flat>
        <v-icon>settings</v-icon>
      </v-btn>
      <v-btn class="mr-4" @click.stop="$emit('toggle-drawer')" icon flat>
        <v-icon>history</v-icon>
      </v-btn>
    </v-toolbar>
    <search
      :transcript="transcript"
      v-if="showSearch"
      @close="showSearch = false"
      :show="showSearch" />
    <settings-view
      v-if="showSettings" 
      @close="showSettings = false"
      :show="showSettings" />
    <spectogram
      v-if="isSpectogramVisible"
      @close="isSpectogramVisible = false"
      :show="isSpectogramVisible"
      :segment="spectogramSegment"
    />
    <wave-form
      tabindex="-1"
      class="no-outline"
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
      <div
        v-if="settings.showSegmentBoxes"
        class="absolute">
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
          :segment="segment"
          :previous-segment="visibleSegments[key - 1]"
          :next-segment="visibleSegments[key + 1]"
          :speaker-events="transcript.speakerEvents"
          :selected-segment="selectedSegment"
          :metadata="metadata">
        </segment-box>
        <v-menu
          min-width="150"
          lazy
          transition="none"
          v-model="showMenu"
          :position-x="menuX"
          :position-y="menuY"
          absolute
          offset-y>
          <v-list class="context-menu-list" dense>
            <v-list-tile
              @click="playSegment(selectedSegment)">
              <v-list-tile-content>
                <v-list-tile-title>Play</v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action>
                &#9251;
              </v-list-tile-action>
            </v-list-tile>
            <v-list-tile
              @click="splitSegmentFromMenu(selectedSegment)">
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
              @click="showSpectogram(selectedSegment)">
              <v-list-tile-title>Show Spectrogram…</v-list-tile-title>
            </v-list-tile>
            <v-divider />
            <v-list-tile
              @click="deleteSegment(selectedSegment)">
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

    <div ref="transcriptScrollbar" class="transcript-scrollbar">
      <triangle
        up
        class="transcript-scrollhandle"
        ref="transcriptScrollhandle" />
    </div>
    <transcript-editor
      @scroll="handleTranscriptScroll"
      @play-segment="playSegment"
      @select-segment="selectSegment"
      @scroll-to-segment="(s) => scrollToSegment = s"
      :selected-segment="selectedSegment"
      :transcript="transcript"/>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import waveForm from './Waveform.vue'
import settingsView from './Settings.vue'
import settings from '../store/settings'
import spectogram from './Spectogram.vue'
import search from './Search.vue'
import { Transcript } from './App.vue'
import transcriptEditor from '@components/TranscriptEditor.vue'
import segmentBox from '@components/SegmentBox.vue'
import triangle from '@components/Triangle.vue'
import playHead from '@components/PlayHead.vue'
import * as _ from 'lodash'
import * as fns from 'date-fns'
import audio from '../service/audio'

@Component({
  components: {
    waveForm,
    transcriptEditor,
    settingsView,
    spectogram,
    playHead,
    segmentBox,
    search,
    triangle
  }
})
export default class Editor extends Vue {

  @Prop() audioElement: HTMLAudioElement
  @Prop() transcript: Transcript
  // TODO: percentages are impractical. use pixels
  segmentBufferPercent = .01
  metadata: any = null
  boundLeft = 0
  boundRight = 10
  selectedSegment: Segment|null = {id: undefined, startTime: 0, endTime: 0 }
  scrollToSegment: Segment|null = null
  playingSegment: Segment|null = null
  segmentPlayingTimeout: any = null

  isSpectogramVisible = false
  spectogramSegment: Segment|null = null

  settings = settings
  playHeadPos = 0
  showSettings = false
  showSearch = false
  showMenu = false
  menuX = 0
  menuY = 0
  layerX = 0 // this is used for splitting

  handleTranscriptScroll(e: number) {
    const i = (this.$refs.transcriptScrollhandle as Vue).$el
    const o = this.$refs.transcriptScrollbar as HTMLElement
    requestAnimationFrame(() => {
      const pixels = e / this.audioElement.duration * o.clientWidth
      i.style.transform = `translateX(${ pixels }px)`
    })
  }

  doShowMenu(e: MouseEvent) {
    console.log(e)
    // this is used for splitting
    this.layerX = e.layerX
    this.menuX = e.x
    this.menuY = e.y
    this.showMenu = true
  }

  splitSegmentFromMenu(segment: Segment) {
    const splitAt = this.layerX / this.pixelsPerSecond
    this.splitSegment(segment, splitAt)
  }

  showSpectogram(segment: Segment) {
    this.isSpectogramVisible = true
    this.spectogramSegment = segment
  }

  handleKey(e: KeyboardEvent) {
    console.log(this.playHeadPos)
    if (e.key === 'c') {
      const segment = this.findSegmentAt(this.playHeadPos)
      console.log(segment)
      if (segment === undefined) {
        const s = this.addSegment(this.playHeadPos)
        this.$nextTick(() => this.selectSegment(s))
      } else {
        const splitAt = this.playHeadPos - segment.startTime
        this.splitSegment(segment, splitAt)
      }
    } else if (e.key === 'Backspace') {
      if (this.selectedSegment !== null) {
        this.deleteSegment(this.selectedSegment)
      }
    }
  }

  mounted() {
    if (this.audioElement instanceof HTMLAudioElement) {
      this.audioElement.addEventListener('pause', () => {
        if (this.segmentPlayingTimeout !== null) {
          clearTimeout(this.segmentPlayingTimeout)
          this.segmentPlayingTimeout = null
        }
      })
    }
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

  handleScroll(e: Event) {
    if (this.playingSegment === null) {
      requestAnimationFrame(() => {
        const el = (e.target as HTMLElement)
        const w = el.scrollWidth
        const l = el.scrollLeft
        const cw = el.clientWidth
        const scrollFactorLeft = l / w
        const scrollFactorRight = (l + cw) / w
        this.boundLeft = this.audioElement.duration * (scrollFactorLeft - this.segmentBufferPercent),
        this.boundRight = this.audioElement.duration * (scrollFactorRight + this.segmentBufferPercent)
      })
    }
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

  async playSegment(segment: Segment) {
    this.playingSegment = null
    if (audio.store.uint8Buffer.byteLength > 0) {
      console.log(segment)
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
    return newSegment
  }

  deleteSegment(segment: Segment) {
    const i = _(this.transcript.segments).findIndex(s => s.id === segment.id)
    this.transcript.segments.splice(i, 1)
  }

  splitSegment(segment: Segment, splitAt: number): Segment[] {
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
    return [ segment, newSegment ]
  }

  findSegmentAt(seconds: number): Segment|undefined {
    return _(this.transcript.segments).find((s) => {
      return s.startTime <= seconds && s.endTime >= seconds
    })
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
  overflow-x hidden
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

.transcript-scrollbar
  top -15px
  position relative
  height 20px

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
