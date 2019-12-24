<template>
  <v-layout fill-height column>
    <v-flex shrink>
      <v-subheader>
        <small>Actions</small>
      </v-subheader>
    </v-flex>
    <v-list class="flex pb-0" style="flex: 1 0; overflow: scroll;" dense>
      <v-list-tile
        v-for="(sc, k) in keyboardShortcuts"
        @click="sc.action($event)"
        :disabled="sc.disabled ? sc.disabled() : false"
        v-show="sc.showInMenu === true"
        :key="k">
        <v-list-tile-avatar>
          <v-icon class="tool-icon">{{ sc.icon }}</v-icon>
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
  </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { keyboardShortcuts, displayKeyboardAction } from '../service/keyboard'

@Component
export default class Tools extends Vue {
  keyboardShortcuts = keyboardShortcuts
  displayKeyboardAction = displayKeyboardAction
}
</script>
<style lang="stylus" scoped>
.tool-icon
  font-size 18px !important
</style>
