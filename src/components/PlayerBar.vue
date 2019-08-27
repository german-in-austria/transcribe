<template>
  <div :class="['playerbar', settings.darkMode && 'theme--dark']">
    <v-layout row>
      <v-flex xs4 text-xs-right>
        <player-bar-button>
          <v-icon>mdi-contain-start</v-icon>
        </player-bar-button>
        <player-bar-button>
          <v-icon>mdi-contain-end</v-icon>
        </player-bar-button>
      </v-flex>
      <v-flex
        :class="[
          'display-area',
          settings.darkMode && 'theme--dark'
        ]"
        xs4
        align-content-center>
        <player-bar-button @click="playPause">
          <v-icon v-if="eventStore.isPaused">play_arrow</v-icon>
          <v-icon v-else>pause</v-icon>
        </player-bar-button>
        <div ref="currentTime" class="current-time"></div>
      </v-flex>
      <v-flex xs4>
        <v-layout>
          <v-flex text-xs-left>
            <player-bar-button>
              <v-icon>mdi-replay</v-icon>
            </player-bar-button>
            <player-bar-button>
              <v-icon class="mirror">mdi-replay</v-icon>
            </player-bar-button>
          </v-flex>
          <v-flex text-xs-right>
            <v-spacer />
            <v-menu
              :close-on-content-click="false"
              nudge-top="50"
              open-on-hover
              top>
              <player-bar-button @click="toggleVolumeOnOff" slot="activator">
                <v-icon v-if="settings.playbackVolume <= .33">
                  mdi-volume-low
                </v-icon>
                <v-icon v-if="settings.playbackVolume > .33 && settings.playbackVolume <= .66">
                  mdi-volume-medium
                </v-icon>
                <v-icon v-if="settings.playbackVolume > .66">
                  mdi-volume-high
                </v-icon>
              </player-bar-button>
              <div class="pl-4 pr-4">
                <v-slider
                  hide-details
                  :label="`Volume (${ (settings.playbackVolume * 100).toFixed(0) }%)`"
                  inverse-label
                  :min="0"
                  :max="100"
                  :value="settings.playbackVolume * 100"
                  @input="setPlaybackVolume($event / 100)" />
              </div>
            </v-menu>
            <v-menu
              :close-on-content-click="false"
              nudge-top="50"
              open-on-hover
              top>
              <player-bar-button @click="toggleSpeed" slot="activator">
                <v-icon v-if="settings.playbackSpeed <= .33">mdi-speedometer-slow</v-icon>
                <v-icon v-if="settings.playbackSpeed > .33 && settings.playbackSpeed <= .66">mdi-speedometer-medium</v-icon>
                <v-icon v-if="settings.playbackSpeed > .66">mdi-speedometer</v-icon>
              </player-bar-button>
              <div class="pl-4 pr-4">
                <v-slider
                  hide-details
                  :label="`Speed (${ (settings.playbackSpeed * 100).toFixed(0) }%)`"
                  inverse-label
                  :min="10"
                  :max="100"
                  :value="settings.playbackSpeed * 100"
                  @input="setPlaybackSpeed($event / 100)" />
              </div>
            </v-menu>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-layout>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings, {
  increasePlaybackSpeed,
  decreasePlaybackSpeed,
  setPlaybackSpeed,
  setPlaybackVolume,
  increaseVolume,
  decreaseVolume
} from '../store/settings'
import audio from '../service/audio'
import eventBus from '../service/event-bus'
import PlayerBarButton from './PlayerBarButton.vue'
import {
  eventStore,
  toTime,
  playAllFrom,
  pause
} from '../store/transcript'
import { requestFrameAsync, isCmdOrCtrl } from '../util/index'

@Component({
  components: {
    PlayerBarButton
  }
})
export default class PlayerBar extends Vue {

  eventStore = eventStore
  audioStore = audio.store
  currentTime = eventStore.audioElement.currentTime
  setPlaybackSpeed = setPlaybackSpeed
  setPlaybackVolume = setPlaybackVolume
  settings = settings
  toTime = toTime

  cachedVolume = settings.playbackVolume
  cachedSpeed = settings.playbackSpeed

  toggleVolumeOnOff() {
    if (settings.playbackVolume === 0) {
      setPlaybackVolume(this.cachedVolume)
    } else {
      this.cachedVolume = settings.playbackVolume
      setPlaybackVolume(0)
    }
  }

  toggleSpeed() {
    if (settings.playbackSpeed === 1) {
      setPlaybackSpeed(this.cachedSpeed)
    } else {
      this.cachedSpeed = settings.playbackSpeed
      setPlaybackSpeed(1)
    }
  }

  playPause(e: Event) {
    if (eventStore.isPaused) {
      playAllFrom(eventStore.currentTime)
    } else {
      pause()
    }
  }

  updateTimeDisplay(seconds: number, e: HTMLElement) {
    const newT = toTime(seconds, 3)
    e.innerHTML = newT.split('').reduce((m, d) => {
      m += `<span>${d}</span>\n`
      return m
    }, '' as string)
  }

  onChangeTime(t: number) {
    requestAnimationFrame(() => {
      this.updateTimeDisplay(t, this.$refs.currentTime as HTMLElement)
    })
  }

  mounted() {
    eventBus.$on('updateTime', this.onChangeTime)
    eventBus.$on('scrubAudio', this.onChangeTime)
    this.onChangeTime(eventStore.currentTime)
  }
}
</script>
<style lang="stylus">
.playerbar
  .current-time
    will-change contents
    font-size 110%
    display inline-block
    width 155px
    margin 0 auto
    span:nth-last-child(-n+4)
      opacity .5
</style>

<style lang="stylus" scoped>
.display-area
  background white
  &.theme--dark
    background rgba(0,0,0,.3)

.playerbar
  z-index 3
  position sticky
  left 0
  right 0
  bottom 0
  min-height 70px
  text-align center
  background #efefef
  &.theme--dark
    background #191919

.play-button
  margin-left -10px

.button
  position relative
  top 3px
  margin-top -7px
</style>

