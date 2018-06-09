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
            transform: `scaleY(${scaleFactorY})`,
            left: drawWidth * i + 'px',
            width: i + 1 < amountDrawSegments ? drawWidth + 'px' : 'auto'
          }"
          :key="i"
          :class="['wave-form-segment', 'draw-segment-'+i]">
          <div class="wave-form-placeholder" />
        </div>
        <slot />
      </div>
    </div>
    <div class="overview">
      <div
        tabindex="-1"
        @mousedown="startDragOverview"
        @mouseup="scrollFromOverview"
        :style="{
          transform: `translateX(${overviewFocusOffset}px) scaleX(${1 / (this.currentZoomLevelIndex + 1) * 5})`
        }"
        class="overview-focus" />
      <div
        @mouseup="scrollFromOverview"
        v-if="overviewSvg !== null && overviewSvg !== undefined"
        v-html="overviewSvg"
        ref="overview"
        class="overview-waveform" />
    </div>
    <v-layout>
      <v-flex xs2>
        <div class="pl-3 caption grey--text lighten-2">
          <v-slider
            color="grey"
            thumb-color="grey darken-2"
            hide-details
            :min="1"
            :max="20"
            thumb-label
            v-model="scaleFactorY" />
          Scale Waveform
        </div>
      </v-flex>
      <v-spacer />
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
import { setInterval, setImmediate, setTimeout } from 'timers';
import * as fileSaver from 'file-saver'
require('kaitai-struct/KaitaiStream')
const ogg = require('../service/ogg')
const concatBuffer = require('array-buffer-concat')

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

interface OggIndex {
  pages: Array<{ byteOffset: number, granulePosition: number, timestamp: number }>
  headers: Array<{ byteOffset: number }>
}

function readU4le(dataView: DataView, i: number) {
  const v = dataView.getUint32(i, true)
  return v
};

function readU8le(dataView: DataView, i: number) {
  const v1 = readU4le(dataView, i)
  const v2 = readU4le(dataView, i + 4)
  return 0x100000000 * v2 + v1
};

function getOggIndex(buffer: ArrayBuffer): OggIndex {

  const pages: OggIndex['pages'] = []
  const headers: OggIndex['headers'] = []

  const uint8Array = new Uint8Array(buffer)
  const dataView = new DataView(buffer)
  const sampleRate = (() => {
    // that’s where the 32 bit integer sits
    const chunk = buffer.slice(40, 48)
    const view = new Uint32Array(chunk)
    return view[0]
  })()
  uint8Array.forEach((v, i, l) => {
    if (l[i]     === 79 &&
        l[1 + 1] === 103 &&
        l[i + 2] === 103 &&
        l[i + 3] === 83 ) {
      const byteOffset = i
      const granulePosition = readU8le(dataView, i + 6)
      const timestamp = granulePosition / sampleRate
      if (granulePosition === 0) {
        headers.push({ byteOffset })
      } else {
        pages.push({ byteOffset, granulePosition, timestamp })
      }
    }
  })
  return { headers, pages }
}

async function callWhenReady<T>(cb: () => T)  {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const res = await cb()
        resolve(res)
      } catch (e) {
        reject(e)
      }
    }, 2)
  }) as Promise<T>
}

const ctxClass: any = window.AudioContext

@Component
export default class Waveform extends Vue {

  @Prop() audioElement: HTMLAudioElement|null
  @Prop() audioUrl: string
  @Prop() scrollToSegment: Segment|null

  onScroll = _.throttle((e) => this.handleScroll(e), 250)
  disabled = false
  svg: SVGElement|null|undefined = null
  oggBuffer: ArrayBuffer|null   = null
  audioBuffer: AudioBuffer|null = null
  drawWidth = 5000 // pixels
  preRenderSize = 5 * 1024 * 1024 // bytes
  overviewFocusOffset = 0
  isDraggingOverview = false
  scaleFactorY = 1
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
  overviewSvg = localStorage.getItem('overview-svg') || null
  oggPages: OggIndex['pages'] = []
  oggHeaders: OggIndex['headers'] = []
  context: AudioContext = new ctxClass()

  handleScroll(e: Event) {
    this.$emit('scroll', e)
    if (this.currentlyVisibleWaveFormPiece !== this.visibleWaveFormPiece()) {
      this.currentlyVisibleWaveFormPiece = this.visibleWaveFormPiece()
      console.log({ now_drawing: this.visibleWaveFormPiece() })
      // callWhenReady(() => this.drawWaveFormPiece())
      this.drawWaveFormPiece()
    }
    const w = this.$refs.svgContainer
    const o = this.$refs.overview
    if (w instanceof HTMLElement && o instanceof HTMLElement) {
      // tslint:disable-next-line:max-line-length
      this.overviewFocusOffset = w.scrollLeft / w.scrollWidth * o.clientWidth
    }
  }

  mounted() {
    this.$nextTick(() => this.initWithAudio())
  }

  startDragOverview(e: MouseEvent) {
    document.addEventListener('mousemove', this.onDragOverview)
  }
  onDragOverview(e: MouseEvent) {
    this.overviewFocusOffset = e.pageX - this.currentZoomLevelIndex * 10 / 2
  }
  scrollFromOverview(e: MouseEvent) {
    document.removeEventListener('mousemove', this.onDragOverview)
    const o = this.$refs.overview
    if (o instanceof HTMLElement) {
      const x = (e.pageX - 25) / o.clientWidth
      this.doScrollToPercentage(x)
    }
  }

  doScrollToPercentage(percentage: number) {
    const el = this.$refs.svgContainer
    if (el instanceof HTMLDivElement) {
      el.scrollTo({
        left: el.scrollWidth * percentage
      })
    }
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
  async initWithAudio() {
    if (this.audioElement !== null) {
      this.loading = true
      console.time('fetch')
      this.oggBuffer = await (await fetch(this.audioElement.src)).arrayBuffer()
      console.timeEnd('fetch')
      // Decode first batch
      this.audioLength = this.audioElement.duration
      const oggIndex = getOggIndex(this.oggBuffer)
      this.oggPages = oggIndex.pages
      this.oggHeaders = oggIndex.headers
      console.log(this.oggPages)
      console.time('decode prerender size (5mb)')
      const audioBuffer = await callWhenReady(() => this.context.decodeAudioData(
        // concatBuffer(x.slice(data.pages[0].pos, data.pages[1].pos - 1), x.slice(y1, y2))
        concatBuffer(
          // Headers
          (this.oggBuffer as ArrayBuffer).slice(this.oggHeaders[0].byteOffset, this.oggPages[0].byteOffset),
          // Actual Pages
          (this.oggBuffer as ArrayBuffer).slice(this.oggPages[0].byteOffset, this.oggPages[1000].byteOffset))
        // x.slice(0, this.preRenderSize > x.byteLength ? x.byteLength : this.preRenderSize)
      ))
      console.timeEnd('decode prerender size (5mb)')
      this.audioBuffer = audioBuffer
      console.log(this.audioBuffer.sampleRate)
      this.loading = false
      await callWhenReady(() => this.drawWaveFormPiece())

      console.time('2 decodings')
      const buffers = await Promise.all([
        this.decodeBufferSegment(500, 620),
        this.decodeBufferSegment(620, 620 + 120)
      ])
      console.timeEnd('2 decodings')
      // Decode the rest
      // console.time('decode all')
      // this.audioBuffer = await callWhenReady(() => context.decodeAudioData(this.oggBuffer as ArrayBuffer))
      // this.disabled = true
      // await callWhenReady(() => this.drawWaveFormPiece())
      // if (this.overviewSvg === null) {
      //   await callWhenReady(() => this.drawOverviewWaveform())
      // }
      // this.disabled = false
      // console.timeEnd('decode all')
    }
  }

  findPages(from: number, to: number) {
    console.time('find pages')
    const pages = this.oggPages
    const countPages = pages.length
    let i = 0
    let startPage: any = null
    let endPage: any = null
    // some timestamps are just to f*ing big.
    const errorTimestampTooBig = Math.pow(10, 6)
    while (i <= countPages) {
      if (startPage === null && pages[i].timestamp >= from && pages[i].timestamp < errorTimestampTooBig) {
        console.log({ i1: i })
        startPage = pages[i]
      }
      if (endPage === null && pages[i].timestamp >= to && pages[i].timestamp < errorTimestampTooBig) {
        console.log({ i2: i })
        endPage = pages[i]
        break
      }
      i++
    }
    console.log({startPage, endPage})
    console.timeEnd('find pages')
    return {startPage, endPage}
  }

  // in seconds
  async decodeBufferSegment(from: number, to: number) {
    if (this.oggBuffer !== null) {
      const { startPage, endPage } = this.findPages(from, to)
      const headerBuffer   = this.oggBuffer.slice(this.oggHeaders[0].byteOffset, this.oggPages[0].byteOffset)
      const contentBuffer  = this.oggBuffer.slice(startPage.byteOffset, endPage.byteOffset)
      const combinedBuffer = concatBuffer(headerBuffer, contentBuffer)
      const decodedBuffer  = await this.context.decodeAudioData(combinedBuffer)
      return decodedBuffer
    }
  }

  playBuffer(buffer: AudioBuffer, start = 0, offset?: number, duration?: number) {
    const src = this.context.createBufferSource()
    src.buffer = buffer
    src.connect(this.context.destination)
    src.start(0, offset, duration)
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

  async drawOverviewWaveform() {
    const width = this.$el.clientWidth
    console.time('render overview')
    const svg = await callWhenReady(() => drawBuffer.svg(this.audioBuffer, width, 45, '#ccc')) as SVGElement
    this.overviewSvg = svg.outerHTML
    if (this.overviewSvg !== null) {
      localStorage.setItem('overview-svg', this.overviewSvg)
    }
    console.timeEnd('render overview')
  }

  async drawWaveFormPiece() {
    if (this.audioBuffer !== null) {
      const i = this.visibleWaveFormPiece()
      console.log({number_of_segments: this.amountDrawSegments})
      console.log({audio_length: this.audioLength})
      const isLast = i + 1 === this.amountDrawSegments
      const secondsPerDrawWidth = this.zoomLevels[this.currentZoomLevelIndex]
      const from = i * secondsPerDrawWidth * 1000
      const to = isLast ? this.audioLength * 1000 : from + secondsPerDrawWidth * 1000
      console.time('slicing')
      const slicedBuffer = await sliceBuffer(this.audioBuffer, from, to)
      console.timeEnd('slicing')
      console.time('drawBuffer')
      this.svg = await callWhenReady(() => drawBuffer.svg(
        slicedBuffer,
        isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth,
        200,
        '#ccc'
      ))
      console.timeEnd('drawBuffer')
      if (this.$refs.svgContainer instanceof HTMLElement) {
        console.time('render')
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        el.innerHTML = '';
        el.appendChild((this.svg as Node))
        el.classList.add('show')
        console.timeEnd('render')
        await callWhenReady(() => {
          this.$emit('change-metadata', {
            totalWidth: this.totalWidth,
            amountDrawSegments: this.amountDrawSegments,
            currentZoomLevel: this.zoomLevels[this.currentZoomLevelIndex],
            audioLength: this.audioLength,
            drawWidth: this.drawWidth
          })
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
<style lang="stylus">
.overview-waveform
  svg
    margin 0 auto
</style>
<style lang="stylus" scoped>
.disabled
  cursor progress
  pointer-events none
  opacity .5
.wave-form-segment
  position absolute
  .wave-form-placeholder
    position absolute
    top 100px
    border-top 1px dashed #ddd
    width 100%
.wave-form
  position relative
  height 200px
  max-width 100vw
  overflow-x scroll
  .wave-form-inner
    height 200px
    position relative
    .wave-form-segment
      transition .5s
      opacity 0
      &.show
        transform scaleY(1.2)
        opacity 1
.overview
  height 45px
  position relative
.overview-waveform
  background #f4f4f4
  svg
    margin 0 auto
.overview-focus
  background rgba(0,0,0,.1)
  height 100%
  width 50px
  position absolute
  &:focus
    outline 0
    background rgba(0,0,100,.1)

</style>
