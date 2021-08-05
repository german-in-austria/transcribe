<template>
  <div :style="{ minHeight: height }" :class="['playerbar', settings.darkMode && 'theme--dark']">
    <v-dialog
      @keydown.esc="showTimePicker = false"
      lazy
      max-width="700"
      v-model="showTimePicker">
      <time-picker v-if="showTimePicker === true" @close="showTimePicker = false" />
    </v-dialog>
    <v-layout row>
      <v-flex xs4 text-xs-right>
        <player-bar-button @click="playStart" :size="height">
          <f-icon value="mdi-contain-start" />
        </player-bar-button>
        <player-bar-button @click="playEnd" :size="height">
          <f-icon value="mdi-contain-end" />
        </player-bar-button>
      </v-flex>
      <v-flex
        :class="[
          'display-area',
          settings.darkMode && 'theme--dark'
        ]"
        xs4
        align-content-center>
        <player-bar-button @click="playPause" :size="height">
          <f-icon v-if="this.transcript.audio && this.transcript.audio.isPaused && isTimeSpanSelectionEmpty()" value="play_arrow" />
          <f-icon v-if="this.transcript.audio && this.transcript.audio.isPaused && !isTimeSpanSelectionEmpty()" value="mdi-play-outline" />
          <f-icon v-if="this.transcript.audio && !this.transcript.audio.isPaused" value="pause" />
        </player-bar-button>
        <div
          @click="showTimePicker = false"
          ref="currentTime"
          class="current-time"></div>
      </v-flex>
      <v-flex xs4>
        <v-layout>
          <v-flex text-xs-left>
            <player-bar-button :size="height">
              <f-icon value="mdi-replay" />
            </player-bar-button>
            <player-bar-button :size="height">
              <f-icon value="mdi-replay" class="mirror" />
            </player-bar-button>
          </v-flex>
          <v-flex text-xs-right>
            <v-spacer />
            <v-menu
              lazy
              :close-on-content-click="false"
              nudge-top="50"
              min-width="310"
              open-on-hover
              top>
              <player-bar-button @click="toggleVolumeOnOff" slot="activator" :size="height">
                <f-icon value="mdi-volume-variant-off" v-if="settings.playbackVolume === 0" />
                <f-icon value="mdi-volume-low" v-else-if="settings.playbackVolume <= .33" />
                <f-icon value="mdi-volume-medium" v-else-if="settings.playbackVolume > .33 && settings.playbackVolume <= .66" />
                <f-icon value="mdi-volume-high" v-else-if="settings.playbackVolume > .66" />
              </player-bar-button>
              <div class="pl-4 pr-4">
                <v-slider
                  hide-details
                  :label="`Volume (${ (settings.playbackVolume * 100).toFixed(0) }%)`"
                  :min="0"
                  :max="100"
                  :value="settings.playbackVolume * 100"
                  @input="setPlaybackVolume($event / 100)" />
              </div>
            </v-menu>
            <v-menu
              lazy
              :close-on-content-click="false"
              nudge-top="50"
              min-width="310"
              open-on-hover
              top>
              <player-bar-button @click="toggleSpeed" slot="activator" :size="height">
                <f-icon v-if="settings.playbackSpeed <= .33" value="mdi-speedometer-slow" />
                <f-icon v-if="settings.playbackSpeed > .33 && settings.playbackSpeed <= .66" value="mdi-speedometer-medium" />
                <f-icon v-if="settings.playbackSpeed > .66" value="mdi-speedometer" />
              </player-bar-button>
              <div class="pl-4 pr-4">
                <v-slider
                  hide-details
                  :label="`Speed (${ (settings.playbackSpeed * 100).toFixed(0) }%)`"
                  :min="10"
                  :max="150"
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
import store from '@/store'

import {
  setPlaybackSpeed,
  setPlaybackVolume
} from '../store/settings'
import eventBus from '../service/event-bus'
import PlayerBarButton from './PlayerBarButton.vue'
import TimePicker from './TimePicker.vue'
import {
  playAllFrom,
  pause,
  playEvents,
  playEventsStart,
  playEventsEnd,
  playRange
} from '../store/transcript'
import Transcript from '@/service/transcript.class'
import { timeFromSeconds } from '@/util'

@Component({
  components: {
    PlayerBarButton,
    TimePicker
  }
})
export default class PlayerBar extends Vue {

  @Prop({ default: 64 }) height!: number
  @Prop({ required: true }) transcript!: Transcript

  setPlaybackSpeed = setPlaybackSpeed
  setPlaybackVolume = setPlaybackVolume
  settings = store.settings
  isTimeSpanSelectionEmpty = this.transcript.isTimeSpanSelectionEmpty
  showTimePicker = false

  cachedVolume = store.settings.playbackVolume
  cachedSpeed = .5

  get currentTime() {
    return this.transcript.audio ? this.transcript.audio.currentTime : 0
  }

  toggleVolumeOnOff() {
    if (store.settings.playbackVolume === 0) {
      setPlaybackVolume(this.cachedVolume)
    } else {
      this.cachedVolume = store.settings.playbackVolume
      setPlaybackVolume(0)
    }
  }

  toggleSpeed() {
    if (store.settings.playbackSpeed === 1) {
      setPlaybackSpeed(this.cachedSpeed)
    } else {
      this.cachedSpeed = store.settings.playbackSpeed
      setPlaybackSpeed(1)
    }
  }

  playPause() {
    if (this.transcript.audio && this.transcript.audio.isPaused === true) {
      const es = this.transcript.getSelectedEvents()
      if (!this.isTimeSpanSelectionEmpty()) {
        playRange(this.transcript.uiState.timeSpanSelection.start || 0, this.transcript.uiState.timeSpanSelection.end || 0)
      } else if (es.length > 0) {
        playEvents(es)
      } else {
        playAllFrom(this.currentTime)
      }
    } else {
      pause()
    }
  }

  playStart() {
    if (this.transcript.audio && this.transcript.audio.isPaused === true) {
      const es = this.transcript.getSelectedEvents()
      if (es.length > 0) {
        playEventsStart(es, 1)
      }
    } else {
      pause()
    }
  }

  playEnd() {
    if (this.transcript.audio && this.transcript.audio.isPaused === true) {
      const es = this.transcript.getSelectedEvents()
      if (es.length > 0) {
        playEventsEnd(es, 1)
      }
    } else {
      pause()
    }
  }

  updateTimeDisplay(seconds: number, e: HTMLElement|undefined) {
    if (e !== undefined) {
      const newT = timeFromSeconds(seconds, 3)
      e.innerHTML = newT.split('').reduce((m, d) => {
        m += `<span>${d}</span>\n`
        return m
      }, '' as string)
    }
  }

  onChangeTime(t: number) {
    requestAnimationFrame(() => {
      this.updateTimeDisplay(t, this.$refs.currentTime as HTMLElement)
    })
  }

  mounted() {
    eventBus.$on('updateTime', this.onChangeTime)
    eventBus.$on('scrubAudio', this.onChangeTime)
    this.onChangeTime(this.currentTime)
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
    cursor default
    border-radius 13px
    &:hover
      background rgba(255,255,255,.1)
    span:nth-last-child(-n+4)
      opacity .5
</style>

<style lang="stylus" scoped>

.playerbar
  z-index 3
  text-align center
  background #efefef
  &.theme--dark
    background #1d1d1d

</style>

