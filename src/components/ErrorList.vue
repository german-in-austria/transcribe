<template>
  <v-list v-if="errors.length > 0" dense>
    <v-subheader>
      <small>Errors</small>
    </v-subheader>
    <RecycleScroller
      class="scroller"
      :items="errors"
      key-field="eventId"
      :item-size="40">
      <template v-slot="{ item }">
        <v-list-tile
          @click="showEventIfExists(item)"
          :class="[
            'event-error',
            selectedError !== null && item.eventId === selectedError.eventId ? 'selected' : ''
          ]">
          <v-list-tile-avatar>
            <v-icon v-if="item.error_type === 'time_overlap'">mdi-checkbox-multiple-blank-outline</v-icon>
            <v-icon v-if="item.error_type === 'unknown_token'">mdi-help-rhombus-outline</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title class="sidebar-title" v-if="item.error_type === 'time_overlap'">Time Overlap</v-list-tile-title>
            <v-list-tile-title class="sidebar-title" v-if="item.error_type === 'unknown_token'">Unknown Token Type</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">{{ toTime(item.startTime) }} - {{ toTime(item.endTime) }}</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </template>
    </RecycleScroller>
  </v-list>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import {
  LocalTranscriptEvent,
  scrollToAudioEvent,
  findEventIndexById,
  scrollToTranscriptEvent,
  toTime,
  selectEvent,
  isEventSelected
} from '../store/transcript'

interface ErrorEvent extends LocalTranscriptEvent {
  error_type: 'time_overlap'|'unknown_token'
}

@Component({
  components: {
    SegmentTranscript,
    RecycleScroller
  }
})
export default class ErrorList extends Vue {

@Prop() errors: ErrorEvent
  toTime = toTime
  selectedError: ErrorEvent|null = null

  showEventIfExists(e: ErrorEvent) {
    const i = findEventIndexById(e.eventId)
    this.selectedError = e
    if (i > -1) {
      selectEvent(e)
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }
}
</script>
<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.scroller
  height calc(100% - 40px)

.event-error.selected
  background #ccc
  color white

.sidebar-scrollable .subtitle
  height 18px
  font-size 11px
  color inherit !important
  opacity .7

</style>
