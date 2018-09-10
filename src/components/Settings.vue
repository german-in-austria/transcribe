<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    @input="$event === false && $emit('close')"
    :value="show"
    max-width="700">
    <v-card>
      <v-card-title class="headline">Settings</v-card-title>
      <v-card-text>
        <v-tabs v-model="activeTab">
          <v-tab>
            Application
          </v-tab>
          <v-tab>
            Transcript
          </v-tab>
          <v-tab>
            Shortcuts
          </v-tab>
          <v-tab-item v-for="n in 2" :key="n">
            <v-list>
              <v-list-tile v-for="n in 10" :key="n">
                <v-list-tile-title>Option {{n}}</v-list-tile-title>
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
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey lighten-1"
          flat="flat"
          @click="$emit('close')">
          Cancel
        </v-btn>
        <v-btn
          color="green darken-1"
          flat="flat"
          @click="$emit('close')">
          Save
        </v-btn>
      </v-card-actions>
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
  mounted() {
    console.log(this.settings)
  }
}
</script>
<style lang="scss" scoped>
.no-flex-direction{
  flex-direction: unset
}
select.keyboard-shortcut{
  -webkit-appearance: none;
  background: rgba(0,0,0,.1);
  margin-right: .5em;
  padding: .15em .7em;
  font-size: 90%;
  outline: 0;
}
</style>
