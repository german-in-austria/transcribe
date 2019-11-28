<template>
  <v-list>
    <v-subheader>
      <small>Search & Replace</small>
    </v-subheader>
    <v-list-tile>
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
        placeholder="Search…"
      />
    </v-list-tile>
    <RecycleScroller
      class="scroller"
      :items="searchResults"
      key-field="eventId"
      :item-size="40">
      <template v-slot="{ item }">
        <v-list-tile @click="showEventIfExists(item.event)">
          <!-- <v-list-tile-avatar>
            <v-icon v-if="item.error_type === 'time_overlap'">mdi-checkbox-multiple-blank-outline</v-icon>
            <v-icon v-if="item.error_type === 'unknown_token'">mdi-help-rhombus-outline</v-icon>
          </v-list-tile-avatar> -->
          <v-list-tile-content>
            <div class="inner" :key="i" v-for="(se, i) in item.event.speakerEvents">
              {{ i }}: {{ se.tokens.map(t => t.tiers[defaultTier].text).join(' ') }}
            </div>
            <v-list-tile-sub-title class="subtitle">{{ toTime(item.event.startTime) }} - {{ toTime(item.event.endTime) }}</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </template>
    </RecycleScroller>
    <!-- <v-card tabindex="-1" class="context-menu blur-background">
      <v-list class="context-menu-list" dense>
        <v-list-tile v-if="useRegEx && !isValidRegex" disabled>
          <v-list-tile-avatar>
            <v-icon>warning</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>
            Invalid Expression
          </v-list-tile-title>
        </v-list-tile>
        <v-list-tile v-else disabled>
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
        <v-list-tile @click.prevent.stop="defaultTierOnly = !defaultTierOnly">
          <v-list-tile-avatar>
            <v-icon v-if="defaultTierOnly">check</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-title>
            Default Tier Only
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-card> -->
  </v-list>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import eventBus from '../service/event-bus'
import settings from '../store/settings'
import { RecycleScroller } from 'vue-virtual-scroller'

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
  selectSearchResult
} from '../store/transcript'

interface SearchResult {
  index: number
  speakerId: string
  tierId: string
  event: LocalTranscriptEvent
}

import * as history from '../store/history'

@Component({
  components: {
    RecycleScroller
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
    es: LocalTranscriptEvent,
    speakerIds: string[],
    tierIds: number[]
  ): SearchResult[] {
    const r = eventStore.events.reduce((res, e, i) => {
      let index: number|null = null
      let speakers: string[] = []
      // tslint:disable-next-line:forin
      for (const speakerId in e.speakerEvents) {
        // const allTierTexts = e.speakerEvents[speakerId].tokens.map(t => t.)
        // tslint:disable-next-line:forin
        for (const tier of eventStore.metadata.tiers) {
          if (tier.type === 'token') {
            const s = e.speakerEvents[speakerId].tokens.map(t => t.tiers[tier.id].text).join(' ')
            index = s.indexOf(term)
            if (index > -1) {
              speakers.push(speakerId)
            }
          } else if (tier.type === 'freeText') {
            const s = (e.speakerEvents[speakerId].speakerEventTiers[tier.id] || { text: '' }).text
            index = s.indexOf(term)
            if (index > -1) {
              speakers.push(speakerId)
            }
          }
        }
      }
      if (index > -1) {
        res.push({
          index,
          speakerId: speakers[0]
        })
      }
      const ses = _(e.speakerEvents).filter((se, speakerId) => {
        let s =
          se.tokens.map(this.getDefaultOrAllTokenText).join(' ')
          + '|||'
          + _(se.speakerEventTiers).map(t => t.text).join(' ')
        if (!this.caseSensitive) {
          s = s.toLowerCase()
        }
        if (this.useRegEx && this.isValidRegex && regex !== null) {
          return regex.test(s)
        } else {
          index = s.indexOf(search)
          return index > -1
        }
      }).value()
      if (index !== null) {
        res.push({
          index,
          speakerId: 1,
          tierId: '',
          event: e
        })
      }
      return res
    }, [] as SearchResult[])
    return r
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
      requestAnimationFrame(() => {
        const r = eventStore.events.reduce((res, e, i) => {
          let index: number|null = null
          // tslint:disable-next-line:forin
          for (const speakerId in e.speakerEvents) {
            // const allTierTexts = e.speakerEvents[speakerId].tokens.map(t => t.)
            // tslint:disable-next-line:forin
            for (const tier of eventStore.metadata.tiers) {
              if (tier.type === 'token') {
                const s = e.speakerEvents[speakerId].tokens.map(t => t.tiers[tier.id].text).join(' ')
                index = s.indexOf(search)
              } else if (tier.type === 'freeText') {
                const s = (e.speakerEvents[speakerId].speakerEventTiers[tier.id] || { text: '' }).text
                index = s.indexOf(search)
              }
            }
          }
          const ses = _(e.speakerEvents).filter((se, speakerId) => {
            let s =
              se.tokens.map(this.getDefaultOrAllTokenText).join(' ')
              + '|||'
              + _(se.speakerEventTiers).map(t => t.text).join(' ')
            if (!this.caseSensitive) {
              s = s.toLowerCase()
            }
            if (this.useRegEx && this.isValidRegex && regex !== null) {
              return regex.test(s)
            } else {
              index = s.indexOf(search)
              return index > -1
            }
          }).value()
          if (index !== null) {
            res.push({
              index,
              speakerId: 1,
              tierId: '',
              event: e
            })
          }
          return res
        }, [] as SearchResult[])
        this.searchResults = r
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
  height calc(100% - 40px)

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

.context-menu
  top 100%
  margin-top 3px
  position absolute
  display none
  width 100%
  outline 0
  z-index 1
</style>

