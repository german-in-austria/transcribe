<template>
  <v-layout>
    <v-flex v-if="active" :style="{ borderRight: active ? '1px solid rgba(255,255,255,.3)' : '0' }">
      <v-window class="window" v-model="activeTab" vertical>
        <v-window-item class="sidebar-scrollable">
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
          </v-list>
        </v-window-item>
        <v-window-item class="sidebar-scrollable">
          <edit-history v-if="history.actions.length > 0" />
          <div v-else class="text-xs-center grey--text mt-4">
            <small>Edits will appear here.</small>
          </div>
        </v-window-item>
        <v-window-item class="sidebar-scrollable">
          <error-list :errors="errors" v-if="errors.length > 0" />
          <div v-else class="text-xs-center grey--text mt-4">
            <small>Errors will appear here.</small>
          </div>
        </v-window-item>
        <v-window-item class="sidebar-scrollable">
          <div class="text-xs-center grey--text mt-4">
            <small>Bookmarks will appear here</small>
          </div>
        </v-window-item>
      </v-window>
    </v-flex>
    <v-flex class="sidebar-picker text-xs-center pt-2">
      <v-btn icon @click="clickTab(0)" class="mb-2">
        <v-icon :color="activeTab === 0 ? 'blue' : ''">edit</v-icon>
      </v-btn>
      <v-btn icon @click="clickTab(1)" class="mb-2">
        <v-icon :color="activeTab === 1 ? 'blue' : ''">history</v-icon>
      </v-btn>
      <v-btn icon @click="clickTab(2)" class="mb-2">
        <v-badge :value="errors.length > 0" color="grey">
          <v-icon :color="activeTab === 2 ? 'blue' : ''">error_outline</v-icon> <span slot="badge">{{ errors.length }}</span>
        </v-badge>
      </v-btn>
      <v-btn icon @click="clickTab(3)" class="mb-2">
        <v-icon :color="activeTab === 3 ? 'blue' : ''">bookmark_border</v-icon>
      </v-btn>
    </v-flex>
  </v-layout>
  <!-- <v-tabs v-if="active" hide-slider class="sidebar layout fill-height column" height="64" grow v-model="activeTab">
    <v-tabs-items>
      <v-tab-item>
      </v-tab-item>
      <v-tab-item>
      </v-tab-item>
      <v-tab-item>
      </v-tab-item>
      <v-tab-item>
        
      </v-tab-item>
    </v-tabs-items>
  </v-tabs> -->
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
import settings from '../store/settings'

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
  debouncedGetErrors = _.debounce(this.getErrors, 500)

  clickTab(i: number) {
    if (i === this.activeTab && settings.showDrawer === true) {
      settings.showDrawer = false
    } else {
      this.activeTab = i
      if (settings.showDrawer === false) {
        settings.showDrawer = true
      }
    }
  }

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
  async onEventsUpdate(newEvents: LocalTranscriptEvent[]) {
    this.debouncedGetErrors()
  }

  async getErrors() {
    await this.$nextTick()
    window.requestIdleCallback(() => {
      this.errors = _(sortEvents(eventStore.events))
        // find events with overlaps
        // tslint:disable-next-line:max-line-length
        .filter((e, i) => eventStore.events[i - 1] !== undefined && +e.startTime.toFixed(2) < +eventStore.events[i - 1].endTime.toFixed(2))
        .map((e) => ({...e, error_type: 'time_overlap'} as ErrorEvent))
        // concat events with unknown types
        .concat(
          _(eventStore.events).filter((e) => {
            return _(e.speakerEvents).some((se) => {
              return _(se.tokens).some((t) => t.tiers[eventStore.metadata.defaultTier].type === -1)
            })
          })
          .map(e => ({ ...e, error_type: 'unknown_token' } as ErrorEvent))
          .value()
        )
        .sortBy(e => e.startTime)
        .value()
    })
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
.window
  width 280px
  height 100vh
.sidebar-scrollable
  height 100vh
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

.sidebar-picker
  height 100vh
  background rgba(255,255,255,.1)
</style>
