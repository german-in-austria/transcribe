<template>
  <v-layout>
    <v-flex class="sidebar-content" v-if="active">
      <v-window class="window" v-model="settings.activeSidebarItem" vertical>
        <v-window-item value="edit" class="sidebar-scrollable">
          <!-- we always put the extra "if" here, because otherwise the component stays active even if invisible -->
          <actions v-if="settings.activeSidebarItem === 'edit'" />
        </v-window-item>
        <v-window-item value="history" class="sidebar-scrollable">
          <edit-history v-if="settings.activeSidebarItem === 'history' && history.actions.length > 0" />
          <div v-else class="text-xs-center grey--text mt-4">
            <small>Edits will appear here.</small>
          </div>
        </v-window-item>
        <v-window-item value="warnings" class="sidebar-scrollable">
          <warning-list v-if="settings.activeSidebarItem === 'warnings'" :warnings="warnings"/>
        </v-window-item>
        <v-window-item value="search" class="sidebar-scrollable">
          <search v-if="settings.activeSidebarItem === 'search'" />
        </v-window-item>
        <v-window-item value="bookmarks" class="sidebar-scrollable">
          <bookmarks v-if="settings.activeSidebarItem === 'bookmarks'" />
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
            <f-icon :value="keyboardShortcuts.showEditMenu.icon" :color="settings.activeSidebarItem === 'edit' ? 'blue' : ''" />
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'History (' + displayKeyboardAction(keyboardShortcuts.showHistory) + ')'"
            icon
            @click="clickTab('history')"
            class="mb-2 sidebar-btn">
            <f-icon :value="keyboardShortcuts.showHistory.icon" :color="settings.activeSidebarItem === 'history' ? 'blue' : ''" />
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Warnings (' + displayKeyboardAction(keyboardShortcuts.showWarnings) + ')'"
            icon
            @click="clickTab('warnings')"
            class="mb-2 sidebar-btn">
            <v-badge
              :value="warnings.length > 0"
              :color="settings.activeSidebarItem === 'warnings' ? 'blue' : 'grey'">
              <f-icon
                :value="keyboardShortcuts.showWarnings.icon"
                :color="settings.activeSidebarItem === 'warnings' ? 'blue' : ''" />
              <span slot="badge">
                {{ warnings.length < 100 ? warnings.length : '99+' }}
              </span>
            </v-badge>
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Search (' + displayKeyboardAction(keyboardShortcuts.showSearch) + ')'"
            icon
            @click="clickTab('search')"
            class="mb-2 sidebar-btn">
            <f-icon :color="settings.activeSidebarItem === 'search' ? 'blue' : ''" :value="keyboardShortcuts.showSearch.icon" />
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Bookmarks (' + displayKeyboardAction(keyboardShortcuts.showBookmarks) + ')'"
            icon
            @click="clickTab('bookmarks')"
            class="mb-2 sidebar-btn">
            <f-icon :color="settings.activeSidebarItem === 'bookmarks' ? 'blue' : ''" :value="keyboardShortcuts.showBookmarks.icon" />
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
            <f-icon value="settings" />
          </v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import _ from 'lodash'

import {
  eventStore,
  toTime
} from '../store/transcript'
import { history } from '../store/history'
import settings, { SidebarItem } from '../store/settings'

import { getWarnings, WarningEvent } from '../service/warnings'
import { keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'

import editHistory from './EditHistory.vue'
import WarningList from './WarningList.vue'
import bookmarks from './Bookmarks.vue'
import search from './Search.vue'
import actions from './Actions.vue'

@Component({
  components: {
    actions,
    editHistory,
    WarningList,
    search,
    bookmarks
  }
})
export default class Sidebar extends Vue {

  @Prop({ default: false }) active!: boolean

  settings = settings
  warnings: WarningEvent[] = []
  history = history
  eventStore = eventStore
  stuckAtBottom = false
  toTime = toTime
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction
  debouncedGetWarnings = _.debounce(this.getWarnings, 500)

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

  @Watch('settings.showWarnings', { deep: true })
  onWarningsSettingsUpdate() {
    this.getWarnings()
  }

  @Watch('settings.maxEventGap')
  onGapSettingsUpdate() {
    this.getWarnings()
  }

  @Watch('eventStore.events')
  onEventsUpdate() {
    this.debouncedGetWarnings()
  }

  @Watch('settings.projectPreset')
  onPresetUpdate() {
    this.getWarnings()
  }

  async getWarnings() {
    await this.$nextTick()
    window.requestIdleCallback(() => {
      this.warnings = getWarnings(eventStore.events)
    })
  }

  mounted() {
    this.getWarnings()
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
  margin 0 !important
  height 55px
  width 55px
  &:before
    border-radius 5px

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

.theme--dark .sidebar-content
  background #232323

.sidebar-content
  /deep/ .v-list__tile
    padding 0 8px
    margin 0 8px
    border-radius 5px
  /deep/ .v-list__tile__avatar
    min-width 42px

.sidebar-picker
  height 100vh
  background rgba(255,255,255,.1)
</style>
