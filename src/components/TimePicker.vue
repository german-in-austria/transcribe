<template>
  <v-card>
    <v-card-text class="pa-5 text-xs-center">
      <input
        autofocus
        :value="toTime(eventStore.currentTime)"
        @input="jumpToTime($event.target.value)"
        @keydown.enter="$emit('close')"
        @keydown.esc="$emit('close')"
        ref="timeSelection"
        class="time-selection"
        type="time"
        min="00:00:00"
        max="01:00:00"
        step="1" />
      <br />
    </v-card-text>
    <v-divider />
    <v-card-actions class="text-xs-center">
      <v-spacer />
      <v-btn @click="$emit('close')">Done</v-btn>
    </v-card-actions>
  </v-card>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import {
  toTime,
  eventStore,
  toSeconds,
  scrollToAudioTime,
  scrubAudio,
  deselectEvents
} from '../store/transcript'
@Component
export default class TimePicker extends Vue {

  eventStore = eventStore
  toTime = toTime

  mounted() {
    const r = this.$refs.timeSelection
    if (r instanceof HTMLElement) {
      r.focus()
    }
  }
  // FIXME: this seems to screw up scrolling afterwards
  jumpToTime(time: string) {
    deselectEvents()
    const t = toSeconds(time)
    requestAnimationFrame(() => {
      scrollToAudioTime(t)
      scrubAudio(t)
    })
  }

}
</script>
<style lang="stylus" scoped>
.time-selection
  font-size 200%
  background rgba(0,0,0,.2)
  padding-left 1.7em
  border-radius 5px
</style>
