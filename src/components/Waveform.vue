<template>
  <div :class="{ disabled, loading, 'waveform-container': true }">
    <v-layout class="pa-3" style="position: relative;">
      <v-flex xs2 text-xs-left>
        <label for="scaleFactorY" class="caption grey--text lighten-2">
          Gain
        </label>
        <select name="scaleFactorY" class="ml-2 no-outline" style="padding: .1em .1em 0 1em; font-size: 90%" v-model="scaleFactorY">
          <option
            v-for="(v, i) in zoomLevels"
            :value="v"
            :key="i">
            {{ v }}x
          </option>
        </select>
      </v-flex>
      <v-flex class="text-xs-center" xs10>
        <slot name="headline" />
      </v-flex>
      <v-flex xs2 text-xs-right>
        <span class="caption grey--text lighten-2">
          Zoom
        </span>
        <select class="ml-2 no-outline" style="padding: .1em .1em 0 1em; font-size: 90%" v-model="scaleFactorX">
          <option
            v-for="(v, i) in zoomLevels"
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
      @mousewheel="onMousewheel"
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
    <v-layout row>
      <v-flex>
    <div
      @mousemove="moveOverviewCrossAndTime"
      class="overview"
      :style="{height: overviewHeight + 'px'}">
      <div
        @mousedown="startDragOverview"
        ref="overview"
        class="overview-waveform">
        <svg
          preserveAspectRatio="none"
          :viewBox="`0 0 ${ overviewSvgWidth } 60`"
          :width="overviewSvgWidth"
          style="width: 100%"
          height="60">
          <line
            v-for="i in (overviewSvgWidth / 10)"
            :key="i"
            stroke-width="3"
            stroke="#353535"
            stroke-linecap="round"
            :x1="i * 10"
            :x2="i * 10"
            y1="20"
            y2="40" />
        </svg>
      </div>
      <triangle
        down
        class="overview-thumb"
        tabindex="-1"
        @mousedown="startDragOverview"
        @mouseup="scrollFromOverview"
        @contextmenu="scrollBothFromOverview"
        :style="{
          transform: `translateX(${ overviewThumbOffset }px) translateY(7px)`,
          transition: transitionOverviewThumb ? '.25s' : 'unset'
        }" />
      <div
        class="overview-cross"
        ref="overviewCross"
      />
      <div
        class="overview-time"
        ref="overviewTime"
        :style="{ width: overviewTimeWidth + 'px' }"
      />
    </div>
        <slot name="overview" />
      </v-flex>
      <v-flex>
        <scroll-lock-button style="margin-top: 11px;" v-model="settings.lockScroll" />
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import * as Queue from 'simple-promise-queue'

import scrollLockButton from '@components/ScrollLockButton.vue'
import triangle from '@components/Triangle.vue'

import settings from '../store/settings'
import audio, { OggIndex } from '../service/audio'
import util from '../service/util'
import { findSegmentAt } from '../store/transcript'

const queue = new Queue({
  concurrency: 1,
  autoStart: true
})

@Component({
  components: {
    triangle,
    scrollLockButton
  }
})
export default class Waveform extends Vue {

  @Prop() audioElement: HTMLAudioElement
  @Prop() audioUrl: string
  @Prop({ default: null }) scrollToSegment: Segment|null
  @Prop({ default: 200 }) height: number
  @Prop({ default: null }) scrollToSecond: number|null
  // config
  zoomLevels = [.25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]
  drawDistance = 5000 // pixels in both directions from the center of the viewport (left and right)
  initialPixelsPerSecond = 150
  overviewSvgWidth = 1500
  overviewTimeWidth = 70
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

  renderedWaveFormPieces: number[] = []
  totalWidth = this.audioLength * this.pixelsPerSecond

  onScroll = _.throttle((e) => this.handleScroll(e), 350)
  settings = settings

  mounted() {
    this.initWithAudio()
  }

  addSegmentAt(e: MouseEvent) {
    const c = this.$refs.svgContainer as HTMLDivElement
    this.$emit('add-segment', (c.scrollLeft + e.pageX) / this.pixelsPerSecond)
    console.log(e)
  }

  onMousewheel(e: MouseWheelEvent) {
    if (settings.emulateHorizontalScrolling === true) {
      const c = this.$refs.svgContainer
      if (c instanceof HTMLElement) {
        e.preventDefault()
        c.scrollLeft = c.scrollLeft + (e.deltaY) / (e.shiftKey === true ? 10 : 1)
      }
    }
  }

  moveOverviewCrossAndTime(e: MouseEvent) {
    const o = this.$refs.overview
    const t = this.$refs.overviewTime
    const c = this.$refs.overviewCross
    if (o instanceof HTMLElement && t instanceof HTMLElement && c instanceof HTMLElement) {
      requestAnimationFrame(() => {
        const w = o.clientWidth
        const secondsIn = this.audioLength / w * e.pageX
        const offsetT = Math.min(
          Math.max(e.pageX - this.overviewTimeWidth / 2, 0),
          w - this.overviewTimeWidth
        )
        requestAnimationFrame(() => {
          t.innerHTML = this.toTime(secondsIn)
          t.style.transform = `translateX(${offsetT}px)`
          c.style.transform = `translateX(${e.pageX}px)`
        })
      })
    }
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
    const [left, right] = this.getRenderBoundaries(10000)
    const [startSecond, endSecond] = [Math.floor(left / this.pixelsPerSecond), Math.floor(right / this.pixelsPerSecond)]
    this.visibleSeconds = util.range(Math.max(startSecond, 0), Math.min(endSecond, this.audioLength))
  }

  updateOverviewThumb() {
    const w = this.$refs.svgContainer
    const o = this.$refs.overview
    if (w instanceof HTMLElement && o instanceof HTMLElement) {
      requestAnimationFrame(() => {
        this.overviewThumbWidth = Math.max(w.clientWidth / w.scrollWidth * o.clientWidth, 10)
        this.overviewThumbOffset = (
          (w.scrollLeft + w.clientWidth) / w.scrollWidth * o.clientWidth
        )
        localStorage.setItem('scrollPos', String(w.scrollLeft))
      })
    }
  }

  async drawSpectogramPiece(i: number) {
    console.log('DRAWING SPECTOGRAM')
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      this.metadata.fileSize,
      this.audioLength,
      this.audioElement.src
    )
    console.log({ from, to, duration: to - from })
    const width = isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth
    const c = (await audio.drawSpectogramAsync(buffer, width, this.height)) as HTMLCanvasElement
    const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
    console.time('render')
    el.innerHTML = ''
    el.appendChild(c)
    console.timeEnd('render')
  }

  doMaybeRerender() {
    const piecesToRender = util.findAllNotIn(this.renderedWaveFormPieces, this.shouldRenderWaveFormPieces())
    if (piecesToRender.length > 0) {
      console.log('now rendering:', piecesToRender)
      piecesToRender.forEach((p) => {
        queue.unshiftTask(async (resolve: any, reject: any) => {
          this.renderedWaveFormPieces.push(p)
          try {
            if (this.settings.showSpectograms) {
              const x = await this.drawSpectogramPiece(p)
              resolve(x)
            } else {
              const y = await this.drawWaveFormPiece(p)
              resolve(y)
            }
          } catch (e) {
            console.log(e)
            // remove from cache index if it failed
            const i = this.renderedWaveFormPieces.indexOf(p)
            this.renderedWaveFormPieces.splice(i)
            reject()
          }
        })
      })
    }
  }

  clearRenderCache() {
    this.renderedWaveFormPieces = []
  }

  @Watch('settings.showSpectograms')
  onChangeVisualizationType(showSpectograms: boolean) {
    this.resetView()
  }

  @Watch('settings.useMonoWaveForm')
  onChangeMonoStereo(mono: boolean) {
    this.resetView()
  }

  resetView() {
    this.clearRenderCache()
    this.doMaybeRerender()
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
  scrollBothFromOverview(e: MouseEvent) {
    this.scrollFromOverview(e)
    this.scrollTranscriptFromOverview()
  }
  scrollTranscriptFromOverview() {
    console.log('scrollTranscriptFromOverview')
    const c = this.$refs.svgContainer as HTMLElement
    const currentSeconds = c.scrollLeft / this.pixelsPerSecond
    this.$emit('jump-to-transcript-segment', findSegmentAt(currentSeconds))
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

  @Watch('scrollToSecond')
  doScrollToSecond(newVal: number|null, oldVal: number|null) {
    const el = this.$refs.svgContainer
    if (newVal !== null && el instanceof HTMLElement) {
      const left = this.pixelsPerSecond * newVal
      requestAnimationFrame(() => {
        el.scrollTo({ left })
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
          // behavior: 'smooth',
          left: offset - window.innerWidth / 2
        })
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
        const buffer = await audio.downloadAudioStream({
          url: this.audioElement.src,
          onStart: (metadata: any) => {
            this.metadata = metadata
            this.loading = false
            const scrollLeft = localStorage.getItem('scrollPos')
            const el = that.$refs.svgContainer
            if (scrollLeft !== null && el instanceof HTMLElement) {
              el.scrollTo({ left : Number(scrollLeft) })
            }
          },
          onProgress: (chunk: AudioBuffer, from: number, to: number) => {
            this.drawOverviewWaveformPiece(from, to, chunk)
          }
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

  getRenderBoundaries(distance = this.drawDistance): number[] {
    const el = this.$refs.svgContainer
    if (el instanceof HTMLElement) {
      return [
        Math.max(Math.floor((el.scrollLeft + el.clientWidth / 2 - distance / 2)), 0),
        Math.max(Math.floor((el.scrollLeft + el.clientWidth / 2 + distance / 2)), distance)
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

  async drawOverviewWaveformPiece(startTime: number, endTime: number, audioBuffer: AudioBuffer) {
    const totalDuration = this.audioLength
    const width = (endTime - startTime) * (this.overviewSvgWidth / totalDuration)
    const left = (startTime) * (this.overviewSvgWidth / totalDuration)
    const [svg1, svg2] = await Promise.all([
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 0, left),
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 1, left)
    ])
    requestAnimationFrame(() => {
      const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement);
      el.innerHTML = `
        ${el.innerHTML}
        <path fill="${ settings.waveFormColors[0] }" d="${svg1}"/>
        <path fill="${ settings.waveFormColors[1] }" d="${svg2}" />
      `
    })
  }

  async drawWaveFormPiece(i: number) {

    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const width = isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      this.metadata.fileSize,
      this.audioLength,
      this.audioElement.src
    )

    let svg: string
    if (this.settings.useMonoWaveForm === true) {
      svg = await audio.drawWave(buffer, width, this.height, settings.waveFormColors[0], undefined, true)
    } else {
      const [svg1, svg2] = await Promise.all([
        audio.drawWave(buffer, width, this.height, settings.waveFormColors[0], 0),
        audio.drawWave(buffer, width, this.height, settings.waveFormColors[1], 1)
      ])
      svg = svg1 + svg2
    }
    if (this.$refs.svgContainer instanceof HTMLElement) {
      requestAnimationFrame(() => {
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        console.time('render')
        el.innerHTML = svg
        console.timeEnd('render')
        this.$emit('change-metadata', {
          totalWidth: this.totalWidth,
          amountDrawSegments: this.amountDrawSegments,
          // currentZoomLevel: this.zoomLevels[this.currentZoomLevelIndex],
          pixelsPerSecond: this.pixelsPerSecond,
          audioLength: this.audioLength,
          drawWidth: this.drawWidth
        })
      })
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
      animation fadeIn
      -webkit-animation fadeIn ease-in 1
      animation-fill-mode forwards
      -webkit-animation-duration 1s
      -moz-animation-duration 1s
      animation-duration 1s

.overview
  position relative
  
.fade-slow-enter-active, .fade-leave-active 
  transition opacity 3.5s

.fade-slow-enter, .fade-slow-leave-to
  opacity 0

.overview-thumb
  top 0
  z-index 1
  transition .25s transform
  &:focus
    outline 0

.overview:hover
  .overview-cross
  .overview-time
    opacity 1

.overview-cross
  transition opacity .5s
  opacity 0
  pointer-events none
  top 0px
  z-index 1
  background #ccc
  height 80%
  width 1px
  position absolute

.overview-time
  pointer-events none
  opacity 0
  position absolute
  color #ccc
  z-index 2
  top -25px
  font-size 80%
  text-align center
  background rgba(0,0,0,.2)
  border-radius 10px
  line-height 20px

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

select
  background #303030

.waveform-container
  background #191919

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
