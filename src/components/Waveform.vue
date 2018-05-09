<template>
  <div>
    <h1>hello</h1>
    <div class="wave-form text-xs-center" v-if="loading">
      loading
    </div>
    <div
      v-else
      class="wave-form"
      ref="svgContainer"
      @scroll="onScroll">
      <div
        :style="{ width: totalWidth + 'px' }"
        class="wave-form-inner">
        <div
          v-for="(x, i) in Array(amountDrawSegments)"
          :style="{
            left: drawWidth * i + 'px',
            width: i + 1 < amountDrawSegments ? drawWidth + 'px' : 'auto'
          }"
          :key="i"
          :class="['wave-form-segment', 'draw-segment-'+i]">
        </div>
        <slot />
      </div>
    </div>
    <v-layout>
      <v-flex>
        <!-- <v-btn
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
        </v-btn> -->
      </v-flex>
      <v-flex xs2 text-xs-right>
        <v-btn-toggle>
          <v-btn
            :disabled="currentZoomLevelIndex === 0"
            @click="currentZoomLevelIndex = currentZoomLevelIndex - 1"
            outline small>
            <v-icon>remove</v-icon>
          </v-btn>
          <v-btn
            :disabled="currentZoomLevelIndex + 1 === zoomLevels.length"
            @click="currentZoomLevelIndex = currentZoomLevelIndex + 1"
            outline small>
            <v-icon>add</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as drawBuffer from 'draw-wave'
import * as sliceAudiobuffer from 'audiobuffer-slice'
import * as _ from 'lodash'

function sliceBuffer(buffer: AudioBuffer, start: number, end: number): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    sliceAudiobuffer(buffer, start, end, (err: Error, sliced: AudioBuffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(sliced)
      }
    })
  })
}

const ctxClass: any = window.AudioContext

@Component
export default class Waveform extends Vue {

  onScroll = _.throttle((e) => this.handleScroll(e), 250)

  svg: SVGElement|null = null
  audioBuffer: AudioBuffer|null = null
  drawWidth = 5000 // pixels
  // seconds per drawWidth
  zoomLevels = [
    1024,
    512,
    256,
    128,
    64,
    32,
    16,
    8,
    4,
    2,
    1,
  ]
  currentZoomLevelIndex = Math.floor(this.zoomLevels.length / 2)
  audioLength = 0
  currentlyVisibleWaveFormPiece = 0
  loading = false

  @Prop() audioElement: HTMLAudioElement|null
  @Prop() audioUrl: string
  @Prop() data: boolean

  handleScroll(e: Event) {
    this.$emit('scroll', e)
    if (this.currentlyVisibleWaveFormPiece !== this.visibleWaveFormPiece()) {
      this.currentlyVisibleWaveFormPiece = this.visibleWaveFormPiece()
      console.log('drawing', this.visibleWaveFormPiece())
      this.drawWaveFormPiece()
    }
  }

  mounted() {
    this.$nextTick(() => this.onAudioElementChange())
  }

  @Watch('audioElement')
  async onAudioElementChange() {
    if (this.audioElement !== null) {
      this.loading = true
      console.time('fetch')
      const x = await fetch(this.audioElement.src).then(y => y.arrayBuffer())
      console.timeEnd('fetch')
      const context: AudioContext = new ctxClass()
      console.time('decode first 10mb')
      this.audioLength = this.audioElement.duration
      const audioBuffer = await context.decodeAudioData(x.slice(0, 5 * 1024 * 1024))
      console.timeEnd('decode first 10mb')
      this.audioBuffer = audioBuffer
      this.loading = false
      this.$nextTick(() => {
        this.drawWaveFormPiece()
        this.$nextTick(async () => {
          console.time('decode all')
          this.audioBuffer = await context.decodeAudioData(x)
          console.timeEnd('decode all')
          this.drawWaveFormPiece()
        })
      })
    }
  }

  get amountDrawSegments() {
    return Math.ceil(this.audioLength / this.zoomLevels[this.currentZoomLevelIndex])
  }

  get totalWidth() {
    return this.amountDrawSegments * this.drawWidth
  }

  visibleWaveFormPiece() {
    const el = (this.$refs.svgContainer as HTMLElement)
    const x = Math.floor((el.scrollLeft + el.clientWidth * 3) / this.drawWidth)
    return x
  }

  async drawWaveFormPiece() {
    if (this.audioBuffer !== null) {
      const i = this.visibleWaveFormPiece()
      const isLast = i + 1 === this.amountDrawSegments
      const secondsPerDrawWidth = this.zoomLevels[this.currentZoomLevelIndex]
      const from = i * secondsPerDrawWidth * 1000
      // tslint:disable-next-line:max-line-length
      const to = isLast ? this.audioLength * 1000 : from + secondsPerDrawWidth * 1000
      console.time('slicing')
      const slicedBuffer = await sliceBuffer(this.audioBuffer, from, to)
      console.timeEnd('slicing')
      console.time('drawBuffer')
      this.svg = drawBuffer.svg(
        slicedBuffer,
        isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth,
        200,
        '#ccc'
      )
      console.timeEnd('drawBuffer')
      if (this.$refs.svgContainer instanceof HTMLElement) {
        console.time('render')
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        el.innerHTML = '';
        el.appendChild((this.svg as Node))
        el.classList.add('show')
        console.timeEnd('render')
        this.$emit('change-metadata', {
          totalWidth: this.totalWidth,
          amountDrawSegments: this.amountDrawSegments,
          currentZoomLevel: this.zoomLevels[this.currentZoomLevelIndex],
          audioLength: this.audioLength,
          drawWidth: this.drawWidth
        })
      }
    }
  }

  @Watch('currentZoomLevelIndex')
  onZoom() {
    this.drawWaveFormPiece()
  }

}
</script>
<style lang="stylus" scoped>
.wave-form-segment
  position absolute
.wave-form
  height 200px
  max-width 100vw
  overflow-x scroll
  .wave-form-inner
    height 200px
    position relative
    .wave-form-segment
      transition .5s opacity 
      opacity 0
      &.show
        opacity 1
</style>
