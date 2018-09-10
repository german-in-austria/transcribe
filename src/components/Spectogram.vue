<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    @input="$event === false && $emit('close')"
    :value="show"
    max-width="700">
    <v-card>
      <v-card-title class="headline">Spectogram</v-card-title>
      <v-card-text>
        <canvas ref="canvas" />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey lighten-1"
          flat="flat"
          @click="$emit('close')">
          Cancel
        </v-btn>
        <v-btn
          color="green darken-1"
          flat="flat"
          @click="$emit('close')">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import drawSpectogram from '../service/spectogram'
import audio from '../service/audio'
@Component
export default class Settings extends Vue {
  @Prop({ default: false }) show: boolean
  @Prop({ required: true }) segment: Segment
  buffer: AudioBuffer
  mounted() {
    const audioBuffer = audio.decodeBufferTimeSlice(
      this.segment.startTime,
      this.segment.endTime,
      audio.store.uint8Buffer.buffer
    )
  }
}
</script>
<style lang="scss" scoped>
.no-flex-direction{
  flex-direction: unset
}
select.keyboard-shortcut{
  -webkit-appearance: none;
  background: rgba(0,0,0,.1);
  margin-right: .5em;
  padding: .15em .7em;
  font-size: 90%;
  outline: 0;
}
</style>
