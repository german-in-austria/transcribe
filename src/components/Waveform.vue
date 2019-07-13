<template>
  <div
    @keydown.left="emitScroll"
    @keydown.right="emitScroll"
    class="waveform-outer"
    :style="containerStyle"
    :class="{ disabled, loading }">
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
      <div class="second-marker-row" />
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
          @dblclick.stop="addEventAt"
          :class="['wave-form-segment', 'draw-segment-'+i]">
          <div class="wave-form-placeholder" />
        </div>
        <slot />
        <div v-if="settings.showSegmentBoxes">
          <segment-box
            v-for="(event, i) in visibleEvents"
            @contextmenu.native.stop.prevent="(e) => $emit('show-menu', e)"
            :key="event.eventId"
            :event="event"
            :previous-event="visibleEvents[i - 1]"
            :next-event="visibleEvents[i + 1]"
            :pixels-per-second="pixelsPerSecond">
          </segment-box>
        </div>
      </div>
    </div>
    <v-layout row style="margin-top: -40px; padding-bottom: 20px;">
      <v-flex xs12 class="ml-3">
        <scrollbar class="scrollbar" update-on="scrollWaveform" @scroll="scrollFromScrollbar" />
        <div
          class="overview"
          :style="{height: overviewHeight + 'px'}">
          <div
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
                stroke-width="1"
                :stroke="settings.darkMode ? '#353535' : '#EEEEEE'"
                stroke-linecap="round"
                :x1="i * 10"
                :x2="i * 10"
                y1="20"
                y2="40" />
            </svg>
          </div>
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

import scrollLockButton from './ScrollLockButton.vue'
import scrollbar from './Scrollbar.vue'
import segmentBox from './SegmentBox.vue'

import settings from '../store/settings'
import audio from '../service/audio'
import * as util from '../util'
import EventBus from '../service/event-bus'
import {
  eventStore,
  findEventAt,
  LocalTranscriptEvent,
  scrollToTranscriptEvent,
  toTime
} from '../store/transcript'

const queue = new Queue({
  concurrency: 2,
  autoStart: true
})

// TODO: percentages are impractical. use pixels
const segmentBufferPercent = .01
let boundLeft = 0
let boundRight = 100
let scrollTimer: number|null = null

@Component({
  components: {
    scrollbar,
    scrollLockButton,
    segmentBox
  }
})
export default class Waveform extends Vue {

  @Prop() audioUrl: string
  @Prop({ default: 300 }) height: number

  // config
  zoomLevels = [.25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]
  drawDistance = 5000 // pixels in both directions from the center of the viewport (left and right)
  initialPixelsPerSecond = 150 // this the initial real zoom value
  overviewSvgWidth = 1500 // width of the overview waveform in pixels

  // bind stores
  settings = settings
  userState = eventStore.userState
  eventStore = eventStore

  // state
  pixelsPerSecond = this.initialPixelsPerSecond // copied on init, not bound.
  disabled = false
  loading = false
  scaleFactorY = 1
  scaleFactorX = 1
  overviewHeight = 60
  visibleSeconds: number[] = []
  visibleEvents: LocalTranscriptEvent[] = []
  audioLength = 0
  metadata: any = {} // TODO: get rid of this / put into the store
  renderedWaveFormPieces: number[] = []
  totalWidth = this.audioLength * this.pixelsPerSecond
  log = console.log
  scrollTimeout = null
  onScroll = _.throttle(this.handleScroll, 350)

  mounted() {
    EventBus.$on('scrollTranscript', this.scrollLockedScroll)
    this.initWithAudio()
  }

  beforeDestroy() {
    EventBus.$off('scrollTranscript', this.scrollLockedScroll)
  }

  scrollLockedScroll(t: number) {
    if (settings.lockScroll) {
      this.scrollToSecond(t)
    }
    if (eventStore.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
  }

  @Watch('eventStore.events')
  async onEventsChange(newEs: LocalTranscriptEvent[]) {
    this.visibleEvents = await this.getVisibleEvents(boundLeft, boundRight, newEs)
  }

  async cacheOverviewWaveform() {
    await util.requestFrameAsync()
    const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement)
    localStorage.setItem(this.metadata.url + '_overview', el.innerHTML)
  }

  get containerStyle() {
    return {
      background: this.settings.darkMode ? '#191919' : '#e8e8e8'
    }
  }

  addEventAt(e: MouseEvent) {
    const c = this.$refs.svgContainer as HTMLDivElement
    this.$emit('add-segment', (c.scrollLeft + e.pageX) / this.pixelsPerSecond)
  }

  disableAutoScrollDuringPlayback() {
    settings.lockPlayHead = false
  }

  emitScroll() {
    EventBus.$emit('scrollWaveform', (this.$refs.svgContainer as HTMLElement).scrollLeft / this.pixelsPerSecond)
  }

  onMousewheel(e: MouseWheelEvent) {
    this.emitScroll()
    if (settings.emulateHorizontalScrolling === true) {
      const c = this.$refs.svgContainer
      if (c instanceof HTMLElement) {
        e.preventDefault()
        c.scrollLeft = c.scrollLeft + (e.deltaY) / (e.shiftKey === true ? 10 : 1)
      }
    }
    if (eventStore.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
  }

  get drawWidth(): number {
    return 5000 * this.scaleFactorX
  }

  async handleScroll() {
    if (scrollTimer !== null) {
      window.cancelAnimationFrame(scrollTimer)
    }
    scrollTimer = window.requestAnimationFrame(async () => {
      await util.requestFrameAsync()
      this.$emit('scroll')
      await util.requestFrameAsync()
      this.updateSecondsMarkers()
      await util.requestFrameAsync()
      window.requestIdleCallback(this.doMaybeRerender)
      await util.requestFrameAsync()
      window.requestIdleCallback(this.updateSegments)
    })
  }

  shouldKeepFocus() {
    return document.activeElement !== null && (
      document.activeElement.classList.contains('segment') ||
      document.activeElement.classList.contains('waveform-outer')
    )
  }

  async updateSegments() {
    const shouldKeepFocus = this.shouldKeepFocus()
    await util.requestFrameAsync()
    const el = this.$refs.svgContainer as HTMLElement
    const w = el.scrollWidth
    const l = el.scrollLeft
    const cw = el.clientWidth
    const scrollFactorLeft = l / w
    const scrollFactorRight = (l + cw) / w
    boundLeft = eventStore.audioElement.duration * (scrollFactorLeft - segmentBufferPercent)
    boundRight = eventStore.audioElement.duration * (scrollFactorRight + segmentBufferPercent)
    const ves = await this.getVisibleEvents(boundLeft, boundRight)
    this.visibleEvents = ves
    // if we didn’t do that, the elements that are re-rendered
    // (because of the above call) would loose focus, causing the
    // window to receive focus, and thus breaking the ability
    // to handle keyboard events from here.
    if (shouldKeepFocus) {
      await this.$nextTick();
      (this.$el as any).focus()
    }
  }

  async getVisibleEvents(l: number, r: number, es = eventStore.events): Promise<LocalTranscriptEvent[]> {
    // await util.requestFrameAsync()
    const ves = _(es)
      .filter((s) => {
        return s.startTime >= l && s.endTime <= r
      })
      .sortBy('startTime')
      .value()
    await util.requestFrameAsync()
    return ves
  }

  async updateSecondsMarkers() {
    // (it’s dependent on browser geometry, so a computed getter doesn’t work here.)
    const [left, right] = await this.getRenderBoundaries(10000)
    const [startSecond, endSecond] = [Math.floor(left / this.pixelsPerSecond), Math.floor(right / this.pixelsPerSecond)]
    const visibleSeconds = util
      .range(Math.max(startSecond, 0), Math.min(endSecond, this.audioLength))
      .filter((s, i) => this.pixelsPerSecond > 60 || i % 2 === 0)
    await util.requestFrameAsync()
    const el = this.$el.querySelector('.second-marker-row') as HTMLElement
    el.innerHTML = visibleSeconds.map(s => {
      return `<div style="transform: translate3d(${ s * this.pixelsPerSecond }px, 0, 0)" class="second-marker">`
        + toTime(s)
        + '</div>'
    }).join('')
  }

  async drawSpectrogramPiece(i: number) {
    console.log('DRAWING Spectrogram')
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      this.metadata.fileSize,
      this.audioLength,
      eventStore.audioElement.src
    )
    console.log({ from, to, duration: to - from })
    const width = isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth
    const [c, f] = (await audio.drawSpectrogramAsync(buffer, width, this.height))
    const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
    console.time('render')
    el.innerHTML = ''
    el.appendChild(c)
    console.timeEnd('render')
  }

  async doMaybeRerender() {
    const piecesToRender = util.findAllNotIn(this.renderedWaveFormPieces, await this.shouldRenderWaveFormPieces())
    if (piecesToRender.length > 0) {
      piecesToRender.forEach((p) => {
        if (queue.length >= 10) {
          queue.pop()
        }
        queue.unshiftTask(async (resolve: any, reject: any) => {
          this.renderedWaveFormPieces.push(p)
          try {
            if (this.settings.showSpectrograms) {
              const x = await this.drawSpectrogramPiece(p)
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

  @Watch('settings.showSpectrograms')
  onChangeVisualizationType(showSpectrograms: boolean) {
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
    const el = (this.$refs.svgContainer as HTMLElement)
    const oldProgress = el.scrollLeft / this.pixelsPerSecond
    requestAnimationFrame(() => {
      this.pixelsPerSecond = this.initialPixelsPerSecond * this.scaleFactorX
      this.$nextTick(() => {
        this.scrollToSecond(oldProgress)
      })
      // clear cache
      this.clearRenderCache()
      this.doMaybeRerender()
      this.totalWidth = this.audioLength * this.pixelsPerSecond
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

  scrollTranscriptFromOverview() {
    console.log('scrollTranscriptFromOverview')
    const c = this.$refs.svgContainer as HTMLElement
    const currentSeconds = c.scrollLeft / this.pixelsPerSecond
    const e = findEventAt(currentSeconds)
    if (e !== undefined) {
      scrollToTranscriptEvent(e)
    }
  }
  scrollFromScrollbar(s: number) {
    this.scrollToSecond(s)
  }

  scrollToSecond(t: number) {
    const el = this.$refs.svgContainer
    if (t !== null && el instanceof HTMLElement) {
      const left = this.pixelsPerSecond * t
      requestAnimationFrame(() => {
        el.scrollLeft = left
      })
    }
  }

  scrollToSecondSmooth(targetOffset: number) {
    const el = this.$refs.svgContainer
    const animationDuration = .3
    const animationDistance = 600
    if (el instanceof HTMLElement) {
      const startTime = performance.now()
      const currentOffset = el.scrollLeft
      const realDistance = Math.abs(currentOffset - targetOffset)
      // SCROLL DIRECTLY TO IT (SHORT DISTANCE)
      if (realDistance < this.$el.clientWidth) {
        const step = () => {
          const timeEllapsed = (performance.now() - startTime) / 1000
          if (timeEllapsed <= animationDuration) {
            el.scrollLeft = util.easeInOutQuad(
              timeEllapsed,
              currentOffset,
              targetOffset - currentOffset,
              animationDuration
            )
            requestAnimationFrame(step)
          }
        }
        requestAnimationFrame(step)
      // JUMP, THEN SCROLL (LONG DISTANCE)
      } else {
        const distance = currentOffset < targetOffset ? animationDistance : animationDistance * -1
        el.scrollLeft = targetOffset - distance
        requestAnimationFrame(() => {
          const step = () => {
            const timeEllapsed = (performance.now() - startTime) / 1000
            if (timeEllapsed <= animationDuration) {
              el.scrollLeft = util.easeOutQuad(
                timeEllapsed,
                targetOffset - distance,
                distance,
                animationDuration
              )
              requestAnimationFrame(step)
            }
          }
          requestAnimationFrame(step)
        })
      }
    }
  }

  @Watch('userState.viewingAudioEvent')
  doScrollToSegment(e: LocalTranscriptEvent) {
    if (eventStore.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
    if (e !== null) {
      const duration = e.endTime - e.startTime
      const offset = (e.startTime + duration / 2) * this.pixelsPerSecond
      const targetOffset = offset - this.$el.clientWidth / 2
      EventBus.$emit('scrollWaveform', targetOffset / this.pixelsPerSecond)
      this.scrollToSecondSmooth(targetOffset)
    }
  }

  initWithMetadata(m: any) {
    const waveformCache = localStorage.getItem(m.url + '_overview')
    const scrollLeft = localStorage.getItem('scrollPos')
    this.metadata = m
    if (waveformCache !== null) {
      const overviewEl = (this.$el.querySelector('.overview-waveform svg') as HTMLElement);
      overviewEl.innerHTML = waveformCache
    }
    this.loading = false
    const el = this.$refs.svgContainer
    if (scrollLeft !== null && el instanceof HTMLElement) {
      el.scrollTo({ left : Number(scrollLeft) })
    }
  }

  @Watch('eventStore.audioElement')
  async initWithAudio() {
    if (eventStore.audioElement !== null && !isNaN(eventStore.audioElement.duration)) {
      this.loading = true
      this.audioLength = eventStore.audioElement.duration
      this.totalWidth = this.audioLength * this.pixelsPerSecond
      const that = this
      if (audio.store.isLocalFile === true) {
        this.loading = false
      } else {
        await audio.downloadAudioStream({
          url: eventStore.audioElement.src,
          onStart: (metadata: any) => {
            this.initWithMetadata(metadata)
            this.doMaybeRerender()
          },
          onProgress: (chunk: AudioBuffer, from: number, to: number) => {
            if (localStorage.getItem(this.metadata.url + '_overview') === null) {
              this.drawOverviewWaveformPiece(from, to, chunk)
            }
          }
        })
        this.cacheOverviewWaveform()
        console.log('download done.')
      }
    }
  }

  get amountDrawSegments() {
    return Math.ceil(this.audioLength * this.pixelsPerSecond / this.drawWidth)
  }

  async getRenderBoundaries(distance = this.drawDistance): Promise<number[]> {
    await util.requestFrameAsync()
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

  async shouldRenderWaveFormPieces(): Promise<number[]> {
    const [ left, right ] = await this.getRenderBoundaries()
    const [ startPiece, endPiece ] = [ Math.floor(left / this.drawWidth), Math.floor(right / this.drawWidth) ]
    return util.range(startPiece, endPiece)
  }

  async drawOverviewWaveformPiece(startTime: number, endTime: number, audioBuffer: AudioBuffer) {
    const totalDuration = this.audioLength
    const width = Math.ceil((endTime - startTime) * (this.overviewSvgWidth / totalDuration)) + 1
    const left = Math.floor((startTime) * (this.overviewSvgWidth / totalDuration))
    const [svg1, svg2] = await Promise.all([
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 0, left),
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 1, left)
    ])
    await util.requestFrameAsync()
    const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement);
    el.insertAdjacentHTML(
      'beforeend',
      `<path fill="${ settings.waveFormColors[0] }" d="${ svg1 }" />
       <path fill="${ settings.waveFormColors[1] }" d="${ svg2 }" />`
    )
  }

  async drawWaveFormPiece(i: number) {
    console.log('drawing', i)
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / this.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const width = isLast ? (to - from) * this.pixelsPerSecond : this.drawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      this.metadata.fileSize,
      this.audioLength,
      eventStore.audioElement.src
    )

    let svg: string
    if (this.settings.useMonoWaveForm === true) {
      svg = await audio.drawWave(buffer, width, this.height, settings.waveFormColors[1], undefined, true)
    } else {
      const [svg1, svg2] = await Promise.all([
        audio.drawWave(buffer, width, this.height, settings.waveFormColors[0], 0),
        audio.drawWave(buffer, width, this.height, settings.waveFormColors[1], 1)
      ])
      // console.log({from, to, svg1, svg2, width, buffer})
      svg = svg1 + svg2
    }
    if (this.$refs.svgContainer instanceof HTMLElement) {
      requestAnimationFrame(() => {
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        console.time('render')
        el.innerHTML = svg
        el.style.width = `${(to - from) * this.pixelsPerSecond}px`
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

.second-marker
  will-change transform
  min-width 1px
  height 10px
  top 32.5px
  position absolute
  border-left 1px solid #6f6f6f
  user-select none
  font-size 10px
  line-height 12px
  padding-left 7px
  color #6f6f6f

.overview-waveform
  z-index -1
  white-space nowrap
  // svg path
  //   mix-blend-mode overlay

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

.overview
  position relative
  
.fade-slow-enter-active, .fade-leave-active 
  transition opacity 3.5s

.fade-slow-enter, .fade-slow-leave-to
  opacity 0

select
  background #303030

.waveform-outer
  .scrollbar
    transition opacity .25s
    opacity 0
  &:hover
    .scrollbar
      opacity 1

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
