<template>
  <v-layout fill-height column>
    <v-flex shrink>
      <v-subheader>
        <small>Actions</small>
      </v-subheader>
    </v-flex>
    <v-list expand class="flex pb-0" style="flex: 1 0; overflow-y: scroll;" dense>
      <v-list-group
        v-for="(group, name) in groups"
        :value="true"
        :key="name">
        <template v-slot:activator>
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>{{ name }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
        <v-list-tile
          v-for="(sc, k) in group"
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
      </v-list-group>
    </v-list>
  </v-layout>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { displayKeyboardAction, KeyboardAction } from '../service/keyboard'
import settings from '../store/settings'
import _ from 'lodash'

@Component
export default class Actions extends Vue {
  settings = settings
  displayKeyboardAction = displayKeyboardAction

  get groups(): _.Dictionary<KeyboardAction[]> {
    return _(settings.keyboardShortcuts).groupBy('group').value()
  }
}
</script>
<style lang="stylus" scoped>
.tool-icon
  font-size 18px !important
</style>
