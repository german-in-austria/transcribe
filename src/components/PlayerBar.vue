<template>
  <div :style="theme" class="playerbar">
    <v-container class="pt-0" align-content-center justify-center>
      <v-layout row justify-space-between class="">
        <v-flex text-xs-left xs2>
          <div class="caption grey--text lighten-2">
            <v-slider
              color="grey darken-4"
              thumb-color="grey lighten-1"
              hide-details
              :min="10"
              :max="100"
              thumb-label
              dark
              :value="settings.playbackSpeed * 100"
              @input="setPlaybackSpeed($event / 100)" />
            Playback Speed
          </div>
        </v-flex>
        <v-flex class="pt-3 display-area" offset-xs2 xs4 align-content-center>
          <v-btn class="play-button" @click="playPause" large icon flat>
            <v-icon v-if="eventStore.isPaused" x-large>play_arrow</v-icon>
            <v-icon v-else x-large>pause</v-icon>
          </v-btn>
          <div ref="currentTime" class="current-time"></div>
        </v-flex>
        <v-flex text-xs-left offset-xs2 xs2>
          <div class="caption grey--text lighten-2">
            <v-slider
              color="grey darken-4"
              thumb-color="grey lighten-1"
              hide-details
              :min="0"
              :max="100"
              dark
              thumb-label
              :value="settings.playbackVolume * 100"
              @input="setPlaybackVolume($event / 100)" />
            Volume
          </div>
        </v-flex>
      </v-layout>
    </v-container>
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
import {
  eventStore,
  toTime,
  playAllFrom,
  pause
} from '../store/transcript'
import { requestFrameAsync, isCmdOrCtrl } from '../util/index'

@Component
export default class PlayerBar extends Vue {

  eventStore = eventStore
  audioStore = audio.store
  currentTime = eventStore.audioElement.currentTime
  setPlaybackSpeed = setPlaybackSpeed
  setPlaybackVolume = setPlaybackVolume
  settings = settings
  toTime = toTime

  playPause(e: Event) {
    if (eventStore.isPaused) {
      playAllFrom(eventStore.currentTime)
    } else {
      pause()
    }
  }

  get theme() {
    if (this.settings.darkMode) {
      return {}
    } else {
      return { background: '#efefef' }
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
    border-radius 1em
    span:nth-last-child(-n+4)
      opacity .5
</style>

<style lang="stylus" scoped>
.display-area
  background rgba(0,0,0,.3)

.playerbar
  z-index 3
  position sticky
  left 0
  right 0
  bottom 0
  height 70px
  text-align center

.play-button
  position relative
  top 3px
  margin-left -10px
  margin-top -7px

</style>

