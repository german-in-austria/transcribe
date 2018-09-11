<template>
  <div :style="theme" class="playerbar">
    <v-container>
      <v-layout row justify-space-between class="">
        <v-flex text-xs-left xs2>
          <div class="caption grey--text lighten-2">
            <v-slider
              color="grey"
              thumb-color="grey darken-2"
              hide-details
              :min="10"
              :max="100"
              thumb-label
              v-model="playbackRate" />
            Playback Speed
          </div>
        </v-flex>
        <v-flex xs12>
          <v-btn class="play-button" @click="playPause" large icon flat>
            <v-icon v-if="isPaused" x-large>play_arrow</v-icon>
            <v-icon v-else x-large>pause_circle_outline</v-icon>
          </v-btn>
          <div class="current-time">
            {{ toTime(currentTime) }}
          </div>
        </v-flex>
        <v-flex text-xs-left xs2>
          <div class="caption grey--text lighten-2">
            <v-slider
              color="grey"
              thumb-color="grey darken-2"
              hide-details
              :min="0"
              :max="100"
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

@Component
export default class PlayerBar extends Vue {

  @Prop() audioElement: HTMLAudioElement

  isPaused = true
  currentTime = this.audioElement.currentTime
  playbackRate = 100
  volume = 100
  settings = settings

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
  }

  @Watch('volume')
  onVolumeChange(volume: number) {
    this.audioElement.volume = volume / 100
  }

  toTime(time: number) {
    return new Date(time * 1000).toISOString().substr(11, 12)
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
  position: fixed
  left: 0
  right: 0
  bottom: 0
  height: 100px
  text-align center

.play-button
  margin-top: -5px

.current-time
  font-size 110%
  display: block
  width: 185px
  background: rgba(0,0,0,.15)
  margin: 0 auto
  border-radius: 1em

</style>

