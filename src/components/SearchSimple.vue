<template>
  <div>
    <!-- <div class="outer">
      <input
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
        placeholder="Search…"
      />
      <v-card tabindex="-1" class="context-menu blur-background">
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
      </v-card>
    </div> -->
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import eventBus from '../service/event-bus'
import settings from '../store/settings'

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
import * as history from '../store/history';

@Component
export default class Search extends Vue {

  // defaultTier = eventStore.metadata.defaultTier
  // settings = settings
  // focused = false
  // eventStore = eventStore
  // toTime = toTime
  // isMenuShown = false
  // caseSensitive = false
  // useRegEx = false
  // defaultTierOnly = false

  // mounted() {
  // }

  // onFocus() {
  //   this.focused = true
  //   history.stopListening()
  // }

  // onBlur() {
  //   this.focused = false
  //   history.startListening()
  // }

  // get searchSettings() {
  //   return {
  //     caseSensitive: this.caseSensitive,
  //     useRegEx: this.useRegEx,
  //     defaultTierOnly: this.defaultTierOnly
  //   }
  // }

  // @Watch('searchSettings')
  // onUpdateSearchSettings() {
  //   this.handleSearch(eventStore.searchTerm)
  // }

  // get selectedResultIndex(): number|null {
  //   if (eventStore.selectedEventIds.length !== 1) {
  //     return null
  //   } else {
  //     const eId = eventStore.selectedEventIds[0]
  //     const i = _(eventStore.searchResults).findIndex((e) => e.event.eventId === eId)
  //     if (i > -1) {
  //       return i + 1
  //     } else {
  //       return null
  //     }
  //   }
  // }

  // showMenu() {
  //   if (this.focused) {
  //     this.isMenuShown = true
  //   }
  // }
  // hideMenu() {
  //   this.isMenuShown = false
  // }

  // getDefaultOrAllTokenText(t: LocalTranscriptToken) {
  //   if (this.defaultTierOnly) {
  //     return t.tiers[this.defaultTier].text
  //   } else {
  //     return _(t.tiers).map(tier => tier.text).value().join(' ')
  //   }
  // }

  // handleSearch(term: string) {
  //   eventStore.searchTerm = term
  //   if (eventStore.searchTerm === '') {
  //     this.eventStore.searchResults = []
  //   } else {
  //     const search = this.caseSensitive ? term : term.toLowerCase()
  //     let regex: RegExp|null = null
  //     try {
  //       regex = new RegExp(search)
  //     } catch (e) {
  //       // it failed.
  //     }
  //     requestAnimationFrame(() => {
  //       const r = eventStore.events.filter((v) => {
  //         return _(v.speakerEvents).filter((se) => {
  //           let s =
  //             se.tokens.map(this.getDefaultOrAllTokenText).join(' ')
  //             + '|||'
  //             + _(se.speakerEventTiers).map(t => t.text).join(' ')
  //           if (!this.caseSensitive) {
  //             s = s.toLowerCase()
  //           }
  //           if (this.useRegEx && this.isValidRegex && regex !== null) {
  //             return regex.test(s)
  //           } else {
  //             return s.indexOf(search) > -1
  //           }
  //         }).value().length > 0
  //       })
  //       this.eventStore.searchResults = r
  //     })
  //   }
  // }

  // get isValidRegex() {
  //   try {
  //     const y = new RegExp(eventStore.searchTerm)
  //     return true
  //   } catch (e) {
  //     return false
  //   }
  // }

  // handleEsc() {
  //   if (eventStore.searchTerm !== '') {
  //     eventStore.searchTerm = ''
  //     eventStore.searchResults = []
  //   } else {
  //     (this.$refs.input as any).blur()
  //   }
  // }
  // goToResult(e: LocalTranscriptEvent|undefined) {
  //   if (e !== undefined) {
  //     selectSearchResult(e)
  //   }
  // }
  // findNext() {
  //   const selectedEvent = eventStore.events[findEventIndexById(eventStore.selectedEventIds[0])]
  //   const e = findNextEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
  //   if (e !== undefined) {
  //     this.goToResult(e)
  //   } else {
  //     this.goToResult(_(eventStore.searchResults).first())
  //   }
  // }
  // findPrevious() {
  //   const selectedEvent = eventStore.events[findEventIndexById(eventStore.selectedEventIds[0])]
  //   const e = findPreviousEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
  //   if (e !== undefined) {
  //     this.goToResult(e)
  //   } else {
  //     this.goToResult(_(eventStore.searchResults).last())
  //   }
  // }
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
  background rgba(0,0,0,.1)
  transition .25s width
  height 32px
  width 78px
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

