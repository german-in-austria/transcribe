<template>
  <div :class="{ disabled, loading }">
    <v-layout style="position: relative;">
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
      <div class="range-input-container scale-x">
        <span class="caption grey--text lighten-2">
          Zoom {{ scaleFactorX }}x
        </span>
        <input
          type="range"
          min=".1"
          max="4"
          step=".1"
          @mousedown="startScaleX"
          v-model="scaleFactorX"> 
      </div>
    </v-layout>
    <div
      class="wave-form"
      :style="{height: `${height}px`}"
      ref="svgContainer"
      @scroll="onScroll">
      <div class="second-marker-row">
        <div
          v-for="i in visibleSeconds"
          v-if="pixelsPerSecond > 60 || i % 2 === 0"
          :key="i"
          :style="{
            transform: `translateX(${ i * pixelsPerSecond }px)`
          }"
          class="second-marker">
            {{ toTime(i) }}
        </div>
      </div>
      <div
        :style="stageStyle"
        class="wave-form-inner">
        <div
          v-for="(x, i) in Array(amountDrawSegments)"
          :style="{
            transform: `scaleY(${scaleFactorY})`,
            left: drawWidth * i + 'px',
            width: i + 1 < amountDrawSegments ? drawWidth + 'px' : 'auto',
            height: height + 'px'
          }"
          :key="i"
          @dblclick.stop="addSegmentAt"
          :class="['wave-form-segment', 'draw-segment-'+i]">
          <div class="wave-form-placeholder" />
        </div>
        <slot />
      </div>
    </div>
    <div class="overview" :style="{height: overviewHeight + 'px'}">
      <div
        @mousedown="startDragOverview"
        v-if="overviewSvg !== null && overviewSvg !== undefined"
        v-html="overviewSvg"
        :style="{
          transform: `scaleY(${scaleFactorY + 2})`
        }"
        ref="overview"
        class="overview-waveform" />
      <div
        class="overview-thumb"
        ref="overviewThumb"
        tabindex="-1"
        @mousedown="startDragOverview"
        @mouseup="scrollFromOverview"
        :style="{
          transform: `translateX(${ overviewThumbOffset }px)`,
          width: `${ overviewThumbWidth }px`,
          transition: transitionOverviewThumb ? '.25s' : 'unset'
        }">
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as drawBuffer from 'draw-wave'
import * as _ from 'lodash'
import audio, { OggIndex } from '../service/audio'
import util from '../service/util'
import * as Queue from 'simple-promise-queue'
import audioState from 'state/audio';

const queue = new Queue({
  concurrency: 1,
  autoStart: true
})

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
  @Prop({ default: 200 }) height: number
  // config
  drawDistance = 5000 // pixels in both directions from the center of the viewport (left and right)
  initialPixelsPerSecond = 150

  // state
  pixelsPerSecond = this.initialPixelsPerSecond
  disabled = false
  loading = false
  overviewThumbOffset = 0
  scaleFactorY = 1
  scaleFactorX = 1
  isScalingX = false
  startScaleXFactor = 1
  transitionOverviewThumb = true
  overviewThumbWidth = 0
  overviewHeight = 60
  visibleSeconds: number[] = []
  // this is only used DURING scaling, then reset to 1
  intermediateScaleFactorX: number|null = null
  audioLength = 0
  overviewSvg = localStorage.getItem('overview-svg') || null
  renderedWaveFormPieces: number[] = []
  totalWidth = this.audioLength * this.pixelsPerSecond

  onScroll = _.throttle((e) => this.handleScroll(e), 350)

  // get drawDistance(): number {
  //   return Math.max(5000 * this.scaleFactorX, this.$el.clientWidth)
  // }

  addSegmentAt(e: MouseEvent) {
    const c = this.$refs.svgContainer as HTMLDivElement
    console.log(
      c.scrollWidth,
      c.scrollLeft,
      e.pageX
    )
    this.$emit('add-segment', (c.scrollLeft + e.pageX) / this.pixelsPerSecond)
    console.log(e)
  }

  get drawWidth(): number {
    return 5000 * this.scaleFactorX
  }

  handleScroll(e: Event) {
    this.$emit('scroll', e)
    this.updateSecondsMarkers()
    this.doMaybeRerender()
    this.updateOverviewThumb()
  }

  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }

  updateSecondsMarkers() {
    const [left, right] = this.getRenderBoundaries()
    const [startSecond, endSecond] = [Math.floor(left / this.pixelsPerSecond), Math.floor(right / this.pixelsPerSecond)]
    this.visibleSeconds = util.range(Math.max(startSecond, 0), Math.min(endSecond, this.audioLength))
  }

  updateOverviewThumb() {
    const w = this.$refs.svgContainer
    const o = this.$refs.overview
    if (w instanceof HTMLElement && o instanceof HTMLElement) {
      this.overviewThumbWidth = Math.max(w.clientWidth / w.scrollWidth * o.clientWidth, 5)
      this.overviewThumbOffset = (
        (w.scrollLeft + w.clientWidth) / w.scrollWidth * (o.clientWidth - this.overviewThumbWidth)
      )
      localStorage.setItem('scrollPos', String(w.scrollLeft))
    }
  }

  doMaybeRerender() {
    requestAnimationFrame(async () => {
      const piecesToRender = util.findAllNotIn(this.renderedWaveFormPieces, this.shouldRenderWaveFormPieces())
      if (piecesToRender.length > 0) {
        console.log('now rendering:', piecesToRender)
        piecesToRender.forEach((p) => {
          queue.unshiftTask((resolve: any, reject: any) => {
            this.renderedWaveFormPieces.push(p)
            this.drawWaveFormPiece(p)
              .then(() => resolve())
              .catch(() => reject())
          })
        })
      }
    })
  }

  clearRenderCache() {
    this.renderedWaveFormPieces = []
  }

  startScaleX(e: MouseEvent) {
    this.isScalingX = true
    this.startScaleXFactor = this.scaleFactorX
    document.addEventListener('mouseup', this.endScaleX)
  }
  @Watch('scaleFactorX')
  onChangeScaleFactorX(current: number) {
    this.intermediateScaleFactorX = current / this.startScaleXFactor
    this.endScaleX()
  }
  @Watch('height')
  onChangeHeight() {
    this.clearRenderCache()
  }
  endScaleX() {
    this.isScalingX = false
    document.removeEventListener('mouseup', this.endScaleX)
    const el = (this.$refs.svgContainer as HTMLElement)
    // console.log(el.scrollWidth, el.scrollLeft, el.clientWidth)
    const oldCenterPercent =  (el.scrollLeft + el.clientWidth / 2) / this.totalWidth
    // console.log({oldCenterPercent})
    requestAnimationFrame(() => {
      this.pixelsPerSecond = this.initialPixelsPerSecond * this.scaleFactorX
      // clear cache
      this.clearRenderCache()
      this.doMaybeRerender()
      this.doScrollToPercentage(oldCenterPercent)
      this.totalWidth = this.audioLength * this.pixelsPerSecond
      this.intermediateScaleFactorX = null
      this.$emit('change-metadata', {
        totalWidth: this.totalWidth,
        amountDrawSegments: this.amountDrawSegments,
        pixelsPerSecond: this.pixelsPerSecond,
        audioLength: this.audioLength,
        drawWidth: this.drawWidth
      })
    })
  }

  get stageStyle() {
    const c = this.$refs.svgContainer
    return {
      height: this.height + 'px',
      width: this.totalWidth + 'px',
      transformOrigin: c instanceof HTMLElement ? `${c.scrollLeft + c.clientWidth / 2}px` : 0,
      transform: `scaleX(${this.isScalingX ? this.intermediateScaleFactorX : 1})`,
      transition: '.5s'
    }
  }

  mounted() {
    this.$nextTick(() => this.initWithAudio())
  }

  startDragOverview(e: MouseEvent) {
    this.transitionOverviewThumb = false
    document.addEventListener('mousemove', this.onDragOverview)
    document.addEventListener('mouseup', this.scrollFromOverview)
  }
  onDragOverview(e: MouseEvent) {
    this.overviewThumbOffset = e.pageX - this.overviewThumbWidth / 2
  }
  scrollFromOverview(e: MouseEvent) {
    this.transitionOverviewThumb = true
    document.removeEventListener('mousemove', this.onDragOverview)
    document.removeEventListener('mouseup', this.scrollFromOverview)
    // this.overviewThumbOffset = e.pageX
    const o = this.$refs.overview
    if (o instanceof HTMLElement) {
      const scrollToPercentage = (e.pageX - this.overviewThumbWidth / 2) / o.clientWidth
      this.doScrollToPercentage(scrollToPercentage)
    }
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
      const x = await fetch(this.audioElement.src)
      .then(res => {
        // TODO: STREAM / FACTOR OUT
        let preBuffer = new Uint8Array(0)
        if (res.body instanceof ReadableStream) {
          const reader = res.body.getReader()
          reader.read().then(async function process(chunk: {value: Uint8Array, done: boolean}): Promise<any> {
            if (chunk.value.buffer instanceof ArrayBuffer) {
              if (preBuffer.byteLength < 1024 * 1024) {
                preBuffer = util.concatUint8Array(preBuffer, chunk.value)
              } else {
                audio.store.uint8Buffer = util.concatUint8Array(audio.store.uint8Buffer, preBuffer)
                console.log('audio.store.uint8Buffer.l', audio.store.uint8Buffer.buffer.byteLength)
                const {headers, pages} = audio.getOggIndex(preBuffer.buffer)
                // reset buffer
                preBuffer = new Uint8Array(0)
                if (pages.length > 0) {
                  const firstPage = pages[0]
                  const lastPage = pages[pages.length - 1]
                  if (firstPage && lastPage && audio.store.uint8Buffer.byteLength > 0) {
                    audio.decodeBufferSegment(
                      firstPage.byteOffset,
                      lastPage.byteOffset,
                      audio.store.uint8Buffer.buffer
                    )
                    .then(a => {
                      const svg = audio.drawWave(a, 200, 50)
                      console.log(svg)
                    })
                  }
                }
              }
              // if (headers.length) {
              //   audio.store.oggHeaders = headers
              // }
            }
            return reader.read().then(process)
          })
        }
        return res
      })

      // console.log(await x.text())
      audio.store.oggBuffer = await x.arrayBuffer()
      console.timeEnd('fetch')
      // Decode first batch
      this.audioLength = this.audioElement.duration
      this.totalWidth = this.audioLength * this.pixelsPerSecond
      console.log({ audioLength:  this.audioLength })
      const oggIndex = audio.getOggIndex(audio.store.oggBuffer)
      audio.store.oggPages = oggIndex.pages
      audio.store.oggHeaders = oggIndex.headers
      await callWhenReady(() => this.drawWaveFormPiece(0))
      this.loading = false
      const scrollLeft = localStorage.getItem('scrollPos')
      const el = this.$refs.svgContainer
      if (this.overviewSvg === null) {
        this.drawOverviewWaveform()
      }
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
    return Math.ceil(this.audioLength * this.pixelsPerSecond / this.drawWidth)
  }

  getRenderBoundaries(): number[] {
    const el = this.$refs.svgContainer
    if (el instanceof HTMLElement) {
      return [
        Math.floor((el.scrollLeft + el.clientWidth / 2 - this.drawDistance / 2)),
        Math.floor((el.scrollLeft + el.clientWidth / 2 + this.drawDistance / 2))
      ]
    } else {
      return [0, 0]
    }
  }

  shouldRenderWaveFormPieces(): number[] {
    const [ left, right ] = this.getRenderBoundaries()
    const [ startPiece, endPiece ] = [ Math.floor(left / this.drawWidth), Math.floor(right / this.drawWidth) ]
    return util.range(startPiece, endPiece)
  }

  async drawOverviewWaveform() {
    const width = 2000
    const pageSampleSize = 15000
    const pages = audio.store.oggPages
    const length = audio.store.oggPages.length
    const sampleRate = length / pageSampleSize
    let buffers = []
    if (audio.store.oggBuffer !== null) {
      console.time('sample overview ' + pageSampleSize)
      for (let i = 0; i < pageSampleSize; ++i) {
        const samplePageIndex = Math.floor(i * sampleRate)
        buffers.push(audio.store.oggBuffer.slice(
          pages[samplePageIndex].byteOffset,
          pages[samplePageIndex + 1].byteOffset
        ))
      }
      console.timeEnd('sample overview ' + pageSampleSize)
      // tslint:disable-next-line:max-line-length
      const headerBuffer = audio.store.oggBuffer.slice(audio.store.oggHeaders[0].byteOffset, audio.store.oggPages[0].byteOffset)
      const buffer = audio.concatBuffer(headerBuffer, ...buffers)
      buffers = []
      console.time('decode overview')
      const audioBuffer = await audio.store.audioContext.decodeAudioData(buffer)
      console.timeEnd('decode overview')
      this.overviewSvg = audio.drawWave(audioBuffer, width, this.overviewHeight, '#111')
      localStorage.setItem('overview-svg', this.overviewSvg)
    }
  }

  async drawWaveFormPiece(i: number) {
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    if (audio.store.uint8Buffer.byteLength > 0) {
      const slicedBuffer = await audio.decodeBufferTimeSlice(from, to, audio.store.oggBuffer)
      console.log({ from, to, duration: to - from })
      console.log(slicedBuffer.duration)
      const svg = audio.drawWave(
        slicedBuffer,
        isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth,
        this.height,
        '#fb7676',
        0
      )
      const svg2 = audio.drawWave(
        slicedBuffer,
        isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth,
        this.height,
        '#69c',
        1
      )
      if (this.$refs.svgContainer instanceof HTMLElement) {
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        console.time('render')
      // requestAnimationFrame(async () => {
        el.innerHTML = svg + svg2
        console.timeEnd('render')
        el.classList.add('show')
        requestAnimationFrame(() => {
          this.$emit('change-metadata', {
            totalWidth: this.totalWidth,
            amountDrawSegments: this.amountDrawSegments,
            // currentZoomLevel: this.zoomLevels[this.currentZoomLevelIndex],
            pixelsPerSecond: this.pixelsPerSecond,
            audioLength: this.audioLength,
            drawWidth: this.drawWidth
          })
        })
      // })
      }
    }
  }
}
</script>

<style lang="stylus">
.overview-waveform
  z-index -1
  svg
    width 100%
    opacity .5
    pointer-events none

.wave-form-inner
  svg
    mix-blend-mode overlay
    position absolute
    top 0
</style>
<style lang="stylus" scoped>
.disabled
.loading
  cursor progress
  opacity .5
.wave-form-segment
  transform-origin center
  position absolute
  overflow hidden
  .wave-form-placeholder
    position absolute
    top 100px
    border-top 1px dashed #ddd
    width 100%
.wave-form
  margin-top 0px
  position relative
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
    overflow-y hidden
    position relative
    .wave-form-segment
      opacity 0
      &.show
        opacity 1

.overview
  overflow-y hidden
  top -15px
  position relative
  border-top 1px solid rgba(0,0,0,.1) 

.overview-thumb
  top 0
  background rgba(255,255,255,.2)
  height 100%
  width 50px
  position absolute
  transition .25s transform
  &:focus
    outline 0

.second-marker
  min-width: 1px;
  height: 10px;
  top: 32.5px;
  position: absolute;
  border-left: 1px solid #6f6f6f;
  user-select none
  font-size: 10px;
  line-height: 12px;
  padding-left: 7px;
  color: #6f6f6f;

.scale-y
  position absolute
  right 20px
  z-index 9
  bottom -20px
  input[type=range]
    width 80px
    position relative
    top -2px
  span
    display inline-block
    margin 9px

.scale-x
  position absolute
  right 20px
  z-index 9
  bottom -20px
  input[type=range]
    width 80px
    position relative
    top -2px
  span
    display inline-block
    margin 9px

input[type=range]
  -webkit-appearance none
  appearance none
  margin 18px 0
  &:focus
    outline none
  &::-webkit-slider-runnable-track 
    width 100%
    height 3px
    animate 0.2s
    background rgba(0,0,0,.5)
  &::-webkit-slider-thumb
    -webkit-appearance none
    height 11px
    width 11px
    border-radius 5.5px
    border 2px solid #555
    background-color #555
    margin-top: -4.5px
</style>
