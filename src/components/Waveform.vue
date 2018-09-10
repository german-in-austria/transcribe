<template>
  <div :class="{ disabled, loading }">
    <v-layout style="position: relative;">
      <v-flex class="pl-2" xs2 text-xs-center>
        <label for="scaleFactorY" class="caption grey--text lighten-2">
          Scale
        </label>
        <select name="scaleFactorY" class="ml-2 no-outline" style="font-size: 90%" v-model="scaleFactorY">
          <option
            v-for="(v, i) in [.1, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]"
            :value="v"
            :key="i">
            {{ v }}x
          </option>
        </select>
      </v-flex>
      <v-flex class="text-xs-center" xs10>
        <slot name="headline" />
      </v-flex>
      <v-flex class="pr-2" xs2 text-xs-center>
        <span class="caption grey--text lighten-2">
          Zoom
        </span>
        <select class="ml-2 no-outline" style="font-size: 90%" v-model="scaleFactorX">
          <option
            v-for="(v, i) in [.1, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]"
            :value="v"
            :key="i">
            {{ v }}x
          </option>
        </select>
      </v-flex>
    </v-layout>
    <div
      class="wave-form"
      :style="{height: `${height}px`, width: `${totalWidth}px`}"
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
        v-if="overviewSvgs.length > 0"
        ref="overview"
        class="overview-waveform">
        <svg
          preserveAspectRatio="none"
          :viewBox="`0 0 ${ overviewSvgWidth } 60`"
          :width="overviewSvgWidth"
          style="width: 100%"
          height="60">
          <path
            v-for="(svg, i) in overviewSvgs"
            :key="i"
            :fill="svg.channel == 0 ? '#FB7676' : '#69C'"
            :d="svg.path"
          />
        </svg>
      </div>
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
  overviewSvgWidth = 500
  // state
  pixelsPerSecond = this.initialPixelsPerSecond
  disabled = false
  loading = false
  overviewThumbOffset = 0
  scaleFactorY = 1
  scaleFactorX = 1
  transitionOverviewThumb = true
  overviewThumbWidth = 0
  overviewHeight = 60
  visibleSeconds: number[] = []
  // this is only used DURING scaling, then reset to 1
  intermediateScaleFactorX: number|null = null
  audioLength = 0
  metadata: any = {}

  overviewSvgs: Array<{channel: number, path: string}> = []
  renderedWaveFormPieces: number[] = []
  totalWidth = this.audioLength * this.pixelsPerSecond

  onScroll = _.throttle((e) => this.handleScroll(e), 350)

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
      this.overviewThumbWidth = Math.max(w.clientWidth / w.scrollWidth * o.clientWidth, 10)
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
              .catch(() => {
                // remove from cache index, if it failed
                const i = this.renderedWaveFormPieces.indexOf(p)
                this.renderedWaveFormPieces.splice(i)
                reject()
              })
          })
        })
      }
    })
  }

  clearRenderCache() {
    this.renderedWaveFormPieces = []
  }

  @Watch('scaleFactorX')
  onChangeScaleFactorX(current: number) {
    this.endScaleX()
  }
  @Watch('height')
  onChangeHeight() {
    this.clearRenderCache()
  }
  endScaleX() {
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
      transition: '.5s'
    }
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

  async serverAcceptsRanges(url: string): Promise<boolean> {
    const res = (await fetch(url, {method: 'HEAD', mode: 'cors'}))
    // return res.headers.has('Accept-Ranges')
    return true
  }

  async getAudioMetadata(url: string): Promise<any> {
    const kb = 100
    if ((await this.serverAcceptsRanges(url)) === false) {
      throw new Error('server doesn’t accept ranges')
    } else {
      const chunk              = await fetch(url, {method: 'GET', headers: { Range: `bytes=0-${ kb * 1024 }`}})
      const fileSize            = (await fetch(url, { method: 'HEAD' })).headers.get('Content-Length')
      const bufferFirstSlice   = await chunk.arrayBuffer()
      const sampleRate         = audio.getOggSampleRate(bufferFirstSlice)
      const bitRate            = audio.getOggNominalBitrate(bufferFirstSlice)
      const headerBuffer       = audio.getOggHeaderBuffer(bufferFirstSlice)
      const { headers, pages } = audio.getOggIndex(bufferFirstSlice)
      console.log(bitRate)
      return {
        sampleRate,
        headers,
        pages,
        fileSize: Number(fileSize),
        headerBuffer
      }
    }
  }

  @Watch('audioElement')
  async initWithAudio() {
    if (this.audioElement !== null && !isNaN(this.audioElement.duration)) {
      this.loading = true
      console.log('this.audioElement.duration', this.audioElement.duration)
      this.audioLength = this.audioElement.duration
      this.totalWidth = this.audioLength * this.pixelsPerSecond
      const that = this
      if (audio.store.isLocalFile === true) {
        console.log('local')
      } else {
        console.log('A CHANGE CHANGED!!!')
        this.metadata = await this.getAudioMetadata(this.audioElement.src)
        console.log('this.metadata', this.metadata)
        const x = await fetch(this.audioElement.src)
        .then(res => {
          this.loading = false
          const scrollLeft = localStorage.getItem('scrollPos')
          const el = that.$refs.svgContainer
          if (scrollLeft !== null && el instanceof HTMLElement) {
            el.scrollTo({
              left : Number(scrollLeft)
            })
          }
          // await callWhenReady(() => that.drawWaveFormPiece(0))
          let preBuffer = new Uint8Array(0)
          if (res.body instanceof ReadableStream) {
            const reader = res.body.getReader()
            console.log('total length in bytes', res.headers.get('Content-Length'))
            reader.read().then(async function process(chunk: {value: Uint8Array, done: boolean}): Promise<any> {
              if (chunk.done === false) {
                if (chunk.value && chunk.value.buffer instanceof ArrayBuffer) {
                  preBuffer = util.concatUint8Array(preBuffer, chunk.value)
                  if (preBuffer.byteLength > 2048 * 1024) {
                    audio.store.uint8Buffer = util.concatUint8Array(audio.store.uint8Buffer, preBuffer)
                    const {headers, pages} = audio.getOggIndex(preBuffer.buffer)
                    preBuffer = new Uint8Array(0)
                    // reset buffer
                    console.log(audio.store.uint8Buffer.byteLength, 'bytes loaded')
                    // store headers
                    if (headers.length > 0) {
                      audio.store.oggHeaders = audio.store.oggHeaders.concat(headers)
                    }
                    if (pages.length > 0) {
                      const firstPage = pages[0]
                      const lastPage = pages[pages.length - 1]
                      if (firstPage && lastPage && audio.store.uint8Buffer.byteLength > 0) {
                        const decoded = await audio.decodeBufferSegment(
                          audio.store.uint8Buffer.byteLength - lastPage.byteOffset,
                          audio.store.uint8Buffer.byteLength,
                          audio.store.uint8Buffer.buffer
                        )
                        console.log('DRAWING', firstPage.timestamp, lastPage.timestamp)
                        that.drawOverviewWaveformPiece(firstPage.timestamp, lastPage.timestamp, decoded)
                      }
                    }
                  }
                } else {
                  console.log('received non-buffer', chunk)
                }
                return reader.read().then(process)
              } else {
                if (chunk.done === true) {
                  console.log('DONE.')
                  audio.store.isBufferComplete = true
                  audio.cacheOggIndex(audio.store.uint8Buffer.buffer)
                }
              }
            })
          }
          return res
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

  drawOverviewWaveformPiece(startTime: number, endTime: number, audioBuffer: AudioBuffer) {
    const totalDuration = this.audioLength
    const width = (endTime - startTime) * (this.overviewSvgWidth / totalDuration)
    const left = (startTime) * (this.overviewSvgWidth / totalDuration)
    this.overviewSvgs.push({
      channel: 0,
      path: audio.drawWavePath(audioBuffer, width, this.overviewHeight, 0, left)
    })
    this.overviewSvgs.push({
      channel: 1,
      path: audio.drawWavePath(audioBuffer, width, this.overviewHeight, 1, left)
    })
  }

  async drawWaveFormPiece(i: number) {
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    let slicedBuffer: AudioBuffer
    try {
      slicedBuffer = await audio.decodeBufferTimeSlice(from, to, audio.store.uint8Buffer.buffer)
    } catch (e) {
      console.log(e)
      const startByte = Math.max(this.metadata.fileSize * (from / this.audioLength) - 1024 * 1024, 0).toFixed(0)
      // tslint:disable-next-line:max-line-length
      const endByte = Math.min(this.metadata.fileSize * (to / this.audioLength) + 1024 * 1024, this.metadata.fileSize).toFixed(0)
      console.log({startByte, endByte})
      console.time('buffer segment download')
      const buffer = await (await fetch((this.audioElement as any).src, {
        headers: { Range: `bytes=${startByte}-${endByte}`}
      })).arrayBuffer()
      console.timeEnd('buffer segment download')
      const { pages } = audio.getOggIndex(buffer)
      const trimmedBuffer = buffer.slice(pages[0].byteOffset, pages[pages.length - 1].byteOffset)
      slicedBuffer = await audio.decodeBufferTimeSlice(
        from,
        to,
        audio.concatBuffer(this.metadata.headerBuffer, trimmedBuffer),
        true
      )
    }
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
</script>

<style lang="stylus">
@-webkit-keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@-moz-keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

.overview-waveform
  z-index -1
  white-space nowrap
  svg
    path
      transform translateZ(0)
      opacity 0
      animation fadeIn
      -webkit-animation fadeIn ease-in 1
      animation-fill-mode forwards
      -webkit-animation-duration 1s
      -moz-animation-duration 1s
      animation-duration 1s

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
  opacity .4
  overflow-y hidden
  filter greyscale()
  top -15px
  position relative
  border-top 1px solid rgba(0,0,0,.1)
  transition .25s opacity
  &:hover
    opacity .7

.fade-slow-enter-active, .fade-leave-active 
  transition opacity 3.5s

.fade-slow-enter, .fade-slow-leave-to
  opacity 0

.overview-thumb
  top 0
  z-index -1
  background rgba(0,0,0,.5)
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
