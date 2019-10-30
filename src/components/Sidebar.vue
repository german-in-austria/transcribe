<template>
  <v-tabs v-if="active" hide-slider class="sidebar layout fill-height column" height="64" grow v-model="activeTab">
    <v-tab>
      <v-icon>edit</v-icon>
    </v-tab>
    <v-tab>
      <v-icon>history</v-icon>
    </v-tab>
    <v-tab>
      <v-badge :value="errors.length > 0" color="grey">
        <v-icon>error_outline</v-icon> <span slot="badge">{{ errors.length }}</span>
      </v-badge>
    </v-tab>
    <v-tab>
      <v-icon>bookmark_border</v-icon>
    </v-tab>
    <v-tabs-items class="sidebar-scrollable">
      <v-tab-item>
        <v-subheader>
          <small>Actions</small>
        </v-subheader>
        <v-list dense>
          <v-list-tile
            v-for="(sc, k) in keyboardShortcuts"
            @click="sc.action($event)"
            :disabled="sc.disabled ? sc.disabled() : false"
            :key="k">
            <v-list-tile-avatar>
              <v-icon>{{ sc.icon }}</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>
                {{ sc.name }}
              </v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              {{ displayKeyboardAction(sc) }}
            </v-list-tile-action>
          </v-list-tile>
          <!-- <v-list-tile :disabled="eventStore.selectedEventIds.length === 0">
            <v-list-tile-avatar>
              <v-icon>delete</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>
                delete
              </v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              {{ displayKeyboardAction(keyboardShortcuts.deleteEvents) }}
            </v-list-tile-action>
          </v-list-tile>
          <v-list-tile :disabled="eventStore.selectedEventIds.length < 2">
            <v-list-tile-avatar>
              <v-icon>merge_type</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>
                join
              </v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              {{ displayKeyboardAction(keyboardShortcuts.joinEvents) }}
            </v-list-tile-action>
          </v-list-tile> -->
        </v-list>
      </v-tab-item>
      <v-tab-item>
        <edit-history v-if="history.actions.length > 0" />
        <div v-else class="text-xs-center grey--text mt-4">
          <small>Edits will appear here.</small>
        </div>
      </v-tab-item>
      <v-tab-item>
        <error-list :errors="errors" v-if="errors.length > 0" />
        <div v-else class="text-xs-center grey--text mt-4">
          <small>Errors will appear here.</small>
        </div>
      </v-tab-item>
      <v-tab-item>
        <div class="text-xs-center grey--text mt-4">
          <small>Bookmarks will appear here</small>
        </div>
      </v-tab-item>
    </v-tabs-items>
  </v-tabs>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import editHistory from './EditHistory.vue'
import errorList from './ErrorList.vue'
import * as _ from 'lodash'
import {
  LocalTranscriptEvent,
  scrollToAudioEvent,
  findEventIndexById,
  scrollToTranscriptEvent,
  eventStore,
  selectEvent,
  speakerEventHasErrors,
  toTime,
  sortEvents
} from '../store/transcript'

import { history } from '../store/history'
import { keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'

interface ErrorEvent extends LocalTranscriptEvent {
  error_type: 'time_overlap'|'unknown_token'
}

@Component({
  components: {
    editHistory,
    errorList
  }
})
export default class Sidebar extends Vue {

  @Prop() active: boolean

  errors: ErrorEvent[] = []
  history = history
  activeTab = 0
  eventStore = eventStore
  stuckAtBottom = false
  toTime = toTime
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction

  beforeUpdate() {
    if (this.$el && this.$el.querySelector) {
      const el = this.$el.querySelector('.sidebar-scrollable')
      if (el !== null && el.scrollHeight - el.scrollTop - el.clientHeight < 25) {
        this.stuckAtBottom = true
      } else {
        this.stuckAtBottom = false
      }
    }
  }

  @Watch('eventStore.events')
  onEventsUpdate(newEvents: LocalTranscriptEvent[]) {
    this.errors = _(sortEvents(newEvents))
      .filter((e, i) => newEvents[i - 1] !== undefined && e.startTime < newEvents[i - 1].endTime)
      .map((e) => ({...e, error_type: 'time_overlap'} as ErrorEvent))
      .value()
  }

  updated() {
    if (this.$el && this.$el.querySelector) {
      const el = this.$el.querySelector('.sidebar-scrollable')
      if (this.stuckAtBottom && el) {
        el.scrollTo({
          top: el.scrollHeight - el.clientHeight,
          behavior: 'smooth'
        })
      }
    }
  }

}
</script>
<style lang="stylus">
.sidebar-scrollable
  height calc(100% - 70px)
  .v-window__container
  .v-window-item
  .v-list
    height 100%
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
