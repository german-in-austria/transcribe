<template>
  <v-layout column>
    <v-flex shrink>
      <v-subheader>
        <small>Bookmarks and Gaps ({{ gaps.length }})</small>
      </v-subheader>
    </v-flex>
    <v-flex grow>
      <v-list dense>
        <RecycleScroller
          class="scroller"
          :items="gaps"
          key-field="start"
          :item-size="40">
          <template v-slot="{ item }">
            <v-list-tile @click="scrollToAudioTime(item.start)">
              <v-list-tile-avatar>
                <v-icon>mdi-arrow-expand-horizontal</v-icon>
              </v-list-tile-avatar>
              <v-list-tile-content>
                <v-list-tile-title class="sidebar-title">Gap</v-list-tile-title>
                <v-list-tile-sub-title class="subtitle">
                  {{ toTime(item.start) }} - {{ toTime(item.end) }} / {{ item.duration.toFixed(1) }} sec
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </RecycleScroller>
      </v-list>
    </v-flex>
    <v-flex class="pl-2 pr-2" shrink>
      <v-slider hide-details label="Gap Size" :step=".1" thumb-label v-model="gapSize" :min=".1" :max="10" />
    </v-flex>
  </v-layout>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { findEventGaps, eventStore, LocalTranscriptEvent, toTime, findEventAt, scrollToAudioEvent } from '../store/transcript'
import { RecycleScroller } from 'vue-virtual-scroller'
import _ from 'lodash'

@Component({
  components: {
    RecycleScroller
  }
})
export default class Bookmarks extends Vue {

  debouncedGetGaps = _.debounce(this.getGaps, 300)

  gaps: any = []
  bookmarks: any = []
  eventStore = eventStore
  toTime = toTime
  gapSize = 1

  scrollToAudioTime(t: number) {
    const e = findEventAt(t)
    if (e !== undefined) {
      scrollToAudioEvent(e)
    }
  }

  async getGaps(es: LocalTranscriptEvent[]) {
    await this.$nextTick()
    window.requestIdleCallback(() => {
      this.gaps = findEventGaps(es, this.gapSize).map((e, i) => ({...e, i}))
    })
  }

  mounted() {
    this.debouncedGetGaps(eventStore.events)
  }

  @Watch('gapSize')
  onGapSizeUpdate() {
    console.log('gapSize', this.gapSize)
    this.debouncedGetGaps(eventStore.events)
  }

  @Watch('eventStore.events')
  onEventsUpdate(newEvents: LocalTranscriptEvent[]) {
    this.debouncedGetGaps(newEvents)
  }
}
</script>
<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.scroller
  height calc(100vh - 100px)
</style>
