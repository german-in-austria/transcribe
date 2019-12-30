<template>
  <div :class="['search-results-container', settings.darkMode === true && 'theme--dark']">
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
  isEventSelected,
  selectEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  findEventIndexById,
  playEvent,
  LocalTranscriptEvent,
  selectSearchResult
} from '../store/transcript'
import settings from '../store/settings'
import * as _ from 'lodash'

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
  isEventSelected = isEventSelected
  settings = settings

  handleDoubleClick(ev: MouseEvent) {
    const eventId = ev.toElement.getAttribute('data-event-id')
    if (eventId !== null) {
      const i = findEventIndexById(Number(eventId))
      const e = eventStore.events[i]
      playEvent(e)
    }
  }

  handleResultMouseOver(ev: MouseEvent) {
    const eventId = ev.toElement.getAttribute('data-event-id')
    if (eventId !== null) {
      const i = findEventIndexById(Number(eventId))
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
      const i = findEventIndexById(Number(eventId))
      const e = eventStore.events[i]
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
      selectEvent(e)
    }
  }

  getPercentageOffset(t: number) {
    return t / eventStore.audioElement.duration * 100
  }

  @Watch('eventStore.selectedSearchResult')
  onSelectedSearchResultChange() {
    if (eventStore.selectedSearchResult !== null && eventStore.searchResults.length > 0) {
      const c = this.$refs.resultContainer
      if (c instanceof HTMLElement) {
        const oldRes = c.querySelector('.result-selected')
        if (oldRes) {
          oldRes.classList.remove('result-selected')
        }
        const res = c.querySelector(`[data-event-id="${ eventStore.selectedSearchResult.event.eventId }"]`)
        if (res) {
          res.classList.add('result-selected')
        }
      }
    }
  }

  @Watch('eventStore.searchResults')
  onResultsChange() {
    const t = eventStore.searchTerm
    const c = this.$refs.resultContainer
    const resHtml = eventStore.searchResults.map((r, i, l) => {
      const left = this.getPercentageOffset(r.event.startTime)
      return `<div
        data-event-id="${r.event.eventId}"
        class="result-overview"
        style="left: ${ left }%">
      </div>`
    })
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
  position relative
  .search-results-outer
    transition .3s opacity
    &.loading
      opacity .2
  .result-overview
    width 7px
    height 14px
    position absolute
    border-radius 0
    top 0
    border-left 1px solid cornflowerblue
    opacity .5
    &.result-selected, &:hover
      z-index 1
      opacity 1
      border-left-color #fb7676
    &.result-selected
      width 1px
      border-width 2px
      box-shadow 0 0 30px white

</style>
