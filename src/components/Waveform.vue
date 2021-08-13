<template>
  <div
    @keydown.left="emitScroll"
    @keydown.right="emitScroll"
    class="waveform-outer"
    @mousewheel="debouncedZoom"
    :style="containerStyle"
    :class="{
      disabled,
      loading
    }">
    <div
      class="wave-form"
      :style="{
        height: `${height}px`,
        width: `${totalWidth}px`
      }"
      ref="svgContainer"
      @mousewheel="scrollOrZoomPreview"
      @scroll="onScroll">
      <div :class="[
        'fade-in-out-quick',
        'second-marker-row',
        hideSecondMarkers === true && 'hidden'
      ]" />
      <div
        :style="stageStyle"
        class="wave-form-inner">
        <div
          v-for="(x, i) in Array(amountDrawSegments)"
          @dblclick.stop="addEventAt"
          :key="i"
          :class="[
            'wave-form-segment',
            'draw-segment-' + i
          ]"
          :style="{
            transform: `scaleY(${scaleFactorY})`,
            left: drawWidth * i + 'px',
            width: i + 1 < amountDrawSegments ? drawWidth + 'px' : 'auto',
            height: height + 'px'
          }">
          <div :style="{marginTop: height / 2 + 'px'}" class="wave-form-placeholder" />
        </div>
        <slot />
        <div
          :class="[
            'fade-in-out-quick',
            'segment-box-container',
            hideSegments === true && 'hidden'
          ]"
          v-if="settings.showSegmentBoxes">
          <segment-box
            v-for="(event, i) in visibleEvents"
            @contextmenu.native.stop.prevent="(e) => $emit('show-menu', e)"
            :key="event.eventId"
            :event="event"
            :previous-event="visibleEvents[i - 1]"
            :next-event="visibleEvents[i + 1]">
          </segment-box>
        </div>
      </div>
    </div>
    <v-layout row style="margin-top: -40px; padding-bottom: 10px;">
      <v-flex xs12 style="position: relative" class="ml-3">
        <scrollbar
          class="scrollbar"
          update-on="updateWaveformScrollbar"
          :max-time="audio.duration"
          @scroll="scrollFromScrollbar"
        />
        <div
          class="overview"
          :style="{
            height: overviewHeight + 'px'
          }">
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
                y1="30"
                y2="40" />
            </svg>
          </div>
        </div>
        <slot name="overview" />
      </v-flex>
      <v-flex>
        <scroll-lock-button
          style="margin-top: 10px;"
          :value="settings.lockScroll"
          @input="handleScrollLockToggle"
        />
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import _ from 'lodash'
import * as Queue from 'simple-promise-queue'
import localForage from 'localforage'

import scrollLockButton from './ScrollLockButton.vue'
import scrollbar from './Scrollbar.vue'
import segmentBox from './SegmentBox.vue'

import settings, { minPixelsPerSecond, maxPixelsPerSecond } from '@/store/settings.store'
import { mutation } from '@/store/history.store'
import * as util from '@/util'
import bus from '@/service/bus'
import { drawWaveSvg, drawWavePathAsync, drawSpectrogramAsync } from '@/service/audio-visualizer.service'
import { TranscriptEvent } from '@/types/transcript'

import store from '@/store'
import Transcript from '@/classes/transcript.class'
import TranscriptAudio from '@/classes/transcript-audio.class'

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

  @Prop({ default: 300 }) height!: number
  @Prop({ required: true }) transcript!: Transcript
  @Prop({ required: true }) audio!: TranscriptAudio

  // config
  drawDistance = 5000 // pixels in both directions from the center of the viewport (left and right)
  drawWidth = 5000
  overviewSvgWidth = 1500 // width of the overview waveform in pixels

  // bind stores
  settings = settings

  onScroll = _.throttle(this.handleScroll, 350)
  debouncedZoom = _.debounce(this.zoom, 350)

  // state
  disabled = false
  loading = false
  scaleFactorY = .75

  overviewHeight = 60
  visibleSeconds: number[] = []
  visibleEvents: TranscriptEvent[] = []
  renderedWaveFormPieces: number[] = []
  scrollTimeout = null

  temporaryZoomOrigin = 0
  temporaryPixelsPerSecond = settings.pixelsPerSecond

  hideSegments = false
  hideSecondMarkers = false

  mounted() {
    bus.$on('scrollTranscript', this.scrollLockedScroll)
    bus.$on('scrollToAudioEvent', this.scrollToSegment)
    bus.$on('scrollToAudioTime', this.scrollToSecond)
    this.initWithAudio()
  }

  get totalWidth(): number {
    return this.audio.duration * settings.pixelsPerSecond
  }

  beforeDestroy() {
    bus.$off('scrollTranscript', this.scrollLockedScroll)
    bus.$off('scrollToAudioEvent', this.scrollToSegment)
  }

  scrollLockedScroll(t: number) {
    if (settings.lockScroll) {
      this.scrollToSecond(t)
    }
    if (this.transcript.audio !== null && this.transcript.audio.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
  }

  handleScrollLockToggle(v: boolean) {
    settings.lockPlayHead = v
    settings.lockScroll = v
  }

  @Watch('transcript.events')
  async onEventsChange(newEs: TranscriptEvent[]) {
    this.visibleEvents = this.getVisibleEvents(boundLeft, boundRight, newEs)
  }

  async cacheOverviewWaveform() {
    if (this.transcript.audio !== null) {
      await util.requestFrameAsync()
      const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement)
      try {
        localForage.setItem('waveformOverview__' + this.transcript.audio.url, el.innerHTML)
      } catch (e) {
        console.log(e)
      }
    }
  }

  async hasOverviewCache(): Promise<boolean> {
    if (this.transcript.audio) {
      const c = await localForage.getItem('waveformOverview__' + this.transcript.audio.url)
      return c !== null
    } else {
      return false
    }
  }

  get containerStyle() {
    return {
      background: this.settings.darkMode ? '#191919' : '#e8e8e8'
    }
  }

  addEventAt(e: MouseEvent) {
    const c = this.$refs.svgContainer as HTMLDivElement
    return mutation(this.transcript.addEvent((c.scrollLeft + e.pageX) / settings.pixelsPerSecond))
  }

  disableAutoScrollDuringPlayback() {
    settings.lockPlayHead = false
  }

  emitScroll() {
    const t = (this.$refs.svgContainer as HTMLElement).scrollLeft / settings.pixelsPerSecond
    bus.$emit('scrollWaveform', t)
    bus.$emit('updateWaveformScrollbar', t)
  }

  zoomPreview(e: MouseWheelEvent) {
    e.preventDefault()
    const el = (this.$el as HTMLElement).querySelector('.wave-form-inner')
    const c = this.$refs.svgContainer
    if (el instanceof HTMLElement && c instanceof HTMLElement) {
      // scale X (width)
      if (e.shiftKey === false) {
        this.hideSegments = true
        this.hideSecondMarkers = true
        this.temporaryZoomOrigin = e.x + c.scrollLeft
        this.temporaryPixelsPerSecond = Math.round(util.setNumberInBounds(
          this.temporaryPixelsPerSecond - e.deltaY,
          minPixelsPerSecond,
          maxPixelsPerSecond
        ))
      // scale Y (height)
      } else {
        this.scaleFactorY = util.setNumberInBounds(this.scaleFactorY - (e.deltaY * 0.1), .1, 3)
      }
    }
  }

  zoom(e: WheelEvent) {
    if (e.ctrlKey === true) {

      const el = (this.$refs.svgContainer as HTMLElement)
      // get the target time at the current mouse pos
      const oldTargetTime = (el.scrollLeft + e.x) / settings.pixelsPerSecond
      // reset state
      this.temporaryZoomOrigin = 0
      this.hideSegments = false
      this.hideSecondMarkers = false

      // if it should transform by some factor.
      if (this.temporaryPixelsPerSecond !== settings.pixelsPerSecond) {
        // set actual pixel per second value
        settings.pixelsPerSecond = Math.round(this.temporaryPixelsPerSecond)
        // scroll to the target time (scrollLeft)
        this.scrollToSecond(oldTargetTime - e.x / settings.pixelsPerSecond)
        // rerender
        this.clearRenderCache()
        this.doMaybeRerender()
      }
    }
  }

  emulateHorizontalScrolling(e: MouseWheelEvent) {
    const c = this.$refs.svgContainer
    if (c instanceof HTMLElement) {
      e.preventDefault()
      c.scrollLeft = c.scrollLeft + (e.deltaY) * (e.shiftKey === true ? 2 : 1) * settings.scrollSpeed
    }
  }

  scrollOrZoomPreview(e: MouseWheelEvent) {
    // notify others
    this.emitScroll()
    // zooming
    if (e.ctrlKey === true) {
      this.zoomPreview(e)
    // user initiated scrolling
    } else {
      if (settings.emulateHorizontalScrolling === true) {
        // emulate horizontal scrolling (windows etc.)
        this.emulateHorizontalScrolling(e)
      }
      if (this.transcript.audio !== null && this.transcript.audio.playAllFrom !== null) {
        this.disableAutoScrollDuringPlayback()
      }
    }
  }

  async handleScroll() {
    if (scrollTimer !== null) {
      window.cancelAnimationFrame(scrollTimer)
    }
    scrollTimer = window.requestAnimationFrame(async () => {
      await util.requestFrameAsync()
      this.updateSecondsMarkers()
      await util.requestFrameAsync()
      window.requestIdleCallback(this.updateSegments)
      await util.requestFrameAsync()
      this.doMaybeRerender()
    })
  }

  shouldKeepFocus() {
    return document.activeElement !== null && (
      document.activeElement.classList.contains('segment') ||
      document.activeElement.classList.contains('waveform-outer')
    )
  }

  async updateSegments() {
    if (this.transcript.audio !== null) {
      const shouldKeepFocus = this.shouldKeepFocus()
      await util.requestFrameAsync()
      const el = this.$refs.svgContainer as HTMLElement
      const w = el.scrollWidth
      const l = el.scrollLeft
      const cw = el.clientWidth
      const scrollFactorLeft = l / w
      const scrollFactorRight = (l + cw) / w
      boundLeft = this.transcript.audio.duration * (scrollFactorLeft - segmentBufferPercent)
      boundRight = this.transcript.audio.duration * (scrollFactorRight + segmentBufferPercent)
      const ves = this.getVisibleEvents(boundLeft, boundRight, this.transcript.events)
      this.visibleEvents = ves
      // if we didn’t do the following call, the elements
      // that are re-rendered (because of the above call)
      // would lose focus, causing the window to receive
      //  focus, and thus breaking the ability
      // to handle keyboard events from here onwards.
      if (shouldKeepFocus) {
        await this.$nextTick();
        (this.$el as any).focus()
      }
    }
  }

  getVisibleEvents(l: number, r: number, es: TranscriptEvent[]): TranscriptEvent[] {
    return es
      .filter(s => (s.endTime >= l && s.startTime <= r))
      .sort((a, b) => a.startTime - b.startTime)
  }

  async updateSecondsMarkers() {
    // (it’s dependent on browser geometry, so a computed getter doesn’t work here.)
    const [left, right] = await this.getRenderBoundaries(10000)
    const [startSecond, endSecond] = [
      Math.floor(left / settings.pixelsPerSecond),
      Math.floor(right / settings.pixelsPerSecond)]
    const visibleSeconds = util
      .range(Math.max(startSecond, 0), Math.min(endSecond, this.audio.duration))
      .filter(s => settings.pixelsPerSecond > 60 || s % 2 === 0)
    await util.requestFrameAsync()
    const el = this.$el.querySelector('.second-marker-row') as HTMLElement
    el.innerHTML = visibleSeconds.map(s => {
      return (
        `<div style="transform: translate3d(${ s * settings.pixelsPerSecond }px, 0, 0)" class="second-marker">`
        + util.timeFromSeconds(s)
        + '</div>'
      )
    }).join('')
  }

  async drawSpectrogramPiece(i: number) {
    if (this.transcript.audio !== null) {
      console.log('DRAWING Spectrogram')
      const isLast = i + 1 === this.amountDrawSegments
      const secondsPerDrawWidth = this.drawWidth / settings.pixelsPerSecond
      const from = i * secondsPerDrawWidth
      const to = isLast ? this.audio.duration : from + secondsPerDrawWidth
      const buffer = await this.transcript.audio.getOrFetchAudioBuffer(
        from,
        to,
        this.transcript.audio.fileSize,
        this.transcript.audio.duration,
        this.transcript.audio.url
      )
      const width = isLast ? (to - from) / secondsPerDrawWidth : this.drawWidth
      const [ c ] = (await drawSpectrogramAsync(buffer, width, this.height))
      const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
      console.time('render')
      el.innerHTML = ''
      el.appendChild(c)
      console.timeEnd('render')
    }
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
            if (settings.showSpectrograms) {
              const x = await this.drawSpectrogramPiece(p)
              resolve(x)
            } else {
              const y = await this.drawWaveFormPiece(p)
              resolve(y)
            }
            this.updateSecondsMarkers()
          } catch (e) {
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
    Array.from((this.$el as HTMLElement).querySelectorAll('.wave-form-segment')).forEach(e => {
      e.innerHTML = ''
    })
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

  @Watch('height')
  onChangeHeight() {
    this.clearRenderCache()
  }

  get stageStyle() {
    return {
      height: this.height + 'px',
      width: this.totalWidth + 'px',
      transformOrigin: this.temporaryZoomOrigin + 'px',
      transform: `scaleX(${ this.temporaryPixelsPerSecond / settings.pixelsPerSecond })`
    }
  }

  scrollTranscriptFromOverview() {
    console.log('scrollTranscriptFromOverview')
    const c = this.$refs.svgContainer as HTMLElement
    const currentSeconds = c.scrollLeft / settings.pixelsPerSecond
    const e = this.transcript.findEventAt(currentSeconds)
    if (e !== undefined) {
      this.transcript.scrollToTranscriptEvent(e)
    }
  }

  scrollFromScrollbar(s: number) {
    this.scrollToSecond(s)
  }

  scrollToSecond(t: number) {
    const el = this.$refs.svgContainer
    if (t !== null && el instanceof HTMLElement) {
      const left = settings.pixelsPerSecond * t
      requestAnimationFrame(() => {
        el.scrollLeft = left
      })
    }
  }

  // TODO: this is an obvious candidate for abstraction
  scrollToSecondSmooth(t: number) {
    const el = this.$refs.svgContainer
    const animationDuration = .25
    const animationDistance = 600
    if (el instanceof HTMLElement) {
      const startTime = performance.now()
      const currentOffset = el.scrollLeft
      const targetOffset = t * settings.pixelsPerSecond
      const realDistance = Math.abs(currentOffset - targetOffset)
      // SCROLL DIRECTLY TO IT (SHORT DISTANCE)
      if (realDistance < this.$el.clientWidth) {
        const step = () => {
          const timeElapsed = (performance.now() - startTime) / 1000
          if (timeElapsed <= animationDuration) {
            el.scrollLeft = util.easeInOutQuad(
              timeElapsed,
              currentOffset,
              targetOffset - currentOffset,
              animationDuration
            )
            requestAnimationFrame(step)
          } else {
            el.scrollLeft = targetOffset
          }
        }
        requestAnimationFrame(step)
      // JUMP, THEN SCROLL (LONG DISTANCE)
      } else {
        const distance = currentOffset < targetOffset ? animationDistance : animationDistance * -1
        el.scrollLeft = targetOffset - distance
        requestAnimationFrame(() => {
          const step = () => {
            const timeElapsed = (performance.now() - startTime) / 1000
            if (timeElapsed <= animationDuration) {
              el.scrollLeft = util.easeOutQuad(
                timeElapsed,
                targetOffset - distance,
                distance,
                animationDuration
              )
              requestAnimationFrame(step)
            } else {
              el.scrollLeft = targetOffset
            }
          }
          requestAnimationFrame(step)
        })
      }
    }
  }

  scrollToSegment(e?: TranscriptEvent|null) {
    if (this.transcript.audio !== null && this.transcript.audio.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
    if (e !== null && e !== undefined) {
      const duration = e.endTime - e.startTime
      const offset = (e.startTime + duration / 2)
      const tCenter = offset - (this.$el.clientWidth / 2 / settings.pixelsPerSecond)
      bus.$emit('updateWaveformScrollbar', tCenter)
      this.scrollToSecondSmooth(tCenter)
    }
  }

  async initWithCache() {
    if (this.transcript.audio !== null) {
      // tslint:disable-next-line:max-line-length
      const waveformCache = (await localForage.getItem('waveformOverview__' + this.transcript.audio.url)) as string|null
      const scrollLeft = localStorage.getItem('scrollPos')
      if (waveformCache !== null) {
        const overviewEl = this.$el.querySelector('.overview-waveform svg') as HTMLElement
        overviewEl.innerHTML = waveformCache
      }
      this.loading = false
      const el = this.$refs.svgContainer
      if (scrollLeft !== null && el instanceof HTMLElement) {
        el.scrollTo({ left: Number(scrollLeft) })
      }
    }
  }

  async initWithAudio() {
    if (this.transcript.audio !== null) {
      if (await this.hasOverviewCache()) {
        this.initWithCache()
        this.doMaybeRerender()
      } else {
        this.transcript.audio.onChunkAvailable = async (start, end, ab) => {
          await this.drawOverviewWaveformPiece(start, end, ab)
        }
      }
    }
  }

  get amountDrawSegments() {
    return Math.ceil(this.audio.duration * settings.pixelsPerSecond / this.drawWidth)
  }

  async getRenderBoundaries(distance = this.drawDistance): Promise<number[]> {
    const el = this.$refs.svgContainer
    if (el instanceof HTMLElement) {
      await util.requestFrameAsync()
      const scrollLeft = el.scrollLeft
      const clientWidth = el.clientWidth
      return [
        Math.max(Math.floor((scrollLeft + clientWidth / 2 - distance / 2)), 0),
        Math.max(Math.floor((scrollLeft + clientWidth / 2 + distance / 2)), distance)
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
    if (this.transcript.audio) {
      const width = Math.ceil((endTime - startTime) * (this.overviewSvgWidth / this.audio.duration)) + 1
      const left = Math.floor((startTime) * (this.overviewSvgWidth / this.audio.duration))
      const [svg1, svg2] = await Promise.all([
        drawWavePathAsync(audioBuffer, width, this.overviewHeight, 0, left),
        drawWavePathAsync(audioBuffer, width, this.overviewHeight, 1, left)
      ])
      await util.requestFrameAsync()
      const el = this.$el.querySelector('.overview-waveform svg') as HTMLElement
      console.log('drawing overview from to', util.timeFromSeconds(startTime), util.timeFromSeconds(endTime))
      el.insertAdjacentHTML(
        'beforeend',
        `<path fill="${ settings.waveFormColors[0] }" d="${ svg1 }" />
         <path fill="${ settings.waveFormColors[1] }" d="${ svg2 }" />`
      )
    }
  }

  async drawWaveFormPiece(i: number) {
    if (this.transcript.audio !== null) {
      const isLast = i + 1 === this.amountDrawSegments
      const secondsPerDrawWidth = this.drawWidth / settings.pixelsPerSecond
      const from = i * secondsPerDrawWidth
      const to = isLast ? this.transcript.audio.duration : from + secondsPerDrawWidth
      const width = isLast ? (to - from) * settings.pixelsPerSecond : this.drawWidth
      const buffer = await this.transcript.audio.getOrFetchAudioBuffer(
        from,
        to,
        this.transcript.audio.fileSize,
        this.transcript.audio.duration,
        this.transcript.audio.url
      )
      const svg = await (async () => {
        if (settings.useMonoWaveForm === true) {
          if (this.transcript.audio !== null) {
            return await drawWaveSvg(buffer, width, this.height, settings.waveFormColors[1], undefined, true)
          }
        } else {
          if (this.transcript.audio !== null) {
            return (await Promise.all([
              drawWaveSvg(buffer, width, this.height, settings.waveFormColors[0], 0),
              drawWaveSvg(buffer, width, this.height, settings.waveFormColors[1], 1)
            ])).join('')
          }
        }
      })()
      if (this.$refs.svgContainer instanceof HTMLElement) {
        requestAnimationFrame(() => {
          const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
          el.innerHTML = svg || ''
          el.style.width = `${(to - from) * settings.pixelsPerSecond}px`
        })
      }
    }
  }
}
</script>

<style lang="stylus">
@-webkit-keyframes fadeIn {
  from {
    transform scaleY(0)
    opacity 0
  }
  to {
    transform scaleY(1)
    opacity 1
  }
}
@-moz-keyframes fadeIn {
  from {
    transform scaleY(0)
    opacity 0
  }
  to {
    transform scaleY(1)
    opacity 1
  }
}
@keyframes fadeIn {
  from {
    transform scaleY(0)
    opacity 0
  }
  to {
    transform scaleY(1)
    opacity 1
  }
}

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
  svg path
    transform-origin 50% 50%
    animation .2s fadeIn
    animation-iteration-count 1
    animation-direction initial
    mix-blend-mode overlay

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
  pointer-events none
.wave-form-segment
  transform-origin center
  position absolute
  overflow hidden
.wave-form
  margin-top 0px
  position relative
  max-width 100%
  will-change scroll-position
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
    // transition .5s transform
    overflow-y hidden
    position relative

.overview
  position relative
  
.hidden
  opacity 0

.fade-slow-enter-active, .fade-leave-active 
  transition opacity 3.5s

.fade-slow-enter, .fade-slow-leave-to
  opacity 0

select
  background #303030

.wave-form-placeholder
  height 1px
  width 100%
  border-top 1px dashed grey

.waveform-outer
  .scrollbar
    position absolute
    z-index 1
    width 100%
    height 60px

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
