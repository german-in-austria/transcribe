<template>
  <v-layout fill-height column>
    <v-flex shrink class="pl-3 pr-3">
      <v-subheader class="pa-0">
        <small>Search</small>
      </v-subheader>
      <input
        v-rt-ipa="{ show: true, directionV: 'bottom', maxWidth: 310 }"
        type="text"
        ref="input"
        :class="[settings.darkMode && 'theme--dark']"
        :value="eventStore.searchTerm"
        :style="{ color: useRegEx && !isValidRegex ? 'red' : undefined }"
        @keydown.enter.exact.stop="findNext"
        @keydown.enter.shift.exact.stop="findPrevious"
        @input="(e) => { eventStore.searchTerm = e.target.value; debouncedHandleSearch(e.target.value) }"
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
          <div slot="activator" :class="['tier-and-speaker-selector mt-1', settings.darkMode && 'theme--dark']">
            ▾ <span v-if="areAllSpeakersSelected()">all speakers</span>
              <span v-else>{{ getSelectedSpeakersLength() }} speaker{{ getSelectedSpeakersLength() !== 1 ? 's' : '' }}</span>,
              <span v-if="areAllTiersSelected()">all tiers</span>
              <span v-else>{{  getSelectedTiersLength() }} tier{{ getSelectedTiersLength() !== 1 ? 's' : '' }}</span>
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
        ref="resultScroller"
        :items="eventStore.searchResults"
        key-field="resultId"
        :item-size="resultItemHeight">
        <template v-slot="{ item }">
          <v-list-tile
            @click="showEventIfExists(item.event)"
            @dblclick="playEvent(item.event)"
            :class="isEventSelected(item.event.eventId) && 'search-result-selected'">
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
      <v-layout>
        <v-flex :class="['small grey--text text-xs-center mb-3 mt-3', !settings.darkMode && 'text--darken-2' ]">
          {{ eventStore.searchResults.length }} results in {{ searchResultEventCounter }} events
        </v-flex>
        <v-flex class="text-xs-right">
          <v-btn
            @click="exportResultsExcel(eventStore.searchResults)"
            :disabled="eventStore.searchResults.length === 0"
            class="elevation-0 text-lowercase mt-2"
            small>
            export
          </v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import eventBus from '../service/event-bus'
import * as history from '../store/history'
import { createMediaFragmentUrl } from '../service/audio'
import settings, { tokenTypesPresets } from '../store/settings'
import { RecycleScroller } from 'vue-virtual-scroller'
import HighlightRange from './helper/HighlightRange.vue'
import Checkbox from './helper/Checkbox.vue'
import * as xlsx from 'xlsx'

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
  LocalTranscriptSpeakers,
  getTokenIndexByCharacterOffset,
  getPreviousEvent,
  getTextFromTokens,
  findPreviousSpeakerEvent,
  findNextSpeakerEvent,
  getNextEvent,
  getTextFromTier,
  isTokenTier
} from '../store/transcript'

function maybe<T>(a: T): T|{} {
  if (a === undefined) {
    return {} as T
  } else {
    return a
  }
}

@Component({
  components: {
    RecycleScroller,
    HighlightRange,
    Checkbox
  }
})
export default class Search extends Vue {

  settings = settings
  eventStore = eventStore
  toTime = toTime

  resultItemHeight = 40
  caseSensitive = false
  useRegEx = false
  showIpaKeyboard = false

  searchResultEventCounter = 0
  isEventSelected = isEventSelected
  playEvent = playEvent

  debouncedHandleSearch = _.debounce(this.handleSearch, 200)

  mounted() {
    eventBus.$on('focusSearch', () => {
      if (this.$refs.input instanceof HTMLInputElement) {
        this.$refs.input.focus()
        this.$refs.input.select()
      }
    })
  }

  onFocus() {
    history.stopListening()
  }

  onBlur() {
    history.startListening()
  }

  getSelectedSpeakersLength(): number {
    return _.filter(eventStore.metadata.speakers, s => s.searchInSpeaker === true).length
  }

  getSelectedTiersLength(): number {
    return eventStore.metadata.tiers.filter(s => s.searchInTier === true).length
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

  async exportResultsExcel(ress: SearchResult[]) {
    const rows = ress.map(res => {
      let matched = ''
      let tokenType = ''
      if (isTokenTier(res.tierId)) {
        const tokenIndex = getTokenIndexByCharacterOffset(res.event.speakerEvents[res.speakerId].tokens, res.offset)
        // tslint:disable-next-line:max-line-length
        const token = res.event.speakerEvents[res.speakerId].tokens[tokenIndex].tiers[res.tierId as TokenTierType] || { type: null, text: '' }
        const t = tokenTypesPresets[settings.tokenTypesPreset].find(tt => tt.id === token.type)
        if (t !== undefined) {
          tokenType = t.name
        }
        matched = token.text
      } else {
        matched = getTextFromTier(res.event, res.tierId, res.speakerId)
      }
      const prev = getPreviousEvent(res.event.eventId)
      const next = getNextEvent(res.event.eventId)
      return {
        transcript_name: eventStore.metadata.transcriptName,
        transcript_setting: '',
        speaker_name: eventStore.metadata.speakers[Number(res.speakerId)].k,
        tier_name: res.tierId,
        matched_token: matched,
        token_type: tokenType,
        left_context: prev !== undefined ? getTextFromTier(prev, res.tierId, res.speakerId) : '',
        content: res.text,
        right_context: next !== undefined ? getTextFromTier(next, res.tierId, res.speakerId) : '',
        event_audio: createMediaFragmentUrl(eventStore.metadata.audioUrl as string, res.event)
      }
    })
    const sheet = xlsx.utils.json_to_sheet(rows)
    const file = xlsx.writeFile(
      { Sheets: { sheet }, SheetNames: [ 'sheet' ], },
      eventStore.metadata.transcriptName
      + '_search_'
      + eventStore.searchTerm.replace(/[^a-z0-9]/gi, '_')
      + '.xlsx'
    )
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
    return r
  }

  @Watch('eventStore.events')
  onUpdateEvents(newEvents: LocalTranscriptEvent[]) {
    this.handleSearch(eventStore.searchTerm)
  }

  handleSearch(term: string) {
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

  scrollToSearchResult(e: LocalTranscriptEvent) {
    const i = eventStore.searchResults.findIndex(r => r.event.eventId === e.eventId)
    const offset = i * this.resultItemHeight
    requestAnimationFrame(() => {
      const s = this.$el.querySelector('.scroller')
      if (s instanceof HTMLElement) {
        s.scrollTop = offset
      }
    })
  }

  async goToResult(e: LocalTranscriptEvent|undefined) {
    if (e !== undefined) {
      scrollToTranscriptEvent(e)
      scrollToAudioEvent(e)
      selectEvent(e)
      this.scrollToSearchResult(e)
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
  &.theme--dark
    background #333

.scroller
  height 100%
  scroll-behavior smooth

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

.search-result-selected
  background rgba(0,0,0,.05)

</style>

