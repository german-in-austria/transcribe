<template>
  <div ref="resultContainer" class="search-results-outer">
</div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore, isEventSelected } from '../store/transcript'
import * as _ from 'lodash'

@Component
export default class SearchResults extends Vue {
  eventStore = eventStore
  isEventSelected = isEventSelected
  @Watch('eventStore.searchResults')
  onResultsChange() {
    const t = eventStore.searchResults.length
    const c = this.$refs.resultContainer
    const resHtml = eventStore.searchResults.map((r) => {
      // tslint:disable-next-line:max-line-length
      return `<div class="result-overview" style="left: ${ r.startTime / eventStore.audioElement.duration * 100}%"></div>`
    })
    if (c instanceof Element) {
      c.classList.add('loading')
      c.innerHTML = ''
      const resHtmlChunked = _.chunk(resHtml, 50)
      const step = (remainingChunks: string[][]) => {
        if (remainingChunks.length > 0 && eventStore.searchResults.length === t) {
          const partHtml = remainingChunks[0].join('')
          c.insertAdjacentHTML('beforeend', partHtml)
          requestAnimationFrame(() => step(_.tail(remainingChunks)))
        } else {
          c.classList.remove('loading')
        }
      }
      step(resHtmlChunked)
    }
    // v-for="(result) in eventStore.searchResults"
    // :key="result.eventId"
    // :class="['result-overview', isEventSelected(result.eventId) && 'result-selected']"
    // :style="{ left: `${ result.startTime / eventStore.audioElement.duration * 100}%` }" />
  }
}
</script>
<style lang="stylus">
.search-results-outer
  transition .2s opacity
  &.loading
    opacity .5
  .result-overview
    background #447720
    width 7px
    height 7px
    position absolute
    border-radius 1px
    top -59px
    // opacity 0
    // animation fadeIn
    // -webkit-animation fadeIn ease-in 1
    // animation-fill-mode forwards
    // -webkit-animation-duration .2s
    // -moz-animation-duration .2s
    // animation-duration .2s
    &.result-selected
      z-index 1
      background #6BBB32
</style>
