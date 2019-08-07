<template>
  <v-flex :style="theme" class="pt-4 speaker-panel" xs1>
    <div
      :style="{height: speakerHeight}"
      :key="i" v-for="(speaker, i) in eventStore.metadata.speakers"
      class="speaker">
      <v-menu
        close-delay="500"
        transition="fade-transition"
        right
        offset-x
        nudge-right="12"
        nudge-top="5">
        <div slot="activator" class="speaker-name">
          <span class="speaker-triangle">▶</span> {{ speaker.k }}
          <div
            class="secondary-tiers"
            :style="{ lineHeight: tierHeight + 'px' }"
            v-for="tier in secondaryVisibleTiers" :key="tier.name">
            {{ tier.name }}
          </div>
        </div>
        <v-list class="context-menu-list" dense>
          <v-list-tile
            v-for="(tier, i) in eventStore.metadata.tiers"
            :key="i"
            :disabled="tier.id === eventStore.metadata.defaultTier"
            @click="tier.show = !tier.show">
            <v-list-tile-avatar>
              <v-icon v-if="tier.show === true">check</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ tier.id }}</v-list-tile-title>
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
import { eventStore } from '../store/transcript'

@Component
export default class SpeakerPanel extends Vue {

  @Prop() prop: string|null
  settings = settings
  eventStore = eventStore
  tierHeight = 25

  get speakerHeight() {
    return eventStore.metadata.tiers.filter(t => t.show === true).length * this.tierHeight + 1 + 'px'
  }

  get secondaryVisibleTiers() {
    return eventStore.metadata.tiers.filter(t => t.name !== 'default' && t.show === true)
  }

  get theme() {
    if (this.settings.darkMode) {
      return {}
    } else {
      return { background: '#efefef' }
    }
  }
}
</script>
<style lang="stylus" scoped>
.speaker-panel
  z-index 1

.secondary-tiers
  text-align right
  opacity .5

.speaker
  cursor default
  padding .2em 1em
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
