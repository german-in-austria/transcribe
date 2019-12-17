<template>
  <v-list subheader>
    <v-layout class="settings-header">
      <v-flex xs12>
        <v-subheader>Editing</v-subheader>
        <v-divider />
      </v-flex>
    </v-layout>
    <v-list-tile>
      <v-list-tile-content>
        <v-list-tile-title>Auto-insert spaces before delimiters</v-list-tile-title>
        <v-list-tile-sub-title>E.g. <code>token.</code> becomes <code>token .</code></v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action>
        <v-switch v-model="settings.autoCorrectDelimiterSpace" />
      </v-list-tile-action>
    </v-list-tile>
    <v-layout class="settings-header">
      <v-flex xs12>
        <v-subheader>Token Types</v-subheader>
        <v-divider />
      </v-flex>
    </v-layout>
    <v-layout
      v-for="(type, i) in tokenTypesPresets[settings.tokenTypesPreset]"
      :key="type.name"
      class="ml-3 pt-3"
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
        <v-text-field label="Name" :value="type.name" />
      </v-flex>
      <v-flex xs5 v-if="type.type === 'single'">
        <v-text-field
          :rules="[ !isValidRegEx(type.regex.toString()) && 'Invalid Regular Expression' ]"
          @input="(e) => updateRegEx(i, e)"
          label="Regular Expression"
          :value="type.regex.toString()"
        />
      </v-flex>
      <v-flex xs5 v-if="type.type === 'group'">
        <div>
          <v-text-field
            :rules="[ !isValidRegEx(type.bracketSymbols[0].toString()) && 'Invalid Regular Expression' ]"
            @input="(e) => updateBracket(i, e, 0)"
            label="Left Bracket"
            :value="type.bracketSymbols[0].toString()"
          />
        </div>
        <div>
          <v-text-field
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
import settings, { tokenTypesPresets } from '../store/settings'
import { Chrome as ColorPicker } from 'vue-color'

@Component({
  components: {
    ColorPicker
  }
})
export default class SettingsTokenTypes extends Vue {

  settings = settings
  tokenTypesPresets = tokenTypesPresets

  isValidRegEx(e: string) {
    try {
      const x = new RegExp(e)
      return true
    } catch (e) {
      return false
    }
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
