<template>
  <v-dialog
    lazy
    :transition="false"
    @input="$event === false && $emit('close')"
    :value="show"
    content-class="dialog"
    max-width="700">
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs class="settings layout fill-height column" grow height="64" v-model="activeTab">
          <v-tab>
            Application
          </v-tab>
          <v-tab>
            Transcript
          </v-tab>
          <v-tab>
            Shortcuts
          </v-tab>
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
                <v-list-tile-title>Dark Theme</v-list-tile-title>
                <v-list-tile-action>
                  <v-switch v-model="settings.darkMode" />
                </v-list-tile-action>
              </v-list-tile>
              <v-subheader>Visualization</v-subheader>
              <v-divider />
              <v-list-tile>
                <v-list-tile-title>Visualization Type</v-list-tile-title>
                <v-btn-toggle mandatory v-model="settings.showSpectograms">
                  <v-btn small flat :value="false">Amplitude</v-btn>
                  <v-btn small flat :value="true">Spectrogram</v-btn>
                </v-btn-toggle>
              </v-list-tile>
              <v-list-tile v-if="!settings.showSpectograms">
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
              <v-subheader v-if="settings.showSpectograms">Spectogram Colors</v-subheader>
              <v-subheader v-else>Waveform Colors</v-subheader>
              <v-divider />
              <div v-if="settings.showSpectograms" class="pt-3 pb-3 pl-3 pr-5">
                <v-menu
                  offset-y
                  lazy
                  :close-on-content-click="false"
                  v-for="(color, i) in settings.spectogramColors"
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
              <div v-if="!settings.showSpectograms" class="pt-3 pb-3 pl-3 pr-5">
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
          <v-tab-item>
            <v-list subheader class="pa-4">
              <v-subheader>Token Types</v-subheader>
              <v-divider class="mb-3" />
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
                  <v-text-field :rules="regExInputRules" @input="(e) => updateRegEx(i, e)" label="Regular Expression" :value="type.regex.toString()" />
                </v-flex>
              </v-layout>
            </v-list>
          </v-tab-item>
          <v-tab-item>
            <v-list class="pa-4">
              <v-list-tile v-for="(e, i) in settings.keyboardShortcuts" :key="i">
                <v-list-tile-content>
                  <v-list-tile-title>{{ e.name }}</v-list-tile-title>
                  <v-list-tile-sub-title>{{ e.description }}</v-list-tile-sub-title>
                </v-list-tile-content>
                <v-list-tile-action class="no-flex-direction">
                  <select v-model="e.meta" class="keyboard-shortcut">
                    <option value="null">none</option>
                    <option value="alt">alt</option>
                    <option value="ctrl">ctrl</option>
                    <option value="meta">command</option>
                  </select>
                  <select v-model="e.key" class="keyboard-shortcut">
                    <option :value="l" :selected="i === 1" v-for="(l, i) in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')" :key="i">
                      {{ l }}
                    </option>
                  </select>
                </v-list-tile-action>
              </v-list-tile>
            </v-list>
          </v-tab-item>
        </v-tabs>
      </v-card-text>
    </v-card>
  </v-dialog>
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
export default class Settings extends Vue {
  @Prop({ default: false }) show: boolean
  settings = settings
  activeTab = null

  regExInputRules = [
    (e: string) => {
      try {
        console.log('tried')
        const x = new RegExp(e)
        return true
      } catch (e) {
        console.log('failed')
        return 'Invalid Regular Expression'
      }
    }
  ]

  updateRegEx(...args: any[]) {
    console.log(args)
  }

  updateWaveFormColor(...args: any[]) {
    console.log(args)
  }

  updateGradient(i: number, c: any) {
    this.settings.spectogramColors[i].c = [c.rgba.r, c.rgba.g, c.rgba.b, c.rgba.a]
    console.log(this.settings.spectogramColors[i].c)
    const g = makeGradient(this.settings.spectogramColors)
    this.settings.spectogramGradient = g
  }
}
</script>
<style lang="stylus">
.settings
  .tabs__items
    overflow-y scroll
</style>

<style lang="stylus" scoped>

.no-flex-direction
  flex-direction: unset

select.keyboard-shortcut
  -webkit-appearance none
  background rgba(0,0,0,.1)
  margin-right .5em
  padding .15em .7em
  font-size 90%
  outline 0
</style>
