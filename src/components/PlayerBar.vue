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
              v-model="audioStore.playbackRate" />
            Playback Speed
          </div>
        </v-flex>
        <v-flex class="pt-3" xs12 align-content-center>
          <v-btn class="play-button" @click="playPause" large icon flat>
            <v-icon v-if="isPaused" x-large>play_arrow</v-icon>
            <v-icon v-else x-large>pause_circle_outline</v-icon>
          </v-btn>
          <div class="current-time">
            <span
              v-for="(digit, i) in (toTime(currentTime, 3).split(''))"
              :key="i"
              class="digit">
              {{ digit }}
            </span>
          </div>
        </v-flex>
        <v-flex text-xs-left xs2>
          <div class="caption grey--text lighten-2">
            <v-slider
              color="grey darken-4"
              thumb-color="grey lighten-1"
              hide-details
              :min="0"
              :max="100"
              dark
              thumb-label
              v-model="volume" />
            Volume
          </div>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '@store/settings'
import audio from '../service/audio'
import { toTime } from '@store/transcript'

@Component
export default class PlayerBar extends Vue {

  @Prop() audioElement: HTMLAudioElement

  isPaused = true
  currentTime = this.audioElement.currentTime
  audioStore = audio.store
  volume = 100
  settings = settings
  toTime = toTime
  playPause(e: Event) {
    if (this.isPaused) {
      this.audioElement.play()
    } else {
      this.audioElement.pause()
    }
  }

  @Watch('playbackRate')
  onPlaybackRateChange(rate: number) {
    this.setPlaybackRate(rate)
  }

  setPlaybackRate(rate: number) {
    this.audioElement.playbackRate = rate / 100
    console.log(this.audioElement)
  }

  @Watch('volume')
  onVolumeChange(volume: number) {
    this.audioElement.volume = volume / 100
  }

  get theme() {
    if (this.settings.darkMode) {
      return { background: '#383838' }
    } else {
      return { background: '#efefef' }
    }
  }

  mounted() {
    this.audioElement.addEventListener('play', () => {
      this.isPaused = false
    })
    this.audioElement.addEventListener('pause', () => {
      this.isPaused = true
    })
    this.audioElement.addEventListener('timeupdate', (e) => {
      this.currentTime = this.audioElement.currentTime
    })
  }
}
</script>
<style lang="stylus" scoped>
.playerbar
  z-index 3
  position fixed
  left 0
  right 0
  bottom 0
  height 70px
  text-align center

.play-button
  margin-top -5px

.current-time
  font-size 110%
  display inline-block
  width 185px
  background rgba(0,0,0,.15)
  margin 0 auto
  border-radius 1em

</style>

