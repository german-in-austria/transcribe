<template>
  <v-layout fill-height column>
    <v-flex shrink class="pl-3 pr-3">
      <v-subheader class="pa-0">
        <small>Search & Replace</small>
      </v-subheader>
      <input
        v-rt-ipa="false"
        type="text"
        ref="input"
        :class="[settings.darkMode && 'theme--dark']"
        :value="eventStore.searchTerm"
        :style="{ color: useRegEx && !isValidRegex ? 'red' : undefined }"
        @keydown.esc.exact="handleEsc"
        @keydown.enter.exact.stop="findNext"
        @keydown.enter.shift.exact.stop="findPrevious"
        @input="(e) => handleSearch(e.target.value)"
        @focus="onFocus"
        @blur="onBlur"
        placeholder="Search…"/>
      <div style="line-height: 1.8em;" :class="['small pt-3 pl-1 pr-1 grey--text', !settings.darkMode && 'text--darken-2']">
        <checkbox :disabled="useRegEx" :value="caseSensitive || useRegEx" @input="caseSensitive = $event" label="Case Sensitive" />
        <checkbox v-model="useRegEx" label="Regular Expression" />
        <v-menu
          close-delay="500"
          transition="fade-transition"
          :close-on-content-click="false"
          bottom
          offset-y
          nudge-bottom="5">
          <div slot="activator" class="tier-and-speaker-selector mt-1">
            <!-- TODO: make nicer -->
            ▾ {{
              areAllSpeakersSelected()
                ? 'all speakers'
                : Object.values(eventStore.metadata.speakers).filter(s => s.searchInSpeaker === true).length + ' speaker(s)'
            }},
            {{
              areAllTiersSelected()
                ? 'all tiers'
                : eventStore.metadata.tiers.filter(s => s.searchInTier === true).length + ' tier(s)'
            }}
          </div>
          <v-list class="context-menu-list" dense>
            <v-subheader>
              Tiers
            </v-subheader>
            <v-list-tile
              v-for="(tier, i) in eventStore.metadata.tiers"
              :key="i"
              @click="tier.searchInTier = !tier.searchInTier">
              <v-list-tile-avatar>
                <v-icon v-if="tier.searchInTier === true">check</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{ tier.name }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <v-divider />
            <v-subheader>
              Speakers
            </v-subheader>
            <v-list-tile
              v-for="(speaker, speakerKey) in eventStore.metadata.speakers"
              :key="speakerKey"
              @click="speaker.searchInSpeaker = !speaker.searchInSpeaker">
              <v-list-tile-avatar>
                <v-icon v-if="speaker.searchInSpeaker === true">check</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{ speaker.ka }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-menu>
        <v-divider class="mt-3" />
      </div>
    </v-flex>
    <v-list class="flex pb-0" style="flex: 1 0; overflow: hidden;" dense>
      <RecycleScroller
        class="scroller"
        :items="eventStore.searchResults"
        key-field="resultId"
        :item-size="40">
        <template v-slot="{ item }">
          <v-list-tile
            @click="showEventIfExists(item.event)"
            @dblclick="playEvent(item.event)"
            :class="isEventSelected(item.event.eventId) && 'selected'">
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
          {{ eventStore.searchResults.length }} results in {{ searchResultEventCounter }} events
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
  isEventSelected,
  playEvent,
  eventStore,
  LocalTranscriptEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  selectEvent,
  toTime,
  LocalTranscriptToken,
  selectSearchResult,
  TokenTierType,
  LocalTranscriptTier,
  SearchResult,
  getSelectedEvent,
  LocalTranscriptSpeakers
} from '../store/transcript'

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
  searchResultEventCounter = 0
  isEventSelected = isEventSelected
  playEvent = playEvent

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

  areAllTiersSelected(): boolean {
    return eventStore.metadata.tiers.every(t => t.searchInTier === true)
  }

  areAllSpeakersSelected(): boolean {
    return _.every(eventStore.metadata.speakers, s => s.searchInSpeaker === true)
  }

  get searchSettings() {
    return {
      caseSensitive: this.caseSensitive,
      useRegEx: this.useRegEx,
      defaultTierOnly: this.defaultTierOnly,
      searchInSpeakers: eventStore.metadata.speakers,
      searchInTiers: eventStore.metadata.tiers
    }
  }

  @Watch('searchSettings', { deep: true })
  onUpdateSearchSettings() {
    this.handleSearch(eventStore.searchTerm)
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
      const i = _(eventStore.searchResults).findIndex((e) => e.event.eventId === eId)
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
    console.log({ speakerIds, tiers })
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
          // TODO: findMatch()
          for (const tier of tiers) {
            // search event tiers
            if (e.speakerEvents[speakerId].speakerEventTiers[tier.id] !== undefined) {
              const s = (e.speakerEvents[speakerId].speakerEventTiers[tier.id] || { text: '' }).text
              // regex
              if (this.useRegEx && this.isValidRegex && regex !== null) {
                const match = regex.exec(s)
                if (match !== null) {
                  index = match.index
                  offsetEnd = index + match[0].length
                }
              // case insensitive
              } else if (this.caseSensitive === false) {
                index = s.toLocaleLowerCase().indexOf(term.toLocaleLowerCase())
                offsetEnd = index + termLength
              // normal
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
                index = -1
              }
            // search token tiers
            } else if (tier.type === 'token') {
              const s = e.speakerEvents[speakerId].tokens.map(t => t.tiers[tier.id].text).join(' ')
              // regex
              if (this.useRegEx && this.isValidRegex && regex !== null) {
                const match = regex.exec(s)
                if (match !== null) {
                  index = match.index
                  offsetEnd = index + match[0].length
                }
              // case insensitive
              } else if (this.caseSensitive === false) {
                index = s.toLocaleLowerCase().indexOf(term.toLocaleLowerCase())
                offsetEnd = index + termLength
              // normal
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
                index = -1
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
    this.handleSearch(eventStore.searchTerm)
  }

  handleSearch(term: string) {
    eventStore.searchTerm = term
    if (eventStore.searchTerm === '') {
      eventStore.searchResults = []
    } else {
      const search = this.caseSensitive ? term : term.toLowerCase()
      let regex: RegExp|null = null
      try {
        regex = new RegExp(search)
      } catch (e) {
        // it failed.
      }
      window.requestIdleCallback(() => {
        eventStore.searchResults = this.searchEvents(
          term,
          eventStore.events,
          _(eventStore.metadata.speakers)
            .pickBy(s => s.searchInSpeaker === true)
            .map((s, k) => String(k)).value(),
          eventStore.metadata.tiers.filter(t => t.searchInTier === true)
        )
      })
    }
  }

  get isValidRegex() {
    try {
      const y = new RegExp(eventStore.searchTerm)
      return true
    } catch (e) {
      return false
    }
  }

  handleEsc() {
    if (eventStore.searchTerm !== '') {
      eventStore.searchTerm = ''
      eventStore.searchResults = []
    } else {
      (this.$refs.input as any).blur()
    }
  }
  goToResult(e: LocalTranscriptEvent) {
    if (e !== undefined) {
      scrollToTranscriptEvent(e)
      scrollToAudioEvent(e)
      selectEvent(e)
    }
  }
  findNext() {
    const selectedEvent = getSelectedEvent()
    const e = findNextEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults.map(r => r.event))
    if (e !== undefined) {
      this.goToResult(e)
    } else if (eventStore.searchResults.length > 0) {
      this.goToResult(eventStore.searchResults[0].event)
    }
  }
  findPrevious() {
    const selectedEvent = getSelectedEvent()
    const e = findPreviousEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults.map(r => r.event))
    if (e !== undefined) {
      this.goToResult(e)
    } else if (eventStore.searchResults.length > 0) {
      this.goToResult(_(eventStore.searchResults).last()!.event)
    }
  }
}
</script>
<style lang="stylus" scoped>

@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.tier-and-speaker-selector
  background rgba(255, 255, 255, .7)
  border-radius 4px
  padding 0 1em

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

.selected
  background rgba(0,0,0,.05)

</style>

