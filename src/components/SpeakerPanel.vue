<template>
  <v-flex :style="theme" class="speaker-panel">
    <div
      :style="{ height: speakerHeight + 1 }"
      :key="sId"
      v-for="(speaker, sId) in transcript.meta.speakers"
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
          <template v-for="tier in secondaryVisibleTiers[sId]">
            <div
              class="secondary-tiers"
              :style="{ lineHeight: tierHeight + 1 + 'px' }"
              v-if="tier.show[sId]"
              :key="tier.id">
              {{ tier.name }}
            </div>
          </template>
        </div>
        <v-list class="context-menu-list" dense>
          <v-list-tile @click="expandAll" v-if="!areAllExpanded || !areAllExpandedSpeaker[sId]">
            <v-list-tile-avatar>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>Expand all</v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon ripple :title="speaker.k"
              @click.stop="expandSpeaker(sId)"><v-icon :color="'grey ' + (areAllExpandedSpeaker[sId] ? 'darken-3' : 'lighten-2')">mdi-account</v-icon></v-btn>
            </v-list-tile-action>
          </v-list-tile>
          <v-list-tile @click="collapseAll" v-if="!areAllCollapsed || !areAllCollapsedSpeaker[sId]">
            <v-list-tile-avatar>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>Collapse all</v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon ripple :title="speaker.k"
                @click.stop="collapseSpeaker(sId)"><v-icon :color="'grey ' + (areAllCollapsedSpeaker[sId] ? 'darken-3' : 'lighten-2')">mdi-account</v-icon></v-btn>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider />
          <v-list-tile
            v-for="(tier, i) in transcript.meta.tiers"
            :key="i"
            :disabled="tier.id === transcript.meta.defaultTier"
            @click="toggleTier(tier)">
            <v-list-tile-avatar>
              <v-icon v-if="tier.id === transcript.meta.defaultTier || Object.keys(transcript.meta.speakers).every(s => tier.show[s] === true)">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ tier.name }}</v-list-tile-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn icon ripple :title="speaker.k"
                :disabled="tier.id === transcript.meta.defaultTier"
                @click.stop="toggleSpeakerTier(tier, sId)"><v-icon :color="'grey ' + (tier.id === transcript.meta.defaultTier || tier.show[sId] ? 'darken-3' : 'lighten-2')">mdi-account</v-icon></v-btn>
            </v-list-tile-action>
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
    var r:any = {}
    Object.keys(this.transcript.meta.speakers).forEach(sId => {
      r[sId] = this.transcript.meta.tiers.filter(t => t.id !== this.transcript.meta.defaultTier && t.show[sId] === true)
    })
    return r
  }

  get areAllExpanded(): boolean {
    return this.transcript.meta.tiers.every(t => t.id === this.transcript.meta.defaultTier || (t.show === Object.keys(this.transcript.meta.speakers).forEach(sId => t.show[sId] === true)))
  }

  get areAllExpandedSpeaker(): boolean {
    var r:any = {}
    Object.keys(this.transcript.meta.speakers).forEach(sId => {
      r[sId] = this.transcript.meta.tiers.every(t => t.id === this.transcript.meta.defaultTier || t.show[sId] === true)
    })
    return r
  }

  get areAllCollapsed(): boolean {
    return this.transcript.meta.tiers.every(t => t.id === this.transcript.meta.defaultTier || (t.show === Object.keys(this.transcript.meta.speakers).forEach(sId => !t.show[sId])))
  }

  get areAllCollapsedSpeaker(): boolean {
    var r:any = {}
    Object.keys(this.transcript.meta.speakers).forEach(sId => {
      r[sId] = this.transcript.meta.tiers.every(t => t.id === this.transcript.meta.defaultTier || !t.show[sId])
    })
    return r
  }

  toggleTier(tier:TranscriptTier) {
    var stat:boolean = Object.keys(this.transcript.meta.speakers).every(s => tier.show[s] === true)
    Object.keys(this.transcript.meta.speakers).forEach(sId => {
      this.$set(tier.show, sId, !stat)
    })
  }

  toggleSpeakerTier(tier:TranscriptTier, sId:any) {
    this.$set(tier.show, sId, !tier.show[sId])
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
    this.$set(this.transcript.meta, 'tiers', this.transcript.meta.tiers.map((t) => {
      var r:any = {}
      Object.keys(this.transcript.meta.speakers).forEach(sId => {
        r[sId] = true
      })
      return { ...t, show: r }
    }))
  }

  expandSpeaker(sId:any) {
    this.transcript.meta.tiers.forEach(t => {
      this.$set(t.show, sId, true)
    })
  }

  collapseAll() {
    this.$set(this.transcript.meta, 'tiers', this.transcript.meta.tiers.map((t) => {
      return { ...t, show: {} }
    }))
  }

  collapseSpeaker(sId:any) {
    this.transcript.meta.tiers.forEach(t => {
      this.$set(t.show, sId, false)
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
