<template>
  <div class="search-results-container">
    <div
      v-if="eventStore.selectedSearchResult !== null && eventStore.searchResults.length > 0"
      :style="{left: eventStore.selectedSearchResult.startTime / eventStore.audioElement.duration * 100 + '%'}"
      class="result-overview result-selected"
    />
    <div
      @mouseover="handleResultMouseOver"
      @mouseout="handleResultMouseOut"
      @click="handleResultClick"
      @dblclick="handleDoubleClick"
      class="search-results-outer"
      ref="resultContainer"
    />
    <v-menu
      absolute
      lazy
      top
      nudge-top="5"
      :position-x="menuX"
      :position-y="menuY"
      :value="hoveredEvent !== null">
      <v-card class="pt-2">
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
import segmentTranscript from './SegmentTranscript.vue'
import {
  eventStore,
  isEventSelected,
  selectEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  findEventById,
  playEvent,
  LocalTranscriptEvent,
  selectSearchResult
} from '../store/transcript'
import * as _ from 'lodash'

@Component({
  components: {
    SegmentTranscript: segmentTranscript
  }
})
export default class SearchResults extends Vue {

  menuX = 0
  menuY = 0
  hoveredEvent: LocalTranscriptEvent|null = null
  eventStore = eventStore
  isEventSelected = isEventSelected

  handleDoubleClick(ev: MouseEvent) {
    const eventId = ev.toElement.getAttribute('data-event-id')
    if (eventId !== null) {
      const i = findEventById(Number(eventId))
      const e = eventStore.events[i]
      playEvent(e)
    }
  }

  handleResultMouseOver(ev: MouseEvent) {
    const eventId = ev.toElement.getAttribute('data-event-id')
    if (eventId !== null) {
      const i = findEventById(Number(eventId))
      const e = eventStore.events[i]
      const rect = ev.toElement.getBoundingClientRect()
      this.menuX = rect.left
      this.menuY = rect.top
      this.hoveredEvent = e
    }
  }

  handleResultMouseOut() {
    this.hoveredEvent = null
  }

  handleResultClick(ev: MouseEvent) {
    const eventId = ev.toElement.getAttribute('data-event-id')
    if (eventId !== null) {
      const i = findEventById(Number(eventId))
      const e = eventStore.events[i]
      selectSearchResult(e)
    }
  }

  @Watch('eventStore.searchResults')
  onResultsChange() {
    const t = eventStore.searchTerm
    const c = this.$refs.resultContainer
    const resHtml = eventStore.searchResults.map((r) => `
      <div
        data-event-id="${r.eventId}"
        class="result-overview"
        style="left: ${ r.startTime / eventStore.audioElement.duration * 100}%">
      </div>`
    )
    if (c instanceof Element) {
      c.classList.add('loading')
      c.innerHTML = ''
      const resHtmlChunked = _.chunk(resHtml, 50)
      const step = (remainingChunks: string[][]) => {
        // this should check search terms
        if (remainingChunks.length > 0 && eventStore.searchTerm === t) {
          const partHtml = remainingChunks[0].join('')
          c.insertAdjacentHTML('beforeend', partHtml)
          requestAnimationFrame(() => step(_.tail(remainingChunks)))
        } else {
          c.classList.remove('loading')
        }
      }
      step(resHtmlChunked)
    }
  }
}
</script>
<style lang="stylus">
.search-results-container
  position: relative
  .search-results-outer
    transition .3s opacity
    &.loading
      opacity .2
  .result-overview
    background #447720
    width 7px
    height 7px
    position absolute
    border-radius 1px
    top -59px
    &.result-selected, &:hover
      z-index 1
      background #6BBB32
    &.result-selected
      box-shadow 0 0 30px #6bbb32
</style>
