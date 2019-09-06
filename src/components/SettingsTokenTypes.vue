<template>
  <v-list subheader>
    <v-layout class="settings-header">
      <v-subheader>Token Types</v-subheader>
      <v-divider class="mb-3" />
    </v-layout>
    <v-layout class="ml-3" row :key="type.name" v-for="(type, i) in settings.tokenTypes">
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
      <v-flex xs5>
        <v-text-field
          :rules="[
            !isValidRegEx(type.regex.toString()) && 'Invalid Regular Expression'
          ]"
          @input="(e) => updateRegEx(i, e)"
          label="Regular Expression"
          :value="type.regex.toString()"
        />
      </v-flex>
    </v-layout>
  </v-list>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import { makeGradient } from '../lib/gradient'
import { Chrome as ColorPicker } from 'vue-color'

@Component({
  components: {
    ColorPicker
  }
})
export default class SettingsTokenTypes extends Vue {
  settings = settings

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

  updateWaveFormColor(...args: any[]) {
    console.log(args)
  }

  updateGradient(i: number, c: any) {
    this.settings.spectrogramColors[i].c = [c.rgba.r, c.rgba.g, c.rgba.b, c.rgba.a]
    console.log(this.settings.spectrogramColors[i].c)
    const g = makeGradient(this.settings.spectrogramColors)
    this.settings.spectrogramGradient = g
  }
}
</script>
<style lang="scss" scoped>
</style>
