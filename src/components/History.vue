<template>
  <v-tabs class="history layout fill-height column" height="64" grow v-model="activeTab">
    <v-tab ripple>History</v-tab>
    <v-tab ripple>Versions</v-tab>
    <v-tab-item>
      <v-list dense>
        <v-list-tile
          class="tile"
          :key="i"
          v-for="(action, i) in history">
          <v-list-tile-avatar>
            <v-icon v-if="action.type === 'RESIZE'">aspect_ratio</v-icon>
            <v-icon v-if="action.type === 'DELETE'">delete_forever</v-icon>
            <v-icon v-if="action.type === 'ADD'">add_circle_outline</v-icon>
            <v-icon v-if="action.type === 'CHANGE_TOKENS'">format_color_text</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content v-if="action.type === 'RESIZE'">
            <v-list-tile-title>resize segment</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">{{ action.event.eventId }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="action.type === 'DELETE'">
            <v-list-tile-title>delete segment</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">{{ action.event.eventId }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="action.type === 'ADD'">
            <v-list-tile-title>add segment</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">{{ action.event.eventId }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="action.type === 'CHANGE_TOKENS'">
            <v-list-tile-title>update transcript</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">{{ action.event.eventId }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-btn icon @click="" class="undo-btn">
              <v-icon>undo</v-icon>
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </v-tab-item>
    <v-tab-item>
      <v-list dense>
        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Home</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>contact_mail</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Contact</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-tab-item>
  </v-tabs>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { history } from '../store/transcript'

@Component
export default class History extends Vue {
  history = history
  activeTab = 0
}
</script>
<style lang="stylus">
.history
  .tabs__items
    overflow-y scroll
</style>

<style lang="stylus" scoped>
.subtitle
  font-size 11px

.undo-btn
  opacity 0

.tile:hover .undo-btn
  opacity 1

</style>
