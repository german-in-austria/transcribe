<template>
  <div>
    <div class="outer">
      <input
        type="text"
        ref="input"
        :value="eventStore.searchTerm"
        :style="{ color: useRegEx && !isValidRegex ? 'red' : undefined }"
        @keydown.esc.exact="handleEsc"
        @keydown.enter.exact="findNext"
        @keydown.enter.shift.exact="findPrevious"
        @keydown.enter.meta.exact="playEvent"
        @keydown.enter.ctrl.exact="playEvent"
        @input="(e) => handleSearch(e.target.value)"
        @focus="onFocus"
        @blur="onBlur"
        placeholder="Search…"
      />
      <v-card tabindex="-1" class="context-menu">
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
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
import { isCmdOrCtrl, isUndoOrRedo } from '../util'
import {
  findNextEventAt,
  findPreviousEventAt,
  findEventById,
  eventStore,
  getSelectedEvent,
  LocalTranscriptEvent,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  selectEvent,
  playEvent,
  toTime,
  LocalTranscriptToken,
  selectSearchResult
} from '../store/transcript'
import { history } from '../store/history';

@Component
export default class Search extends Vue {

  defaultTier = eventStore.metadata.defaultTier
  focused = false
  eventStore = eventStore
  toTime = toTime
  isMenuShown = false
  caseSensitive = true
  useRegEx = false
  defaultTierOnly = false
  isCmdOrCtrl = isCmdOrCtrl

  mounted() {
    document.body.addEventListener('keydown', isCmdOrCtrl((e) => {
      if (e.key === 'f') {
        e.preventDefault()
        e.stopPropagation();
        (this.$refs.input as any).focus()
      }
    }))
  }

  stopUndoPropagation(e: KeyboardEvent) {
    isUndoOrRedo((ev, d) => {
      console.log('undo or redo', d)
      e.preventDefault()
    })
  }

  onFocus() {
    this.focused = true
    document.removeEventListener('keydown', history.undoListener)
  }

  onBlur() {
    this.focused = false
    document.addEventListener('keydown', history.undoListener)
  }

  playEvent() {
    const e = getSelectedEvent()
    if (e !== undefined) {
      playEvent(e)
    }
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
    this.handleSearch(eventStore.searchTerm)
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

  showMenu() {
    if (this.focused) {
      this.isMenuShown = true
    }
  }
  hideMenu() {
    this.isMenuShown = false
  }

  getDefaultOrAllTokenText(t: LocalTranscriptToken) {
    if (this.defaultTierOnly) {
      return t.tiers[this.defaultTier].text
    } else {
      return _(t.tiers).map(tier => tier.text).value().join(' ')
    }
  }

  handleSearch(term: string) {
    eventStore.searchTerm = term
    if (eventStore.searchTerm === '') {
      this.eventStore.searchResults = []
    } else {
      // console.time('search took')
      const search = this.caseSensitive ? term : term.toLowerCase()
      const regex = new RegExp(search)
      requestAnimationFrame(() => {
        const r = _(eventStore.events)
          .filter((v) => {
            return _(v.speakerEvents).filter((se) => {
              let s = _(se.tokens).map(this.getDefaultOrAllTokenText).value().join(' ')
              if (!this.caseSensitive) {
                s = s.toLowerCase()
              }
              if (this.useRegEx && this.isValidRegex) {
                return regex.test(s)
              } else {
                return s.indexOf(search) > -1
              }
            }).value().length > 0
          }).value()
        this.eventStore.searchResults = r
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
  goToResult(e: LocalTranscriptEvent|undefined) {
    if (e !== undefined) {
      selectSearchResult(e)
    }
  }
  findNext() {
    const selectedEvent = eventStore.events[findEventById(eventStore.selectedEventIds[0])]
    const e = findNextEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
    if (e) {
      this.goToResult(e)
    } else {
      this.goToResult(_(eventStore.searchResults).first())
    }
  }
  findPrevious() {
    const selectedEvent = eventStore.events[findEventById(eventStore.selectedEventIds[0])]
    const e = findPreviousEventAt(selectedEvent ? selectedEvent.endTime : 0, eventStore.searchResults)
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

