<template>
  <v-list subheader>
    <v-layout class="settings-header">
      <v-flex xs12>
        <v-subheader>Editing</v-subheader>
        <v-divider />
      </v-flex>
    </v-layout>
    <v-list-tile class="pt-2">
      <v-list-tile-content>
        <v-list-tile-title>Auto-insert spaces before delimiters</v-list-tile-title>
        <v-list-tile-sub-title>E.g. <code>token.</code> becomes <code>token .</code></v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action>
        <v-switch v-model="presets[settings.projectPreset].autoCorrectDelimiterSpace" />
      </v-list-tile-action>
    </v-list-tile>
    <v-layout class="settings-header">
      <v-flex xs12>
        <v-subheader>Token Types</v-subheader>
        <v-divider />
      </v-flex>
    </v-layout>
    <v-layout row class="ml-4 mr-5 pr-1 pt-3">
      <v-flex>
        <v-select
          label="Preset"
          v-model="settings.projectPreset"
          :items="projectPresetNames">
        </v-select>
      </v-flex>
    </v-layout>
    <v-layout
      v-for="(type, i) in presets[settings.projectPreset].tokenTypes"
      :key="type.name"
      class="ml-3 pt-2"
      row>
      <v-flex xs1>
        <v-menu
          class="mt-2"
          offset-y
          lazy
          :close-on-content-click="false">
          <v-btn
            small
            icon
            slot="activator"
            :style="{background: type.color, border: '1px solid #ccc'}"
            dark />
          <color-picker
            :value="type.color" 
            @input="(e) => type.color = e.hex" />
        </v-menu>
      </v-flex>
      <v-flex xs5>
        <v-text-field disabled label="Name" :value="type.name" />
      </v-flex>
      <v-flex xs5 v-if="type.type === 'single'">
        <v-text-field
          disabled
          :rules="[ !isValidRegEx(type.regex.toString()) && 'Invalid Regular Expression' ]"
          @input="(e) => updateRegEx(i, e)"
          label="Regular Expression"
          :value="type.regex.toString()"
        />
      </v-flex>
      <v-flex xs5 v-if="type.type === 'group'">
        <div>
          <v-text-field
            disabled
            :rules="[ !isValidRegEx(type.bracketSymbols[0].toString()) && 'Invalid Regular Expression' ]"
            @input="(e) => updateBracket(i, e, 0)"
            label="Left Bracket"
            :value="type.bracketSymbols[0].toString()"
          />
        </div>
        <div>
          <v-text-field
            disabled
            :rules="[ !isValidRegEx(type.bracketSymbols[1].toString()) && 'Invalid Regular Expression' ]"
            @input="(e) => updateBracket(i, e, 1)"
            label="Right Bracket"
            :value="type.bracketSymbols[1].toString()"
          />
        </div>
      </v-flex>
    </v-layout>
  </v-list>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Chrome as ColorPicker } from 'vue-color'
import _ from 'lodash'

import settings from '../store/settings'
import presets from '../presets'

@Component({
  components: {
    ColorPicker
  }
})
export default class SettingsTokenTypes extends Vue {

  settings = settings
  presets = presets

  isValidRegEx(e: string) {
    try {
      const x = new RegExp(e)
      return true
    } catch (e) {
      return false
    }
  }

  get projectPresetNames(): string[] {
    return _.map(this.presets, (p, name) => name)
  }

  updateRegEx(...args: any[]) {
    console.log(args)
  }

  updateBracket(listIndex: number, regex: string, bracketIndex: number) {
    console.log(listIndex, regex, bracketIndex)
  }

  updateWaveFormColor(...args: any[]) {
    console.log(args)
  }

}
</script>
<style lang="scss" scoped>
</style>
