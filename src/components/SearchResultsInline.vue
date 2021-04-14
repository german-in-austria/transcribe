<template>
  <div :class="['search-results-container', settings.darkMode === true && 'theme--dark']">
    <canvas
      @mousemove="onMouseMove"
      @mouseout="hoveredEvent = null"
      @click.prevent.stop="onClick"
      height="10"
      :class="[
        'my-canvas',
        this.squares.length > 0 && 'active'
      ]"
      ref="myCanvas" />
    <v-menu
      absolute
      lazy
      :close-on-click="false"
      top
      nudge-top="5"
      :position-x="menuX"
      :position-y="menuY"
      :value="hoveredEvent !== null">
      <v-card class="pt-2 context-menu blur-background">
        <segment-transcript
          v-if="hoveredEvent !== null"
          :event="hoveredEvent"
        />
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import {
  eventStore,
  selectEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  LocalTranscriptEvent
} from '../store/transcript'
import settings from '../store/settings'

interface Square {
  event: LocalTranscriptEvent
  left: number
  right: number
}

@Component({
  components: {
    SegmentTranscript
  }
})
export default class SearchResults extends Vue {

  menuX = 0
  menuY = 0
  hoveredEvent: LocalTranscriptEvent|null = null
  eventStore = eventStore
  settings = settings
  context: null|CanvasRenderingContext2D = null
  squares: Square[] = []

  mounted() {
    this.context = (this.$refs.myCanvas as HTMLCanvasElement).getContext('2d')
  }

  getSquaresAtPosition(x: number): Square[] {
    return this.squares.filter((s) => x >= s.left && x <= s.right)
  }

  onClick() {
    if (this.hoveredEvent !== null) {
      scrollToAudioEvent(this.hoveredEvent)
      scrollToTranscriptEvent(this.hoveredEvent)
      selectEvent(this.hoveredEvent)
    }
  }

  onMouseMove(e: MouseEvent) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const squares = this.getSquaresAtPosition(x)
    if (squares.length > 0) {
      this.menuX = squares[0].left
      this.menuY = rect.y
      this.hoveredEvent = squares[0].event
    }
  }

  drawResults() {
    this.squares = []
    if (this.context !== null) {
      const width = this.$el.clientWidth
      const duration = eventStore.audioElement.duration
      // setting the width clears the canvas.
      this.context.canvas.width = width
      // batched drawing setup
      this.context.beginPath()
      this.context.fillStyle = 'yellow'
      for (const r of eventStore.searchResults) {
        const left = (((r.event.startTime / duration) * width) + .5) | 0
        // draw the rectangle
        this.context.rect(left, 0, 3, 10)
        this.squares.push({
          event: r.event,
          left: left,
          right: left + 3
        })
      }
      this.context.fill()
    }
  }

  @Watch('eventStore.searchResults')
  onResultsChange() {
    this.drawResults()
  }
}
</script>
<style lang="stylus">
.search-results-container
  position relative
.my-canvas
  border-radius 3px
  &.active
    background rgba(255,255,255,.1)
</style>
