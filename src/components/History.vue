<template>
  <v-tabs height="64" grow v-model="activeTab">
    <v-tab ripple>History</v-tab>
    <v-tab ripple>Versions</v-tab>
    <v-tab-item>
      <v-list dense>
        <v-list-tile
          :key="i"
          v-for="(action, i) in history"
          @click="">
          <v-list-tile-avatar>
            <v-icon v-if="action.type === 'RESIZE'">aspect_ratio</v-icon>
            <v-icon v-if="action.type === 'DELETE'">delete_forever</v-icon>
            <v-icon v-if="action.type === 'ADD'">add_circle_outline</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content v-if="action.type === 'RESIZE'">
            <v-list-tile-title>Resize Segment</v-list-tile-title>
            <v-list-tile-sub-title>{{ action.segment.id }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="action.type === 'DELETE'">
            <v-list-tile-title>Delete Segment</v-list-tile-title>
            <v-list-tile-sub-title>{{ action.segment.id }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="action.type === 'ADD'">
            <v-list-tile-title>Add Segment</v-list-tile-title>
            <v-list-tile-sub-title>{{ action.segment.id }}</v-list-tile-sub-title>
          </v-list-tile-content>
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
<style lang="scss" scoped>
</style>
