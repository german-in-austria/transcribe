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
          <div class="wave-form-placeholder" />
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
    <v-layout row style="margin-top: -40px; padding-bottom: 20px;">
      <v-flex xs12 style="position: relative" class="ml-3">
        <scrollbar
          class="scrollbar"
          update-on="updateWaveformScrollbar"
          :max-time="eventStore.audioElement.duration"
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
                y1="20"
                y2="40" />
            </svg>
          </div>
        </div>
        <slot name="overview" />
      </v-flex>
      <v-flex>
        <scroll-lock-button
          style="margin-top: 20px;"
          :value="settings.lockScroll"
          @input="handleScrollLockToggle"
        />
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
import { undoable } from '../store/history'
import audio from '../service/audio'
import * as util from '../util'
import EventBus from '../service/event-bus'

import {
  eventStore,
  findEventAt,
  LocalTranscriptEvent,
  scrollToTranscriptEvent,
  addEvent,
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
  initialPixelsPerSecond = settings.pixelsPerSecond // this the initial real zoom value
  overviewSvgWidth = 1500 // width of the overview waveform in pixels

  // bind stores
  settings = settings
  userState = eventStore.userState
  eventStore = eventStore

  onScroll = _.throttle(this.handleScroll, 350)
  debouncedZoom = _.debounce(this.zoom, 350)

  // state
  disabled = false
  loading = false
  scaleFactorY = .85
  scaleFactorX = 1
  overviewHeight = 60
  visibleSeconds: number[] = []
  visibleEvents: LocalTranscriptEvent[] = []
  audioLength = 0
  renderedWaveFormPieces: number[] = []
  totalWidth = this.audioLength * settings.pixelsPerSecond
  scrollTimeout = null

  temporaryZoomOrigin = 0
  temporaryScaleX = 1

  hideSegments = false
  hideSecondMarkers = false

  mounted() {
    EventBus.$on('scrollTranscript', this.scrollLockedScroll)
    EventBus.$on('scrollToAudioEvent', this.doScrollToSegment)
    this.initWithAudio()
  }

  beforeDestroy() {
    EventBus.$off('scrollTranscript', this.scrollLockedScroll)
    EventBus.$off('scrollToAudioEvent', this.doScrollToSegment)
  }

  scrollLockedScroll(t: number) {
    if (settings.lockScroll) {
      this.scrollToSecond(t)
    }
    if (eventStore.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
  }

  handleScrollLockToggle(v: boolean) {
    settings.lockPlayHead = v
    settings.lockScroll = v
  }

  @Watch('eventStore.events')
  async onEventsChange(newEs: LocalTranscriptEvent[]) {
    this.visibleEvents = await this.getVisibleEvents(boundLeft, boundRight, newEs)
  }

  async cacheOverviewWaveform() {
    await util.requestFrameAsync()
    const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement)
    localStorage.setItem('waveformOverview__' + eventStore.metadata.audioUrl, el.innerHTML)
  }

  hasOverviewCache(): boolean {
    return localStorage.getItem('waveformOverview__' + eventStore.metadata.audioUrl) !== null
  }

  get containerStyle() {
    return {
      background: this.settings.darkMode ? '#191919' : '#e8e8e8'
    }
  }

  addEventAt(e: MouseEvent) {
    const c = this.$refs.svgContainer as HTMLDivElement
    return undoable(addEvent((c.scrollLeft + e.pageX) / settings.pixelsPerSecond))
  }

  disableAutoScrollDuringPlayback() {
    settings.lockPlayHead = false
  }

  emitScroll() {
    const t = (this.$refs.svgContainer as HTMLElement).scrollLeft / settings.pixelsPerSecond
    EventBus.$emit('scrollWaveform', t)
    EventBus.$emit('updateWaveformScrollbar', t)
  }

  zoomPreview(e: MouseWheelEvent) {
    e.preventDefault()
    const el = (this.$el as HTMLElement).querySelector('.wave-form-inner')
    const c = this.$refs.svgContainer
    const newVirtualTempScaleX = this.temporaryScaleX - e.deltaY * 0.02
    if (el instanceof HTMLElement && c instanceof HTMLElement) {
      this.temporaryZoomOrigin = e.x + c.scrollLeft
      if (
        this.scaleFactorX * newVirtualTempScaleX >= .25 &&
        this.scaleFactorX * newVirtualTempScaleX <= 4
      ) {
        this.hideSegments = true
        this.hideSecondMarkers = true
        this.temporaryScaleX = newVirtualTempScaleX
      }
    }
  }

  emulateHorizontalScrolling(e: MouseWheelEvent) {
    const c = this.$refs.svgContainer
    if (c instanceof HTMLElement) {
      e.preventDefault()
      c.scrollLeft = c.scrollLeft + (e.deltaY) / (e.shiftKey === true ? 10 : 1)
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
      if (eventStore.playAllFrom !== null) {
        this.disableAutoScrollDuringPlayback()
      }
    }
  }

  get drawWidth(): number {
    return 5000
  }

  async handleScroll() {
    if (scrollTimer !== null) {
      window.cancelAnimationFrame(scrollTimer)
    }
    scrollTimer = window.requestAnimationFrame(async () => {
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
    const ves = _(es)
      .filter(s => (s.endTime >= l && s.startTime <= r))
      .sortBy('startTime')
      .value()
    await util.requestFrameAsync()
    return ves
  }

  async updateSecondsMarkers() {
    // (it’s dependent on browser geometry, so a computed getter doesn’t work here.)
    const [left, right] = await this.getRenderBoundaries(10000)
    const [startSecond, endSecond] = [
      Math.floor(left / settings.pixelsPerSecond),
      Math.floor(right / settings.pixelsPerSecond)]
    const visibleSeconds = util
      .range(Math.max(startSecond, 0), Math.min(endSecond, this.audioLength))
      .filter((s, i) => settings.pixelsPerSecond > 60 || s % 2 === 0)
    await util.requestFrameAsync()
    const el = this.$el.querySelector('.second-marker-row') as HTMLElement
    el.innerHTML = visibleSeconds.map(s => {
      return (
        `<div style="transform: translate3d(${ s * settings.pixelsPerSecond }px, 0, 0)" class="second-marker">`
        + toTime(s)
        + '</div>'
      )
    }).join('')
  }

  async drawSpectrogramPiece(i: number) {
    console.log('DRAWING Spectrogram')
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / settings.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? this.audioLength : from + secondsPerDrawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      eventStore.audioMetadata.fileSize,
      eventStore.audioMetadata.length,
      eventStore.audioElement.src
    )
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
    Array.from((this.$el as HTMLElement).querySelectorAll('.wave-form-segment')).forEach(e => e.innerHTML = '')
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

  zoom(e: WheelEvent) {
    if (e.ctrlKey === true) {
      // if it should transform by some factor.
      if (this.temporaryScaleX !== 1) {
        // compute the new scale factor
        this.scaleFactorX = this.scaleFactorX * this.temporaryScaleX
        // get the target time at the current mouse pos
        const el = (this.$refs.svgContainer as HTMLElement)
        const oldTargetTime = (el.scrollLeft + e.x) / settings.pixelsPerSecond
        // reset state
        this.temporaryScaleX = 1
        this.temporaryZoomOrigin = 0
        this.hideSegments = false
        this.hideSecondMarkers = false
        // set actual pixel per second value via scale factor
        settings.pixelsPerSecond = Math.round(this.initialPixelsPerSecond * this.scaleFactorX)
        this.totalWidth = this.audioLength * settings.pixelsPerSecond
        // scroll to the target time (scrollLeft)
        this.scrollToSecond(oldTargetTime - e.x / settings.pixelsPerSecond)
        // rerender
        this.clearRenderCache()
        this.doMaybeRerender()
      }
    }
  }

  get stageStyle() {
    return {
      height: this.height + 'px',
      width: this.totalWidth + 'px',
      transformOrigin: this.temporaryZoomOrigin + 'px',
      transform: `scaleX(${this.temporaryScaleX >= 0.1 ? this.temporaryScaleX : 0.1})`
    }
  }

  scrollTranscriptFromOverview() {
    console.log('scrollTranscriptFromOverview')
    const c = this.$refs.svgContainer as HTMLElement
    const currentSeconds = c.scrollLeft / settings.pixelsPerSecond
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
      const left = settings.pixelsPerSecond * t
      requestAnimationFrame(() => {
        el.scrollLeft = left
      })
    }
  }

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

  doScrollToSegment(e?: LocalTranscriptEvent|null) {
    if (eventStore.playAllFrom !== null) {
      this.disableAutoScrollDuringPlayback()
    }
    if (e !== null && e !== undefined) {
      const duration = e.endTime - e.startTime
      const offset = (e.startTime + duration / 2)
      const tCenter = offset - (this.$el.clientWidth / 2 / settings.pixelsPerSecond)
      EventBus.$emit('updateWaveformScrollbar', tCenter)
      this.scrollToSecondSmooth(tCenter)
    }
  }

  initWithCache() {
    const waveformCache = localStorage.getItem('waveformOverview__' + eventStore.metadata.audioUrl)
    const scrollLeft = localStorage.getItem('scrollPos')
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

  async initWithAudio() {
    if (eventStore.audioElement !== null && !isNaN(eventStore.audioElement.duration)) {
      this.loading = true
      this.audioLength = eventStore.audioElement.duration
      this.totalWidth = this.audioLength * settings.pixelsPerSecond
      const that = this
      if (audio.store.isLocalFile === true) {
        this.loading = false
        await audio.decodeAudioBufferProgressively({
          buffer: audio.store.uint8Buffer,
          onProgress: async (chunk: AudioBuffer, from: number, to: number) => {
            await this.drawOverviewWaveformPiece(from, to, chunk)
          }
        })
      } else {
        if (this.hasOverviewCache()) {
          await audio.downloadAudioStream({
            url: eventStore.audioElement.src,
            onStart: (metadata) => {
              if (metadata !== null) {
                eventStore.metadata.audioUrl = metadata.url
                eventStore.audioMetadata.fileSize = metadata.fileSize
                eventStore.audioMetadata.length = eventStore.audioElement.duration
              }
              this.initWithCache()
              this.doMaybeRerender()
            }
          })
        } else {
          await audio.downloadAndDecodeAudioStream({
            url: eventStore.audioElement.src,
            onStart: (metadata) => {
              if (metadata !== null) {
                eventStore.metadata.audioUrl = metadata.url
                eventStore.audioMetadata.fileSize = metadata.fileSize
                eventStore.audioMetadata.length = eventStore.audioElement.duration
              }
              this.initWithCache()
              this.doMaybeRerender()
            },
            onProgress: async (chunk: AudioBuffer, from: number, to: number) => {
              if (localStorage.getItem('waveformOverview__' + eventStore.metadata.audioUrl) === null) {
                await this.drawOverviewWaveformPiece(from, to, chunk)
              }
            }
          })
          this.cacheOverviewWaveform()
        }
        console.log('download done.')
      }
    }
  }

  get amountDrawSegments() {
    return Math.ceil(this.audioLength * settings.pixelsPerSecond / this.drawWidth)
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
    const totalDuration = this.audioLength
    const width = Math.ceil((endTime - startTime) * (this.overviewSvgWidth / totalDuration)) + 1
    const left = Math.floor((startTime) * (this.overviewSvgWidth / totalDuration))
    const [svg1, svg2] = await Promise.all([
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 0, left),
      audio.drawWavePathAsync(audioBuffer, width, this.overviewHeight, 1, left)
    ])
    await util.requestFrameAsync()
    const el = (this.$el.querySelector('.overview-waveform svg') as HTMLElement);
    console.log('drawing overview from to', toTime(startTime), toTime(endTime))
    el.insertAdjacentHTML(
      'beforeend',
      `<path fill="${ settings.waveFormColors[0] }" d="${ svg1 }" />
       <path fill="${ settings.waveFormColors[1] }" d="${ svg2 }" />`
    )
  }

  async drawWaveFormPiece(i: number) {
    const isLast = i + 1 === this.amountDrawSegments
    const secondsPerDrawWidth = this.drawWidth / settings.pixelsPerSecond
    const from = i * secondsPerDrawWidth
    const to = isLast ? eventStore.audioMetadata.length : from + secondsPerDrawWidth
    const width = isLast ? (to - from) * settings.pixelsPerSecond : this.drawWidth
    const buffer = await audio.getOrFetchAudioBuffer(
      from,
      to,
      eventStore.audioMetadata.fileSize,
      eventStore.audioMetadata.length,
      eventStore.audioElement.src
    )

    console.log({
      from,
      to,
      duration: to - from,
      drawWidth: this.drawWidth,
      secondsPerDrawWidth,
      bufferDuration: buffer.duration,
      pixelsPerSecond: settings.pixelsPerSecond
    })

    const svg = await (async () => {
      if (settings.useMonoWaveForm === true) {
        return await audio.drawWave(buffer, width, this.height, settings.waveFormColors[1], undefined, true)
      } else {
        return (await Promise.all([
          audio.drawWave(buffer, width, this.height, settings.waveFormColors[0], 0),
          audio.drawWave(buffer, width, this.height, settings.waveFormColors[1], 1)
        ])).join('')
      }
    })()
    if (this.$refs.svgContainer instanceof HTMLElement) {
      requestAnimationFrame(() => {
        const el = (this.$el.querySelector('.draw-segment-' + i) as HTMLElement)
        el.innerHTML = svg
        el.style.width = `${(to - from) * settings.pixelsPerSecond}px`
      })
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
  max-width 100vw
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

.waveform-outer
  .scrollbar
    position absolute
    z-index 1
    width 100%
    height 60px
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
