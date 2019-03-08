<template>
  <v-tabs hide-slider class="sidebar layout fill-height column" height="64" grow v-model="activeTab">
    <v-tab ripple>History</v-tab>
    <v-tab ripple>
      <v-badge :value="errors.length > 0" color="grey">
        Errors <span slot="badge">{{ errors.length }}</span>
      </v-badge>
    </v-tab>
    <v-tabs-items class="sidebar-scrollable">
      <v-tab-item>
        <edit-history v-if="history.length > 0" />
        <div v-else class="text-xs-center grey--text mt-4">
          <small>Edits will appear here.</small>
        </div>
      </v-tab-item>
      <v-tab-item>
        <v-list dense>
          <v-tooltip
            v-for="(error) in errors"
            :key="error.eventId"
            lazy
            left>
            <v-list-tile slot="activator" @click="showEventIfExists(error)">
              <v-list-tile-action>
                <v-icon>error</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title v-if="error.error_type === 'time_overlap'">Time Overlap</v-list-tile-title>
                <v-list-tile-title v-if="error.error_type === 'unknow_token'">Unknown Token Type</v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
            <segment-transcript :event="error" />
          </v-tooltip>
        </v-list>
        <div v-if="errors.length === 0" class="text-xs-center grey--text mt-4">
          <small>Errors will appear here.</small>
        </div>
      </v-tab-item>
    </v-tabs-items>
  </v-tabs>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import editHistory from './EditHistory.vue'
import * as _ from 'lodash'
import SegmentTranscript from './SegmentTranscript.vue'
import {
  history,
  LocalTranscriptEvent,
  scrollToAudioEvent,
  findSegmentById,
  scrollToTranscriptEvent,
  eventStore,
  selectEvent,
  speakerEventHasErrors
} from '../store/transcript'

interface ErrorEvent extends LocalTranscriptEvent {
  error_type: 'time_overlap'|'unknown_token'
}

@Component({
  components: {
    editHistory,
    SegmentTranscript
  }
})
export default class Sidebar extends Vue {

  errors: ErrorEvent[] = []
  history = history
  activeTab = 0
  eventStore = eventStore
  stuckAtBottom = false

  beforeUpdate() {
    const el = this.$el.querySelector('.sidebar-scrollable')
    if (el !== null && el.scrollHeight - el.scrollTop - el.clientHeight < 25) {
      this.stuckAtBottom = true
    } else {
      this.stuckAtBottom = false
    }
  }

  @Watch('eventStore.events')
  onEventsUpdate(newEvents: LocalTranscriptEvent[]) {
    this.errors = _(newEvents)
      .filter((e, i) => newEvents[i - 1] !== undefined && e.startTime < newEvents[i - 1].endTime)
      .map((e) => ({...e, error_type: 'time_overlap'} as ErrorEvent))
      .value()
  }

  updated() {
    const el = this.$el.querySelector('.sidebar-scrollable')
    if (this.stuckAtBottom && el) {
      el.scrollTo({
        top: el.scrollHeight - el.clientHeight,
        behavior: 'smooth'
      })
    }
  }

  showEventIfExists(e: LocalTranscriptEvent) {
    const i = findSegmentById(e.eventId)
    if (i > -1) {
      selectEvent(e)
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }

}
</script>
<style lang="stylus">
.sidebar-scrollable
  overflow-y scroll
  margin-bottom 70px
  .title
    height 19px
    
  .subtitle
    height 18px
    font-size 11px

  .undo-btn
    opacity 0

  .tile:hover .undo-btn
    opacity 1
</style>
