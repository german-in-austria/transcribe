<template>
  <v-flex :style="theme" class="speaker-panel">
    <div
      :style="{ height: speakerHeight + 1 }"
      :key="i"
      v-for="(speaker, i) in transcript.meta.speakers"
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
              <v-list-tile-title v-if="!areAllExpanded">Expand all</v-list-tile-title>
              <v-list-tile-title v-else>Collapse all</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider />
          <v-list-tile
            v-for="(tier, i) in transcript.meta.tiers"
            :key="i"
            :disabled="tier.id === transcript.meta.defaultTier"
            @click="tier.show = !tier.show">
            <v-list-tile-avatar>
              <v-icon v-if="tier.show === true || tier.id === transcript.meta.defaultTier">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ tier.name }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <!-- <v-divider />
          <v-list-tile @click="openSpeakerAndTierSettings">
            <v-list-tile-avatar />
            <v-list-tile-content>
              <v-list-tile-title>Edit Speakers and Tiers…</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile> -->
        </v-list>
      </v-menu>
    </div>
  </v-flex>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { TranscriptTier } from '@/types/transcript'
import store from '@/store'
import settings from '@/store/settings.store'

@Component
export default class SpeakerPanel extends Vue {

  settings = settings
  transcript = store.transcript!
  tierHeight = 25
  isBasicInfoValid = false

  get speakerHeight(): string {
    return this.transcript.meta.tiers.filter(t => t.show === true).length * this.tierHeight + 1 + 'px'
  }

  get secondaryVisibleTiers(): TranscriptTier[] {
    return this.transcript.meta.tiers.filter(t => t.id !== this.transcript.meta.defaultTier && t.show === true)
  }

  get areAllExpanded(): boolean {
    return this.transcript.meta.tiers.every(t => t.id === this.transcript.meta.defaultTier || t.show === true)
  }

  expandOrCollapse() {
    if (this.areAllExpanded) {
      return this.collapseAll()
    } else {
      return this.expandAll()
    }
  }

  openSpeakerAndTierSettings() {
    this.transcript.uiState.showTranscriptMetaSettings = true
  }

  expandAll() {
    this.transcript.meta.tiers = this.transcript.meta.tiers.map((t) => {
      return { ...t, show: true }
    })
  }

  collapseAll() {
    this.transcript.meta.tiers = this.transcript.meta.tiers.map((t) => {
      return { ...t, show: t.id === this.transcript.meta.defaultTier }
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
