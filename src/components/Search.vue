<template>
  <v-dialog
    lazy
    :transition="false"
    :scrollable="false"
    @input="$event === false && $emit('close')"
    :value="show"
    @keydown.esc.stop="handleEsc"
    content-class="search-dialog"
    max-width="700">
    <v-layout wrap>
      <v-flex xs12>
        <v-text-field
          :value="searchTerm"
          @input="handleSearch"
          prepend-icon="search"
          label="Search"
          autofocus
          clearable
          solo
          flat/>
      </v-flex>
      <v-flex xs12>
        <v-list class="scroll-y" v-if="results.length > 0" dense>
          <v-list-tile
            v-for="(event) in results"
            :key="event.eventId"
            @click="openItem(event)">
            <v-list-tile-avatar class="grey--text">
              <small>{{ toTime(event.startTime) }}</small>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-content>
                <v-list-tile-title>
                  <div :key="i" v-for="(se, i) in event.speakerEvents">
                    <b class="speaker">{{ eventStore.metadata.speakers[i].k }}</b> {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
                  </div>
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-flex>
    </v-layout>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
// tslint:disable-next-line:max-line-length
import { eventStore, LocalTranscriptEvent, scrollToAudioEvent, scrollToTranscriptEvent, selectEvent } from '@store/transcript'

@Component
export default class Search extends Vue {

  @Prop({ default: false }) show: boolean

  searchTerm = ''
  results: any = []
  eventStore = eventStore

  handleSearch(e: string) {
    this.searchTerm = e.toLowerCase().trim()
    if (this.searchTerm === '') {
      this.results = []
    } else {
      console.time('search took')
      const r = _(eventStore.events)
        .filter((v) => {
          return _(v.speakerEvents).filter((se) => {
            return _(se.tokens).map(t => t.tiers.default.text).value().join(' ').indexOf(this.searchTerm) > -1
          }).value().length
        })
        .take(20)
        .value()
      console.timeEnd('search took')
      this.results = r
    }
  }
  handleEsc() {
    if (this.searchTerm === '') {
      this.$emit('close')
    } else {
      this.searchTerm = ''
      this.results = []
    }
  }
  mounted() {
    requestAnimationFrame(() => {
      const i = this.$el.querySelector('input')
      if (i instanceof HTMLElement) {
        i.focus()
      }
    })
  }
  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }
  openItem(e: LocalTranscriptEvent) {
    scrollToAudioEvent(e)
    scrollToTranscriptEvent(e)
    selectEvent(e)
    this.$emit('close')
  }
}
</script>
<style lang="stylus" scoped>
.speaker
  display inline-block
  width 3.5em
  padding-left .5em

</style>

