<template>
  <div class="pa-4">
    <v-layout v-for="(e, i) in settings.keyboardShortcuts" :key="i" row>
      <v-flex xs5>
        <div>{{ e.name }}</div>
        <small class="grey--text">{{ e.description }}</small>
      </v-flex>
      <v-flex xs5>
        <v-select
          hide-details
          dense
          v-model="e.modifier"
          no-data-text="none"
          :items="['alt', 'shift', 'ctrlOrCmd', 'ctrl']"
          multiple
          chips
          label="modifier"
          attach>
        </v-select>
      </v-flex>
      <v-flex xs2>
        <v-select
          hide-details
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

@Component
export default class KeyboardShortcutSettings extends Vue {
  settings = settings

  keys = 'abcdefghijklmnopqrstuvwxyz1234567890+-'
    .split('')
    .concat([
      'ArrowLeft',
      'ArrowRight',
      'Backspace',
      'Enter'
    ])
}
</script>
<style lang="scss" scoped>
</style>
