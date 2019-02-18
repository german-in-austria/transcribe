<template>
  <div>
    <div class="outer">
      <input
        type="text"
        ref="input"
        :value="searchTerm"
        @keydown.esc="handleEsc"
        @keydown.enter.exact="findNext"
        @keydown.enter.shift.exact="findPrevious"
        @keydown.enter.meta.exact="playEvent"
        @keydown.enter.ctrl.exact="playEvent"
        @input="handleSearch"
        @focus="focussed = true"
        @blur="focussed = false"
        placeholder="Search…"
      />
      <v-card tab-index="-1" class="context-menu">
        <v-list class="context-menu-list" dense>
          <v-list-tile disabled>
            <v-list-tile-avatar />
            <v-list-tile-title v-if="selectedResultIndex !== null">
              {{ selectedResultIndex }} of {{ eventStore.searchResults.length }} result(s)
            </v-list-tile-title>
            <v-list-tile-title v-else>
              {{ eventStore.searchResults.length }} result(s)
            </v-list-tile-title>
          </v-list-tile>
          <v-divider />
          <v-list-tile @click.prevent.stop="useRegEx = !useRegEx">
            <v-list-tile-avatar>
              <v-icon v-if="useRegEx">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>
              Use RegEx
            </v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click.prevent.stop="caseSensitive = !caseSensitive">
            <v-list-tile-avatar>
              <v-icon v-if="caseSensitive">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-title>
              Case-Sensitive
            </v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-card>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
// tslint:disable-next-line:max-line-length
import {
  findNextSegmentAt,
  findPreviousSegmentAt,
  findSegmentById,
  eventStore,
  LocalTranscriptEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  selectEvent,
  playEvent,
  toTime
} from '@store/transcript'

@Component
export default class Search extends Vue {

  focussed = false
  searchTerm = ''
  eventStore = eventStore
  toTime = toTime
  isMenuShown = false
  caseSensitive = true
  useRegEx = false

  playEvent() {
    const i = findSegmentById(eventStore.selectedEventIds[0])
    playEvent(eventStore.events[i])
  }

  get selectedResultIndex() {
    if (eventStore.selectedEventIds.length !== 1) {
      return null
    } else {
      const eId = eventStore.selectedEventIds[0]
      const i = _(eventStore.searchResults).findIndex((e) => e.eventId === eId)
      if (i > -1) {
        return i + 1
      } else {
        return null
      }
    }
  }

  showMenu() {
    if (this.focussed) {
      this.isMenuShown = true
    }
  }
  hideMenu() {
    this.isMenuShown = false
  }

  handleSearch(e: Event) {
    this.searchTerm = (e.target as any).value
    if (this.searchTerm === '') {
      this.eventStore.searchResults = []
    } else {
      console.time('search took')
      requestAnimationFrame(() => {
        const r = _(eventStore.events)
          .filter((v) => {
            return _(v.speakerEvents).filter((se) => {
              if (this.caseSensitive) {
                return _(se.tokens)
                  .map(t => t.tiers.default.text).value()
                  .join(' ')
                  .indexOf(this.searchTerm) > -1
              } else {
                return _(se.tokens)
                  .map(t => t.tiers.default.text).value()
                  .join(' ')
                  .toLowerCase()
                  .indexOf(this.searchTerm.toLowerCase()) > -1
              }
            }).value().length
          })
          .value()
        console.timeEnd('search took')
        this.eventStore.searchResults = r
      })
    }
  }
  handleEsc() {
    if (this.searchTerm !== '') {
      this.searchTerm = ''
      this.eventStore.searchResults = []
    } else {
      (this.$refs.input as any).blur()
    }
  }
  goToResult(e: LocalTranscriptEvent|undefined) {
    if (e !== undefined) {
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
      selectEvent(e)
    }
  }
  findNext() {
    const selectedEvent = eventStore.events[findSegmentById(eventStore.selectedEventIds[0])]
    const e = findNextSegmentAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
    if (e) {
      this.goToResult(e)
    } else {
      this.goToResult(_(eventStore.searchResults).first())
    }
  }
  findPrevious() {
    const selectedEvent = eventStore.events[findSegmentById(eventStore.selectedEventIds[0])]
    const e = findPreviousSegmentAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
    if (e) {
      this.goToResult(e)
    } else {
      this.goToResult(_(eventStore.searchResults).last())
    }
  }
}
</script>
<style lang="stylus" scoped>

.outer
  position relative
  margin-right 12px
  &:focus-within .context-menu
    display block
  &:focus-within input
    width 200px
input
  background rgba(255,255,255,.1)
  transition .25s width
  height 32px
  width 78px
  padding 0 10px
  border-radius 5px
  outline 0

.context-menu
  top 100%
  margin-top 3px
  position absolute
  display none
  width 100%
  outline 0
</style>

