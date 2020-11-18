<template>
  <v-layout fill-height column>
    <v-flex shrink>
      <v-subheader>
        <small>Warnings ({{ errors.length }})</small>
      </v-subheader>
    </v-flex>
    <div v-if="errors.length === 0" class="text-xs-center grey--text mt-4 flex grow">
      <small>Warnings will appear here.</small>
    </div>
    <v-list class="flex pb-0" style="flex: 1 0; overflow: hidden;" v-if="errors.length > 0" dense>
      <RecycleScroller
        class="scroller"
        :items="errors"
        key-field="error_id"
        :item-size="40">
        <template v-slot="{ item }">
          <v-list-tile
            @click="showEventIfExists(item)"
            :class="[
              'event-error',
              selectedError !== null && item.event.eventId === selectedError.event.eventId ? 'selected' : ''
            ]">
            <v-list-tile-avatar>
              <v-icon v-if="item.error_type === 'event_overlap'">mdi-checkbox-multiple-blank-outline</v-icon>
              <v-icon v-if="item.error_type === 'unknown_token'">mdi-help-rhombus-outline</v-icon>
              <v-icon v-if="item.error_type === 'event_gap'">mdi-arrow-expand-horizontal</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title v-if="item.error_type === 'event_overlap'" class="sidebar-title">Event Overlap</v-list-tile-title>
              <v-list-tile-title v-if="item.error_type === 'unknown_token'" class="sidebar-title">Unknown Token Type</v-list-tile-title>
              <v-list-tile-title v-if="item.error_type === 'event_gap'" class="sidebar-title">Event Gap</v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                {{ toTime(item.event.startTime) }} - {{ toTime(item.event.endTime) }} {{ item.error_type === 'event_gap' ? ' / ' + item.metadata.duration.toFixed(1) + ' sec' : '' }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </RecycleScroller>
    </v-list>
    <v-flex style="line-height: 1.8em;" :class="['pl-4 pr-4 pb-3 small grey--text', !settings.darkMode && 'text--darken-2']" shrink>
      <v-divider class="mb-2" />
      <checkbox v-model="settings.showErrors.eventGaps">
        Event Gaps longer than <dropdown v-model="settings.maxEventGap" :items="eventGapOptions" :stringify="(e) => e + ' sec'" />
      </checkbox>
      <checkbox v-model="settings.showErrors.unknownTokenTypes" label="Unknown Token Types" />
      <checkbox v-model="settings.showErrors.eventOverlaps" label="Event Overlaps" />
    </v-flex>
  </v-layout>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import SegmentTranscript from './SegmentTranscript.vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import Checkbox from './helper/Checkbox.vue'
import Dropdown from './helper/Dropdown.vue'

import settings from '../store/settings'
import { ErrorEvent } from '../service/errors'
import {
  scrollToAudioEvent,
  findEventIndexById,
  scrollToTranscriptEvent,
  toTime,
  selectEvent
} from '../store/transcript'

@Component({
  components: {
    SegmentTranscript,
    RecycleScroller,
    Checkbox,
    Dropdown
  }
})
export default class ErrorList extends Vue {

  @Prop({ default: [] }) errors!: ErrorEvent[]
  toTime = toTime
  selectedError: ErrorEvent|null = null
  settings = settings
  eventGapOptions = [
    .1,
    .25,
    .5,
    1,
    1.5,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5,
    5.5,
    6,
    6.5,
    7,
    7.5,
    10
  ]

  showEventIfExists(e: ErrorEvent) {
    const i = findEventIndexById(e.event.eventId)
    this.selectedError = e
    if (i > -1) {
      selectEvent(e.event)
      scrollToAudioEvent(e.event)
      scrollToTranscriptEvent(e.event)
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css'

.scroller
  height 100%

.event-error
  cursor default
  &.selected /deep/ .v-list__tile
    background rgba(0,0,0,.2)
    color white

.sidebar-scrollable .subtitle
  height 18px
  font-size 11px
  color inherit !important
  opacity .7

</style>
