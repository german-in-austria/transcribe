<template>
  <v-dialog
    lazy
    :transition="false"
    @input="$event === false && $emit('close')"
    @keydown.esc="$emit('close')"
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
                <v-subheader>Interactions</v-subheader>
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
                    <v-switch v-model="settings.darkMode"/>
                  </v-list-tile-action>
                </v-list-tile>
                <v-list-tile>
                  <v-list-tile-title>Scroll Speed</v-list-tile-title>
                  <v-list-tile-action>
                    <v-slider class="mr-3 mt-3 mb-0" thumb-label v-model="settings.scrollSpeed" :step=".1" :min=".5" :max="5" />
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
                <div>
                  <div class="ml-auto">
                    <v-btn small @click="devInfos">DEV Info</v-btn>
                  </div>
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
import settings from '../store/settings.store'
import SettingsKeyboardShortcuts from './SettingsKeyboardShortcuts.vue'
import SettingsTokenTypes from './SettingsTokenTypes.vue'
import { makeGradient } from '../lib/gradient'
import { Chrome as ColorPicker } from 'vue-color'
import TranscriptAudio from '@/classes/transcript-audio.class'

@Component({
  components: {
    SettingsKeyboardShortcuts,
    SettingsTokenTypes,
    ColorPicker
  }
})
export default class Settings extends Vue {

  @Prop({ default: false }) show!: boolean
  @Prop({ default: null }) audio!: TranscriptAudio
  settings = settings
  activeTab = null

  devInfos() {
    var devData = {
      settings: settings,
      audio: this.audio ? JSON.parse(JSON.stringify({
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        fileSize: this.audio.fileSize,
        isPaused: this.audio.isPaused,
        playAllFromTime: this.audio.playAllFromTime,
        url: this.audio.url
      })) : null
    }
    console.log(devData)
    navigator.clipboard.writeText(JSON.stringify(devData, null, 2)).then(function() {
      alert('Copy DevData to Clipboard!')
    }, function(err) {
      alert('Can\'t copy DevData to clipboard!\nThe DevData are available in the console.')
      console.error('Async: Could not copy: ', err)
    })
  }

  updateGradient(i: number, c: any) {
    this.settings.spectrogramColors[i].c = [c.rgba.r, c.rgba.g, c.rgba.b, c.rgba.a]
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
