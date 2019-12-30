<template>
  <div class="pa-4">
    <v-layout class="settings-header">
      <v-flex xs12>
        <v-subheader>Keyboard Shortcuts</v-subheader>
        <v-divider />
      </v-flex>
    </v-layout>
    <v-layout class="pl-3 pt-3" v-for="(e, i) in settings.keyboardShortcuts" :key="i" row>
      <v-flex xs7>
        <div>{{ e.name }}</div>
        <small class="grey--text">{{ e.description }}</small>
      </v-flex>
      <v-flex xs3>
        <v-select
          :menu-props="{ lazy: true }"
          class="keyboard-chips"
          hide-details
          small-chips
          dense
          v-model="e.modifier"
          no-data-text="none"
          :items="modifierKeys"
          multiple
          chips
          reverse>
        </v-select>
      </v-flex>
      <v-flex xs2>
        <v-select
          :menu-props="{ lazy: true }"
          class="keyboard-chips"
          hide-details
          small-chips
          dense
          v-model="e.key"
          label="key"
          :items="keys"
          chips
        />
      </v-flex>
    </v-layout>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import { modifierKeys, specialKeys, normalKeys } from '../service/keyboard'

@Component
export default class SettingsKeyboardShortcuts extends Vue {

  settings = settings

  get keys() {
    return normalKeys.concat(specialKeys).map(k => ({ text: k.displayName, value: k.jsName }))
  }

  get modifierKeys() {
    return modifierKeys.map(k => ({ text: k.displayName, value: k.name }))
  }
}
</script>
<style lang="scss" scoped>
</style>
