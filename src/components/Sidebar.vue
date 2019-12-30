<template>
  <v-layout>
    <v-flex v-if="active" :style="{ borderRight: active ? '1px solid rgba(255,255,255,.3)' : '0' }">
      <v-window class="window" v-model="settings.activeSidebarItem" vertical>
        <v-window-item value="edit" class="sidebar-scrollable">
          <actions />
        </v-window-item>
        <v-window-item value="history" class="sidebar-scrollable">
          <edit-history v-if="history.actions.length > 0" />
          <div v-else class="text-xs-center grey--text mt-4">
            <small>Edits will appear here.</small>
          </div>
        </v-window-item>
        <v-window-item value="warnings" class="sidebar-scrollable">
          <error-list :errors="errors"/>
        </v-window-item>
        <v-window-item value="search" class="sidebar-scrollable">
          <search />
        </v-window-item>
        <v-window-item value="bookmarks" class="sidebar-scrollable">
          <bookmarks />
        </v-window-item>
      </v-window>
    </v-flex>
    <v-flex class="sidebar-picker text-xs-center pt-2">
      <v-layout column fill-height justify-space-between>
        <v-flex>
          <v-btn
            v-ripple="false"
            :title="'Editing (' + displayKeyboardAction(keyboardShortcuts.showEditMenu) + ')'"
            icon
            @click="clickTab('edit')"
            class="mb-2 sidebar-btn">
            <v-icon :color="settings.activeSidebarItem === 'edit' ? 'blue' : ''">
              {{ keyboardShortcuts.showEditMenu.icon }}
            </v-icon>
          </v-btn>
          <v-btn 
            v-ripple="false"
            :title="'History (' + displayKeyboardAction(keyboardShortcuts.showHistory) + ')'"
            icon
            @click="clickTab('history')"
            class="mb-2 sidebar-btn">
            <v-icon :color="settings.activeSidebarItem === 'history' ? 'blue' : ''">
              {{ keyboardShortcuts.showHistory.icon }}
            </v-icon>
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Warnings (' + displayKeyboardAction(keyboardShortcuts.showWarnings) + ')'"
            icon
            @click="clickTab('warnings')"
            class="mb-2 sidebar-btn">
            <v-badge
              :value="errors.length > 0"
              :color="settings.activeSidebarItem === 'warnings' ? 'blue' : 'grey'">
              <v-icon
                :color="settings.activeSidebarItem === 'warnings' ? 'blue' : ''">
                {{ keyboardShortcuts.showWarnings.icon }}
              </v-icon>
              <span slot="badge">
                {{ errors.length < 100 ? errors.length : '99+' }}
              </span>
            </v-badge>
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Search (' + displayKeyboardAction(keyboardShortcuts.showSearch) + ')'"
            icon
            @click="clickTab('search')"
            class="mb-2 sidebar-btn">
            <v-icon :color="settings.activeSidebarItem === 'search' ? 'blue' : ''">
              {{ keyboardShortcuts.showSearch.icon }}
            </v-icon>
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Bookmarks (' + displayKeyboardAction(keyboardShortcuts.showBookmarks) + ')'"
            icon
            @click="clickTab('bookmarks')"
            class="mb-2 sidebar-btn">
            <v-icon :color="settings.activeSidebarItem === 'bookmarks' ? 'blue' : ''">
              {{ keyboardShortcuts.showBookmarks.icon }}
            </v-icon>
          </v-btn>
        </v-flex>
        <v-flex xs1>
          <v-spacer />
          <v-btn
            class="sidebar-btn"
            v-ripple="false"
            @click.stop="settings.showSettings = true"
            icon
            flat>
            <v-icon>settings</v-icon>
          </v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as _ from 'lodash'

import {
  LocalTranscriptEvent,
  scrollToAudioEvent,
  findEventIndexById,
  scrollToTranscriptEvent,
  eventStore,
  selectEvent,
  toTime,
  sortEvents
} from '../store/transcript'
import { history } from '../store/history'
import settings, { SidebarItem } from '../store/settings'

import { getErrors, ErrorEvent } from '../service/errors'
import { keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'

import editHistory from './EditHistory.vue'
import errorList from './ErrorList.vue'
import bookmarks from './Bookmarks.vue'
import search from './Search.vue'
import actions from './Actions.vue'

@Component({
  components: {
    actions,
    editHistory,
    errorList,
    search,
    bookmarks,
  }
})
export default class Sidebar extends Vue {

  @Prop() active: boolean

  settings = settings
  errors: ErrorEvent[] = []
  history = history
  eventStore = eventStore
  stuckAtBottom = false
  toTime = toTime
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction
  debouncedGetErrors = _.debounce(this.getErrors, 500)

  clickTab(e: SidebarItem) {
    if (e === settings.activeSidebarItem && settings.showDrawer === true) {
      settings.showDrawer = false
    } else {
      settings.activeSidebarItem = e
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

  @Watch('settings.showErrors', { deep: true })
  async onErrorSettingsUpdate() {
    this.getErrors()
  }
  @Watch('settings.maxEventGap')
  async onGapSettingsUpdate() {
    this.getErrors()
  }
  @Watch('eventStore.events')
  async onEventsUpdate(newEvents: LocalTranscriptEvent[]) {
    this.debouncedGetErrors()
  }

  async getErrors() {
    await this.$nextTick()
    window.requestIdleCallback(() => {
      this.errors = getErrors(eventStore.events)
    })
  }

  mounted() {
    this.getErrors()
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
.sidebar-btn
  border-radius 0
  margin 0 !important
  height 55px
  width 100%
  &:before
    border-radius 0

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
