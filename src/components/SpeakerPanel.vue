<template>
  <v-flex :style="theme" class="speaker-panel">
    <v-dialog
      lazy
      :transition="false"
      scrollable
      style="max-width: 600px"
      v-model="showSpeakerTierEditModal">
      <v-card>
        <v-card-title>Speakers and Tiers</v-card-title>
        <v-card-text>
          <speaker-tier-editor
            :speakers="eventStore.metadata.speakers"
            :tiers="eventStore.metadata.tiers"
            @update:tiers="updateTiers"
            @update:speakers="updateSpeakers"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn>close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <div
      :style="{height: speakerHeight + 1}"
      :key="i"
      v-for="(speaker, i) in eventStore.metadata.speakers"
      class="speaker">
      <v-menu
        lazy
        close-delay="500"
        :transition="false"
        right
        offset-x
        nudge-right="12"
        nudge-top="5">
        <div slot="activator" class="speaker-name">
          <span class="speaker-triangle">▶</span> {{ speaker.k }}
          <div
            class="secondary-tiers"
            :style="{ lineHeight: tierHeight + 1 + 'px' }"
            v-for="tier in secondaryVisibleTiers" :key="tier.id">
            {{ tier.name }}
          </div>
        </div>
        <v-list class="context-menu-list" dense>
          <v-list-tile @click="expandOrCollapse">
            <v-list-tile-avatar>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title v-if="!allExpanded">Expand all</v-list-tile-title>
              <v-list-tile-title v-else>Collapse all</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider />
          <v-list-tile
            v-for="(tier, i) in eventStore.metadata.tiers"
            :key="i"
            :disabled="tier.id === eventStore.metadata.defaultTier"
            @click="tier.show = !tier.show">
            <v-list-tile-avatar>
              <v-icon v-if="tier.show === true || tier.id === eventStore.metadata.defaultTier">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ tier.name }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider />
          <v-list-tile @click="openSpeakerAndTierSettings">
            <v-list-tile-avatar />
            <v-list-tile-content>
              <v-list-tile-title>Edit Speakers and Tiers…</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-menu>
    </div>
  </v-flex>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import { eventStore, LocalTranscriptTier, LocalTranscriptSpeakers } from '../store/transcript'

import SpeakerTierEditor from './SpeakerTierEditor.vue'

@Component({
  components: {
    SpeakerTierEditor
  }
})
export default class SpeakerPanel extends Vue {

  settings = settings
  eventStore = eventStore
  tierHeight = 25

  showSpeakerTierEditModal = false

  get speakerHeight(): string {
    return eventStore.metadata.tiers.filter(t => t.show === true).length * this.tierHeight + 1 + 'px'
  }

  get secondaryVisibleTiers(): LocalTranscriptTier[] {
    return eventStore.metadata.tiers.filter((t, k) => t.id !== eventStore.metadata.defaultTier && t.show === true)
  }

  get allExpanded(): boolean {
    return eventStore.metadata.tiers.every(t => t.id === eventStore.metadata.defaultTier || t.show === true)
  }

  expandOrCollapse() {
    if (this.allExpanded) {
      return this.collapseAll()
    } else {
      return this.expandAll()
    }
  }

  updateTiers(ts: LocalTranscriptTier[]) {
    console.log(ts)
  }

  updateSpeakers(ss: LocalTranscriptSpeakers) {
    console.log(ss)
  }

  openSpeakerAndTierSettings() {
    this.showSpeakerTierEditModal = true
  }

  expandAll() {
    eventStore.metadata.tiers = eventStore.metadata.tiers.map((t) => {
      return {...t, show: true}
    })
  }

  collapseAll() {
    eventStore.metadata.tiers = eventStore.metadata.tiers.map((t) => {
      return {...t, show: t.id === eventStore.metadata.defaultTier}
    })
  }

  get theme() {
    if (this.settings.darkMode) {
      return {}
    } else {
      return { background: '#fafafa' }
    }
  }
}
</script>
<style lang="stylus" scoped>
.speaker-panel
  z-index 1
  padding-top 27px
  flex-grow 0

.secondary-tiers
  text-align right
  opacity .5

.speaker
  cursor default
  padding 0 1em
  border-radius 1px
  border-bottom 1px solid rgba(255,255,255,.1)
  font-weight 300
  font-size 90%
  line-height 1.6em
  &:last-child
    border-bottom 0
  &:hover
    background rgba(0,0,0,0)
  .speaker-name
    opacity .7
    white-space nowrap
  .speaker-triangle
    font-size 70%
    display inline-block
    vertical-align middle
    margin-right .2em

</style>
