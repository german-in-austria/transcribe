<template>
  <input
    type="text"
    :value="searchTerm"
    @keydown="handleKey"
    @input="handleSearch"
    @focus="focussed = true"
    @blur="focussed = false"
    placeholder="Search…"
  />
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'
// tslint:disable-next-line:max-line-length
import { eventStore, LocalTranscriptEvent, scrollToAudioEvent, scrollToTranscriptEvent, selectEvent } from '@store/transcript'
import { toTime } from '@store/transcript'

@Component
export default class Search extends Vue {

  @Prop({ default: false }) show: boolean

  focussed = false
  searchTerm = ''
  eventStore = eventStore
  toTime = toTime

  handleKey(e: KeyboardEvent) {
    console.log(e)
  }

  handleSearch(e: Event) {
    console.log(e)
    this.searchTerm = (e.target as any).value
    if (this.searchTerm === '') {
      this.eventStore.searchResults = []
    } else {
      console.time('search took')
      const r = _(eventStore.events)
        .filter((v) => {
          return _(v.speakerEvents).filter((se) => {
            return _(se.tokens).map(t => t.tiers.default.text).value().join(' ').indexOf(this.searchTerm) > -1
          }).value().length
        })
        // .take(20)
        .value()
      console.timeEnd('search took')
      this.eventStore.searchResults = r
    }
  }
  handleEsc() {
    if (this.searchTerm === '') {
      this.$emit('close')
    } else {
      this.searchTerm = ''
      this.eventStore.searchResults = []
    }
  }
  mounted() {
    this.$nextTick(() => {
      const i = this.$el.querySelector('input')
      console.log({i})
      if (i instanceof HTMLElement) {
        i.focus()
      }
    })
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

input
  background rgba(255,255,255,.1)
  height 32px
  width 78px
  padding 0 10px
  border-radius 5px
  margin-right 12px
  outline 0
  &:focus{
    width 200px
  }
</style>

