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
            v-for="result in results"
            :key="result.segment_id + '__' + result.speaker_id">
            <v-list-tile-avatar>
              {{ result.speaker_id }}
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-content>
                <v-list-tile-title class="bold">{{ result.tokens }}</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile-content>
            <v-list-tile-action class="caption">
              00:00:00
            </v-list-tile-action>
          </v-list-tile>
        </v-list>
      </v-flex>
    </v-layout>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
@Component
export default class Search extends Vue {
  @Prop() transcript: Transcript
  @Prop({ default: false }) show: boolean
  searchTerm = ''
  list: any = []
  results: any = []
  getFlatList() {
    return _(this.transcript.speakerEvents).reduce((m, e, i, l) => {
      return m = m.concat(_.map(e, (v, k) => {
        return {
          segment_id: i,
          speaker_id: k,
          tokens: v.tokens.join(' ')
        }
      }))
    }, [] as any)
  }
  handleSearch(e: string) {
    this.searchTerm = e.toLowerCase().trim()
    if (this.searchTerm === '') {
      this.results = []
    } else {
      this.results = _(this.list)
        .filter((v) => {
          return v.tokens.toLowerCase().indexOf(this.searchTerm) > -1
        })
        .take(20)
        .value()
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
    this.list = this.getFlatList()
  }
  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 8)
  }
}
</script>
