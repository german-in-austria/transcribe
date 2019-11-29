<template>
  <v-dialog
    lazy
    :transition="false"
    @input="$event === false && $emit('close')"
    :value="show"
    content-class="settings-dialog"
    max-width="700">
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs hide-slider class="settings layout fill-height column" grow height="64" v-model="activeTab">
          <v-tab>
            Application
          </v-tab>
          <v-tab>
            Transcript
          </v-tab>
          <v-tab>
            Shortcuts
          </v-tab>
          <v-tabs-items>
            <v-tab-item>
              <v-list subheader class="pa-4">
                <v-subheader>Interaction</v-subheader>
                <v-divider />
                <v-list-tile>
                  <v-list-tile-title>Mousewheel scrolls horizontally</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch v-model="settings.emulateHorizontalScrolling" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Synchronize Scroll Position</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch v-model="settings.lockScroll" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Play Event after Appending</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch v-model="settings.playEventOnAppend" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Dark Theme</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch :input-value="settings.darkMode" @change="setIsDarkMode"/>
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Theme Contrast</v-list-tile-title>
                  <v-list-tile-action>
                    <v-slider v-model="settings.contrast" :step=".1" :min="1" :max="1.5" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-subheader>Visualization</v-subheader>
                <v-divider />
                <v-list-tile>
                  <v-list-tile-title>Visualization Type</v-list-tile-title>
                  <v-list-tile-action class="no-flex-direction">
                    <select v-model="settings.showSpectrograms">
                      <option :value="false">Waveform</option>
                      <option :value="true">Spectrogram</option>
                    </select>
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile v-if="!settings.showSpectrograms">
                  <v-list-tile-title>Use Mono Waveform</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch v-model="settings.useMonoWaveForm" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Show Segments</v-list-tile-title>
                  <v-list-tile-action>
                    <v-switch v-model="settings.showSegmentBoxes" />
                  </v-list-tile-action>
                </v-list-tile>
                <v-subheader v-if="settings.showSpectrograms">Spectrogram Colors</v-subheader>
                <v-subheader v-else>Waveform Colors</v-subheader>
                <v-divider />
                <div v-if="settings.showSpectrograms" class="pt-3 pb-3 pl-3 pr-5">
                  <v-menu
                    offset-y
                    lazy
                    :close-on-content-click="false"
                    v-for="(color, i) in settings.spectrogramColors"
                    :key="i">
                    <v-btn
                      small
                      icon
                      slot="activator"
                      :style="{background: `rgba(${ color.c.join(', ') })`, border: '1px solid #ccc'}"
                      dark />
                    <color-picker
                      @input="(e) => updateGradient(i, e)"
                      :value="{ r: color.c[0], g: color.c[1], b: color.c[2], a: color.c[3] }" />
                  </v-menu>
                </div>
                <div v-if="!settings.showSpectrograms" class="pt-3 pb-3 pl-3 pr-5">
                  <v-menu
                    offset-y
                    lazy
                    :close-on-content-click="false"
                    v-for="(color, i) in settings.waveFormColors"
                    :key="i">
                    <v-btn
                      small
                      icon
                      slot="activator"
                      :style="{background: settings.waveFormColors[i], border: '1px solid #ccc'}"
                      dark />
                    <color-picker
                      @input="(e) => settings.waveFormColors[i] = e.hex"
                      :value="settings.waveFormColors[i]" />
                  </v-menu>
                </div>
              </v-list>
            </v-tab-item>
            <v-tab-item lazy>
              <settings-token-types class="pa-4" />
            </v-tab-item>
            <v-tab-item lazy>
              <settings-keyboard-shortcuts class="pa-4" />
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings, { setIsDarkMode } from '../store/settings'
import SettingsKeyboardShortcuts from './SettingsKeyboardShortcuts.vue'
import SettingsTokenTypes from './SettingsTokenTypes.vue'
import { makeGradient } from '../lib/gradient'
import { Chrome as ColorPicker } from 'vue-color'

@Component({
  components: {
    SettingsKeyboardShortcuts,
    SettingsTokenTypes,
    ColorPicker
  }
})
export default class Settings extends Vue {

  @Prop({ default: false }) show: boolean
  settings = settings
  activeTab = null
  setIsDarkMode = setIsDarkMode

  updateGradient(i: number, c: any) {
    this.settings.spectrogramColors[i].c = [c.rgba.r, c.rgba.g, c.rgba.b, c.rgba.a]
    console.log(this.settings.spectrogramColors[i].c)
    const g = makeGradient(this.settings.spectrogramColors)
    this.settings.spectrogramGradient = g
  }

}
</script>
<style lang="stylus">
.settings
  .tabs__items
    overflow-y scroll
</style>

<style lang="stylus" scoped>
select
  cursor pointer
  -webkit-appearance none
  background rgba(0,0,0,.1)
  margin-right .5em
  padding .15em 1em
  text-align center
  font-size 90%
  outline 0
</style>
