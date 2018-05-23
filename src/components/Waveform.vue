<template>
  <div :class="{ disabled: disabled }">
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
            v-ripple="false"
            :disabled="currentZoomLevelIndex === 0"
            @click="currentZoomLevelIndex = currentZoomLevelIndex - 1"
            outline small>
            <v-icon>remove</v-icon>
          </v-btn>
          <v-btn
            v-ripple="false"
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
import { setInterval } from 'timers';

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

  @Prop() audioElement: HTMLAudioElement|null
  @Prop() audioUrl: string
  @Prop() scrollToSegment: Segment|null

  onScroll = _.throttle((e) => this.handleScroll(e), 250)
  disabled = false
  svg: SVGElement|null = null
  audioBuffer: AudioBuffer|null = null
  drawWidth = 5000 // pixels
  preRenderSize = 5 * 1024 * 1024

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

  @Watch('scrollToSegment')
  doScrollToSegment() {
    const s = this.scrollToSegment
    if (s !== null) {
      const container = this.$refs.svgContainer
      const duration = s.endTime - s.startTime
      const offset = (s.startTime + duration / 2) * this.pixelsPerSecond
      if (container instanceof HTMLElement) {
        const currentOffset = container.scrollLeft
        container.scrollTo({
          left: offset - window.innerWidth / 2
        })
      }
    }
  }

  @Watch('audioElement')
  async onAudioElementChange() {
    if (this.audioElement !== null) {
      this.loading = true
      console.time('fetch')
      const x = await fetch(this.audioElement.src).then(y => y.arrayBuffer())
      console.timeEnd('fetch')
      const context: AudioContext = new ctxClass()
      console.time('decode prerender size (5mb)')
      this.audioLength = this.audioElement.duration
      const audioBuffer = await context.decodeAudioData(
        x.slice(0, this.preRenderSize > x.byteLength ? x.byteLength : this.preRenderSize)
      )
      console.timeEnd('decode prerender size (5mb)')
      this.audioBuffer = audioBuffer
      this.loading = false
      this.$nextTick(() => {
        this.drawWaveFormPiece()
        this.$nextTick(async () => {
          console.time('decode all')
          this.audioBuffer = await context.decodeAudioData(x)
          this.disabled = true
          console.timeEnd('decode all')
          await this.drawWaveFormPiece()
          this.disabled = false
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

  visibleWaveFormPiece(): number {
    const el = (this.$refs.svgContainer as HTMLElement)
    if (el) {
      const x = Math.floor((el.scrollLeft + el.clientWidth * 3) / this.drawWidth)
      return x
    } else {
      return 0
    }
  }

  async drawWaveFormPiece() {
    if (this.audioBuffer !== null) {
      const i = this.visibleWaveFormPiece()
      console.log(this.amountDrawSegments)
      console.log(this.audioLength)
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

  get pixelsPerSecond() {
    if ( this.totalWidth !== null && this.audioElement !== null) {
      return this.totalWidth / this.audioElement.duration
    } else {
      return 0
    }
  }

}
</script>
<style lang="stylus" scoped>
.disabled
  cursor progress
  pointer-events none
  opacity .5
.wave-form-segment
  position absolute
.wave-form
  position relative
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
