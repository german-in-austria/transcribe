<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    @input="$event === false && $emit('close')"
    :value="show"
    max-width="700">
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs grow height="64" v-model="activeTab">
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
            <v-list>
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
              <v-list-tile>
                <v-list-tile-title>Show Segments on Audio Wave</v-list-tile-title>
                <v-list-tile-action>
                  <v-switch v-model="settings.showSegmentBoxes" />
                </v-list-tile-action>
              </v-list-tile>
            </v-list>
          </v-tab-item>
          <v-tab-item>
            <v-list>
              <v-list-tile>
                <v-list-tile-title>Test</v-list-tile-title>
                <v-list-tile-action>
                  <v-switch />
                </v-list-tile-action>
              </v-list-tile>
              <v-list-tile>
                <v-list-tile-title>Test</v-list-tile-title>
                <v-list-tile-action>
                  <v-switch />
                </v-list-tile-action>
              </v-list-tile>
            </v-list>
          </v-tab-item>
          <v-tab-item>
            <v-list>
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

@Component
export default class Settings extends Vue {
  @Prop({ default: false }) show: boolean
  settings = settings
  activeTab = null
}
</script>
<style lang="stylus" scoped>
.no-flex-direction
  flex-direction: unset

.tabs__items
  padding: 2em

select.keyboard-shortcut
  -webkit-appearance none
  background rgba(0,0,0,.1)
  margin-right .5em
  padding .15em .7em
  font-size 90%
  outline 0
</style>
