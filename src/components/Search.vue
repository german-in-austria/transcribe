<template>
  <v-layout fill-height column>
    <v-flex shrink class="pl-3 pr-3">
      <v-subheader class="pa-0">
        <small>Search & Replace</small>
      </v-subheader>
      <input
        v-rt-ipa="true"
        type="text"
        ref="input"
        :class="[settings.darkMode && 'theme--dark']"
        :value="searchTerm"
        :style="{ color: useRegEx && !isValidRegex ? 'red' : undefined }"
        @keydown.esc.exact="handleEsc"
        @keydown.enter.exact.stop="findNext"
        @keydown.enter.shift.exact.stop="findPrevious"
        @input="(e) => handleSearch(e.target.value)"
        @focus="onFocus"
        @blur="onBlur"
        placeholder="Search…"/>
      <div style="line-height: 1.8em;" :class="['small pt-3 pl-1 pr-1 grey--text', !settings.darkMode && 'text--darken-2']">
        <checkbox v-model="caseSensitive" label="Case Sensitive" />
        <checkbox v-model="useRegEx" label="Use Regular Expression" />
        <v-divider class="mt-3" />
      </div>
    </v-flex>
    <v-list class="flex pb-0" style="flex: 1 0;" dense>
      <RecycleScroller
        class="scroller"
        :items="searchResults"
        key-field="resultId"
        :item-size="40">
        <template v-slot="{ item }">
          <v-list-tile @click="showEventIfExists(item.event)">
            <v-list-tile-content>
              <v-list-tile-sub-title class="subtitle">{{ toTime(item.event.startTime) }} - {{ toTime(item.event.endTime) }}</v-list-tile-sub-title>
              <highlight-range :text="item.text" :start="item.offset" :end="item.offsetEnd" :truncate="42" />
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </RecycleScroller>
    </v-list>
    <v-flex class="pl-3 pr-3" shrink>
      <v-divider />
      <div :class="['small grey--text text-xs-center mb-3 mt-3', !settings.darkMode && 'text--darken-2' ]">
        <span>
          {{ searchResults.length }} results in {{ searchResultEventCounter }} events
        </span>
      </div>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import eventBus from '../service/event-bus'
import settings from '../store/settings'
import { RecycleScroller } from 'vue-virtual-scroller'
import HighlightRange from './helper/HighlightRange.vue'
import Checkbox from './helper/Checkbox.vue'

import {
  findNextEventAt,
  findPreviousEventAt,
  findEventIndexById,
  eventStore,
  LocalTranscriptEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  selectEvent,
  toTime,
  LocalTranscriptToken,
  selectSearchResult,
  TokenTierType,
  LocalTranscriptTier
} from '../store/transcript'

interface SearchResult {
  resultId: number
  offset: number
  offsetEnd: number
  text: string
  speakerId: string
  tierId: string
  event: LocalTranscriptEvent
}

import * as history from '../store/history'

@Component({
  components: {
    RecycleScroller,
    HighlightRange,
    Checkbox
  }
})
export default class Search extends Vue {

  defaultTier = eventStore.metadata.defaultTier
  settings = settings
  focused = false
  eventStore = eventStore
  toTime = toTime
  isMenuShown = false
  caseSensitive = false
  useRegEx = false
  defaultTierOnly = false
  searchTerm = ''
  searchResultEventCounter = 0
  searchResults: SearchResult[] = []

  mounted() {
    eventBus.$on('focusSearch', () => {
      (this.$refs.input as HTMLInputElement).focus();
      (this.$refs.input as HTMLInputElement).select();
    })
  }

  onFocus() {
    this.focused = true
    history.stopListening()
  }

  onBlur() {
    this.focused = false
    history.startListening()
  }

  get searchSettings() {
    return {
      caseSensitive: this.caseSensitive,
      useRegEx: this.useRegEx,
      defaultTierOnly: this.defaultTierOnly
    }
  }

  @Watch('searchSettings')
  onUpdateSearchSettings() {
    this.handleSearch(this.searchTerm)
  }

  showEventIfExists(e: LocalTranscriptEvent) {
    const i = findEventIndexById(e.eventId)
    if (i > -1) {
      selectEvent(e)
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }

  get selectedResultIndex(): number|null {
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

  getDefaultOrAllTokenText(t: LocalTranscriptToken) {
    if (this.defaultTierOnly) {
      return t.tiers[this.defaultTier].text
    } else {
      return _(t.tiers).map(tier => tier.text).value().join(' ')
    }
  }

  searchEvents(
    term: string,
    es: LocalTranscriptEvent[],
    speakerIds: string[],
    tiers: LocalTranscriptTier[]
  ): SearchResult[] {
    this.searchResultEventCounter = 0
    const termLength = term.length
    let resultId = 0
    let regex: RegExp|null = null
    try {
      regex = new RegExp(term)
    } catch (e) {
      // it failed.
      return []
    }
    const r = es.reduce((res, e, i) => {
      let index = -1
      let offsetEnd = -1
      // tslint:disable-next-line:forin
      for (const speakerId of speakerIds) {
        if (e.speakerEvents[speakerId] !== undefined) {
          for (const tier of tiers) {
            // search event tiers
            if (e.speakerEvents[speakerId].speakerEventTiers[tier.id] !== undefined) {
              const s = (e.speakerEvents[speakerId].speakerEventTiers[tier.id] || { text: '' }).text
              if (this.useRegEx && this.isValidRegex && regex !== null) {
                const match = regex.exec(s)
                if (match !== null) {
                  index = match.index
                  offsetEnd = index + match[0].length
                }
              } else {
                index = s.indexOf(term)
                offsetEnd = index + termLength
              }
              if (index > -1) {
                resultId = resultId + 1
                res.push({
                  resultId,
                  offset: index,
                  offsetEnd,
                  text: s,
                  speakerId,
                  tierId: tier.id,
                  event: e
                })
              }
            } else if (tier.type === 'token') {
              const s = e.speakerEvents[speakerId].tokens.map(t => t.tiers[tier.id].text).join(' ')
              if (this.useRegEx && this.isValidRegex && regex !== null) {
                const match = regex.exec(s)
                if (match !== null) {
                  index = match.index
                  offsetEnd = index + match[0].length
                }
              } else {
                index = s.indexOf(term)
                offsetEnd = index + termLength
              }
              resultId = resultId + 1
              if (index > -1) {
                res.push({
                  resultId,
                  offset: index,
                  offsetEnd,
                  text: s,
                  speakerId,
                  tierId: tier.id,
                  event: e
                })
              }
            }
          }
        }
      }
      if (index !== -1) {
        this.searchResultEventCounter = this.searchResultEventCounter + 1
      }
      return res
    }, [] as SearchResult[])
    console.log({r})
    return r
  }

  @Watch('eventStore.events')
  onUpdateEvents(newEvents: LocalTranscriptEvent[]) {
    this.handleSearch(this.searchTerm)
  }

  handleSearch(term: string) {
    this.searchTerm = term
    if (this.searchTerm === '') {
      this.searchResults = []
    } else {
      const search = this.caseSensitive ? term : term.toLowerCase()
      let regex: RegExp|null = null
      try {
        regex = new RegExp(search)
      } catch (e) {
        // it failed.
      }
      window.requestIdleCallback(() => {
        this.searchResults = this.searchEvents(
          term,
          eventStore.events,
          _(eventStore.metadata.speakers).map((s, k) => k).value(),
          eventStore.metadata.tiers
        )
      })
    }
  }

  get isValidRegex() {
    try {
      const y = new RegExp(this.searchTerm)
      return true
    } catch (e) {
      return false
    }
  }

  handleEsc() {
    if (this.searchTerm !== '') {
      this.searchTerm = ''
      this.searchResults = []
    } else {
      (this.$refs.input as any).blur()
    }
  }
  goToResult(e: LocalTranscriptEvent|undefined) {
    if (e !== undefined) {
      selectSearchResult(e)
    }
  }
  findNext() {
    const selectedEvent = eventStore.events[findEventIndexById(eventStore.selectedEventIds[0])]
    const e = findNextEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
    if (e !== undefined) {
      this.goToResult(e)
    } else {
      this.goToResult(_(eventStore.searchResults).first())
    }
  }
  findPrevious() {
    const selectedEvent = eventStore.events[findEventIndexById(eventStore.selectedEventIds[0])]
    const e = findPreviousEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
    if (e !== undefined) {
      this.goToResult(e)
    } else {
      this.goToResult(_(eventStore.searchResults).last())
    }
  }
}
</script>
<style lang="stylus" scoped>

@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.scroller
  height 100%

.outer
  position relative
  margin-right 12px

input
  background rgba(0,0,0,.1)
  transition .25s width
  height 32px
  width 100%
  padding 0 10px
  border-radius 5px
  outline 0
  &.theme--dark
    background rgba(255,255,255,.1)

.subtitle
  height 13px

.context-menu
  top 100%
  margin-top 3px
  position absolute
  display none
  width 100%
  outline 0
  z-index 1
</style>

