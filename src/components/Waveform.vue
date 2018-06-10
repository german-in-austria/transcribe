<template>
  <div :class="{ disabled, loading }">
    <v-layout>
      <v-flex xs1 text-xs-center>
        <div class="pl-2 pr-2 caption grey--text lighten-2">
          <v-slider
            class="scale-slider"
            color="grey"
            thumb-color="grey darken-2"
            hide-details
            :step=".1"
            :min=".1"
            :max="4"
            thumb-label
            v-model="scaleFactorY" />
          Scale
        </div>
      </v-flex>
      <v-flex class="text-xs-center" xs10>
        <slot name="headline" />
      </v-flex>
      <v-flex xs1 text-xs-center>
        <div class="pr-2 pl-2 caption grey--text lighten-2">
          <v-slider
            class="scale-slider"
            @mousedown="startScaleX"
            @mouseup="endScaleX"
            color="grey"
            thumb-color="grey darken-2"
            hide-details
            :step=".1"
            :min="0.1"
            :max="4"
            thumb-label
            v-model="scaleFactorX" />
          Zoom
        </div>
        <!-- <v-btn-toggle>
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
        </v-btn-toggle> -->
      </v-flex>
    </v-layout>
    <div
      class="wave-form"
      ref="svgContainer"
      @scroll="onScroll">
      <div
        :style="stageStyle"
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
        class="overview-focus"
        tabindex="-1"
        @mousedown="startDragOverview"
        @mouseup="scrollFromOverview"
        :style="{
          transform: `translateX(${overviewFocusOffset}px) scaleX(${1 / scaleFactorX})`,
        }">
      </div>
      <div
        @mouseup="scrollFromOverview"
        v-if="overviewSvg !== null && overviewSvg !== undefined"
        v-html="overviewSvg"
        ref="overview"
        class="overview-waveform" />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as drawBuffer from 'draw-wave'
import * as _ from 'lodash'
import audio, { OggIndex } from '../service/audio'

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

@Component
export default class Waveform extends Vue {

  @Prop() audioElement: HTMLAudioElement|null
  @Prop() audioUrl: string
  @Prop() scrollToSegment: Segment|null

  onScroll = _.throttle((e) => this.handleScroll(e), 250)
  disabled = false
  drawWidth = 5000 // pixels
  overviewFocusOffset = 0
  scaleFactorY = 1
  scaleFactorX = 1
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

  handleScroll(e: Event) {
    this.$emit('scroll', e)
    if (this.currentlyVisibleWaveFormPiece !== this.visibleWaveFormPiece()) {
      this.currentlyVisibleWaveFormPiece = this.visibleWaveFormPiece()
      this.drawWaveFormPiece(this.currentlyVisibleWaveFormPiece)
      // TODO: this is very crude. it makes it take twice the time.
      if (this.currentlyVisibleWaveFormPiece - 1 >= 0) {
        this.drawWaveFormPiece(this.currentlyVisibleWaveFormPiece - 1)
      }
    }
    const w = this.$refs.svgContainer
    const o = this.$refs.overview
    if (w instanceof HTMLElement && o instanceof HTMLElement) {
      // tslint:disable-next-line:max-line-length
      this.overviewFocusOffset = w.scrollLeft / w.scrollWidth * o.clientWidth
      localStorage.setItem('scrollPos', String(w.scrollLeft))
    }
  }

  startScaleX(e: MouseEvent) {
    console.log(e)
  }

  endScaleX(e: MouseEvent) {
    console.log(e)
  }

  // @Watch('scaleFactorX')
  // onScaleFactorXChange() {
  //   const c = this.$refs.svgContainer
  //   if (c instanceof HTMLElement) {
  //     c.scrollLeft
  //   }
  // }

  get stageStyle() {
    const c = this.$refs.svgContainer
    return {
      width: this.totalWidth + 'px',
      transformOrigin: c instanceof HTMLElement ? `${c.scrollLeft + c.clientWidth / 2}px` : 0,
      transform: `scaleX(${this.scaleFactorX})`
    }
  }

  mounted() {
    this.$nextTick(() => this.initWithAudio())
  }

  startDragOverview(e: MouseEvent) {
    document.addEventListener('mousemove', this.onDragOverview)
    document.addEventListener('mouseup', this.scrollFromOverview)
  }
  onDragOverview(e: MouseEvent) {
    this.overviewFocusOffset = e.pageX - this.currentZoomLevelIndex * 10 / 2
  }
  scrollFromOverview(e: MouseEvent) {
    document.removeEventListener('mousemove', this.onDragOverview)
    document.removeEventListener('mouseup', this.scrollFromOverview)
    this.overviewFocusOffset = e.pageX - this.currentZoomLevelIndex * 10 / 2
    // callWhenReady(() => {
    const o = this.$refs.overview
    if (o instanceof HTMLElement) {
      const x = (e.pageX - 25) / o.clientWidth
      this.doScrollToPercentage(x)
    }
    // })
  }

  doScrollToPercentage(percentage: number) {
    const el = this.$refs.svgContainer
    if (el instanceof HTMLDivElement) {
      requestAnimationFrame(() => {
        el.scrollTo({
          left: el.scrollWidth * percentage
        })
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
      audio.store.oggBuffer = await (await fetch(this.audioElement.src)).arrayBuffer()
      console.timeEnd('fetch')
      // Decode first batch
      this.audioLength = this.audioElement.duration
      const oggIndex = audio.getOggIndex(audio.store.oggBuffer)
      audio.store.oggPages = oggIndex.pages
      audio.store.oggHeaders = oggIndex.headers
      await callWhenReady(() => this.drawWaveFormPiece(0))
      this.loading = false
      const scrollLeft = localStorage.getItem('scrollPos')
      const el = this.$refs.svgContainer
      if (scrollLeft !== null && el instanceof HTMLElement) {
        el.scrollTo({
          left : Number(scrollLeft)
        })
      }
    }
  }

  playBuffer(buffer: AudioBuffer, start = 0, offset?: number, duration?: number) {
    const src = audio.store.audioContext.createBufferSource()
    src.buffer = buffer
    src.connect(audio.store.audioContext.destination)
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
    // const width = this.$el.clientWidth
    // console.time('render overview')
    // const svg = await callWhenReady(() => drawBuffer.svg(this.audioBuffer, width, 45, '#ccc')) as SVGElement
    // this.overviewSvg = svg.outerHTML
    // if (this.overviewSvg !== null) {
    //   localStorage.setItem('overview-svg', this.overviewSvg)
    // }
    // console.timeEnd('render overview')
  }

  async drawWaveFormPiece(i: number) {
    console.log({ now_drawing: i })
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.zoomLevels[this.currentZoomLevelIndex]
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const slicedBuffer = await audio.decodeBufferSegment(from, to)
    if (slicedBuffer !== undefined) {
      const svg = audio.drawWave(
        slicedBuffer,
        isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth,
        200
      )
      if (this.$refs.svgContainer instanceof HTMLElement) {
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        console.time('render')
      // requestAnimationFrame(async () => {
        el.innerHTML = svg
        console.timeEnd('render')
        el.classList.add('show')
        await callWhenReady(() => {
          this.$emit('change-metadata', {
            totalWidth: this.totalWidth,
            amountDrawSegments: this.amountDrawSegments,
            currentZoomLevel: this.zoomLevels[this.currentZoomLevelIndex],
            audioLength: this.audioLength,
            drawWidth: this.drawWidth
          })
        })
      // })
      }
    }
  }

  @Watch('currentZoomLevelIndex')
  onZoom() {
    this.drawWaveFormPiece(this.currentlyVisibleWaveFormPiece)
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
    opacity .5
    pointer-events none
</style>
<style lang="stylus" scoped>
.disabled
.loading
  cursor progress
  // pointer-events none
  opacity .5
.wave-form-segment
  position absolute
  .wave-form-placeholder
    position absolute
    top 100px
    border-top 1px dashed #ddd
    width 100%
.wave-form
  margin-top -20px
  position relative
  height 200px
  max-width 100vw
  overflow-x scroll
  overflow-y hidden
  &::-webkit-scrollbar
  &::-webkit-scrollbar-button
  &::-webkit-scrollbar-track
  &::-webkit-scrollbar-track-piece
  &::-webkit-scrollbar-thumb
  &::-webkit-scrollbar-corner
  &::-webkit-resizer
    opacity 0
  .wave-form-inner
    transition .5s transform
    height 200px
    position relative
    .wave-form-segment
      transition .5s
      opacity 0
      &.show
        transform scaleY(1.2)
        opacity 1
.overview
  top -15px
  height 45px
  position relative
.overview-waveform
  background rgba(0,0,0,.1)

.overview-focus
  background rgba(0,0,0,.4)
  height 100%
  width 50px
  position absolute
  &:focus
    outline 0
    background rgba(255,255,255,.2)

.scale-slider
  padding-right 5px
</style>
