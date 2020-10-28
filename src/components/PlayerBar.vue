<template>
  <div :style="{minHeight: height}" :class="['playerbar', settings.darkMode && 'theme--dark']">
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
          <v-icon>mdi-contain-start</v-icon>
        </player-bar-button>
        <player-bar-button @click="playEnd" :size="height">
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
        <player-bar-button @click="playPause" :size="height">
          <v-icon v-if="eventStore.isPaused && timeSpanSelectionIsEmpty()">play_arrow</v-icon>
          <v-icon v-if="eventStore.isPaused && !timeSpanSelectionIsEmpty()">mdi-play-outline</v-icon>
          <v-icon v-if="!eventStore.isPaused">pause</v-icon>
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
              <v-icon>mdi-replay</v-icon>
            </player-bar-button>
            <player-bar-button :size="height">
              <v-icon class="mirror">mdi-replay</v-icon>
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
                <v-icon v-if="settings.playbackVolume === 0">
                  mdi-volume-variant-off
                </v-icon>
                <v-icon v-else-if="settings.playbackVolume <= .33">
                  mdi-volume-low
                </v-icon>
                <v-icon v-else-if="settings.playbackVolume > .33 && settings.playbackVolume <= .66">
                  mdi-volume-medium
                </v-icon>
                <v-icon v-else-if="settings.playbackVolume > .66">
                  mdi-volume-high
                </v-icon>
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
                <v-icon v-if="settings.playbackSpeed <= .33">mdi-speedometer-slow</v-icon>
                <v-icon v-if="settings.playbackSpeed > .33 && settings.playbackSpeed <= .66">mdi-speedometer-medium</v-icon>
                <v-icon v-if="settings.playbackSpeed > .66">mdi-speedometer</v-icon>
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
import settings, {
  setPlaybackSpeed,
  setPlaybackVolume
} from '../store/settings'
import audio from '../service/audio'
import eventBus from '../service/event-bus'
import PlayerBarButton from './PlayerBarButton.vue'
import TimePicker from './TimePicker.vue'
import {
  eventStore,
  toTime,
  playAllFrom,
  pause,
  getSelectedEvents,
  playEvents,
  playEventsStart,
  playEventsEnd,
  playRange,
  timeSpanSelectionIsEmpty
} from '../store/transcript'

@Component({
  components: {
    PlayerBarButton,
    TimePicker
  }
})
export default class PlayerBar extends Vue {

  @Prop({ default: 64 }) height!: number

  eventStore = eventStore
  audioStore = audio.store
  currentTime = eventStore.audioElement.currentTime
  setPlaybackSpeed = setPlaybackSpeed
  setPlaybackVolume = setPlaybackVolume
  settings = settings
  toTime = toTime
  timeSpanSelectionIsEmpty = timeSpanSelectionIsEmpty
  showTimePicker = false

  cachedVolume = settings.playbackVolume
  cachedSpeed = .5

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
    if (eventStore.isPaused === true) {
      const es = getSelectedEvents()
      if (!timeSpanSelectionIsEmpty()) {
        playRange(eventStore.userState.timeSpanSelection.start || 0, eventStore.userState.timeSpanSelection.end || 0)
      } else if (es.length > 0) {
        playEvents(es)
      } else {
        playAllFrom(eventStore.currentTime)
      }
    } else {
      pause()
    }
  }

  playStart() {
    if (eventStore.isPaused === true) {
      const es = getSelectedEvents()
      if (es.length > 0) {
        playEventsStart(es, 1)
      }
    } else {
      pause()
    }
  }

  playEnd() {
    if (eventStore.isPaused === true) {
      const es = getSelectedEvents()
      if (es.length > 0) {
        playEventsEnd(es, 1)
      }
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

