<template>
  <div class="playerbar">
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
            {{ currentTime.toFixed(2) }}
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

@Component
export default class App extends Vue {

  @Prop() audioElement: HTMLAudioElement

  isPaused = true
  currentTime = this.audioElement.currentTime
  playbackRate = 100
  volume = 100
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
  text-align: center
  background: #f4f4f4

.play-button
  margin-top: -5px

.current-time
  display: block
  width: 185px
  background: rgba(0,0,0,.075)
  margin: 0 auto
  border-radius: 1em

</style>

