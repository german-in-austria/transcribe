<template>
  <v-layout>
    <v-flex class="sidebar-content" v-if="active">
      <v-window class="window" v-model="settings.activeSidebarItem" vertical>
        <v-window-item value="edit" class="sidebar-scrollable">
          <!-- we always put the extra "if" here, because otherwise the component stays active even if invisible -->
          <actions
            :transcript="transcript"
            v-if="settings.activeSidebarItem === 'edit'"
          />
        </v-window-item>
        <v-window-item value="history" class="sidebar-scrollable">
          <edit-history
            v-if="settings.activeSidebarItem === 'history'"
            :transcript="transcript"
          />
        </v-window-item>
        <v-window-item value="warnings" class="sidebar-scrollable">
          <warning-list v-if="settings.activeSidebarItem === 'warnings'" :warnings="store.warnings"/>
        </v-window-item>
        <v-window-item value="search" class="sidebar-scrollable">
          <search v-if="settings.activeSidebarItem === 'search'" />
        </v-window-item>
        <v-window-item value="tags" class="sidebar-scrollable">
          <tags v-if="settings.activeSidebarItem === 'tags'" />
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
            <f-icon :value="keyboardShortcuts.showHistory.icon" :color="settings.activeSidebarItem === 'history' ? 'green' : ''" />
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Warnings (' + displayKeyboardAction(keyboardShortcuts.showWarnings) + ')'"
            icon
            @click="clickTab('warnings')"
            class="mb-2 sidebar-btn">
            <v-badge
              :value="store.warnings.length > 0"
              :color="settings.activeSidebarItem === 'warnings' ? 'red' : 'grey'">
              <f-icon
                :value="keyboardShortcuts.showWarnings.icon"
                :color="settings.activeSidebarItem === 'warnings' ? 'red' : ''" />
              <span slot="badge">
                {{ store.warnings.length < 100 ? store.warnings.length : '99+' }}
              </span>
            </v-badge>
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Search (' + displayKeyboardAction(keyboardShortcuts.showSearch) + ')'"
            icon
            @click="clickTab('search')"
            class="mb-2 sidebar-btn">
            <f-icon :color="settings.activeSidebarItem === 'search' ? 'yellow--text text--darken-3 a' : ''" :value="keyboardShortcuts.showSearch.icon" />
          </v-btn>
          <v-btn
            v-ripple="false"
            :title="'Tags (' + displayKeyboardAction(keyboardShortcuts.showTags) + ')'"
            icon
            @click="clickTab('tags')"
            class="mb-2 sidebar-btn">
            <f-icon :color="settings.activeSidebarItem === 'tags' ? 'blue' : ''" :value="keyboardShortcuts.showTags.icon" />
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

import { Vue, Component, Prop } from 'vue-property-decorator'

import { history } from '../store/history.store'
import settings, { SidebarItem } from '../store/settings.store'

import { keyboardShortcuts, displayKeyboardAction } from '../service/keyboard.service'

import editHistory from './EditHistory.vue'
import WarningList from './WarningList.vue'
import Tags from './Tags.vue'
import Search from './Search.vue'
import Actions from './Actions.vue'
import { timeFromSeconds } from '@/util'
import Transcript from '@/classes/transcript.class'
import store from '@/store'

@Component({
  components: {
    Actions,
    editHistory,
    WarningList,
    Search,
    Tags
  }
})
export default class Sidebar extends Vue {

  @Prop({ default: false }) active!: boolean
  @Prop({ required: true }) transcript!: Transcript

  store = store
  settings = settings
  history = history
  stuckAtBottom = false
  toTime = timeFromSeconds
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction

  clickTab(e: SidebarItem) {
    if (e === this.settings.activeSidebarItem && this.settings.showDrawer === true) {
      this.settings.showDrawer = false
    } else {
      this.settings.activeSidebarItem = e
      if (this.settings.showDrawer === false) {
        this.settings.showDrawer = true
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
