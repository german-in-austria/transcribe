<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    @input="$event === false && $emit('close')"
    :value="show"
    max-width="1200">
    <v-card class="text-xs-center pt-3" style="background: rgb(30, 0, 30)">
      <small>Spectogram</small>
      <v-card-text class="pa-0" ref="canvasContainer"></v-card-text>
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
import audio from '../service/audio'
import { LocalTranscriptEvent } from '@store/transcript'

@Component
export default class Settings extends Vue {
  @Prop({ default: false }) show: boolean
  @Prop({ required: true }) event: LocalTranscriptEvent
  buffer: AudioBuffer
  async mounted() {
    const slicedBuffer = await audio.decodeBufferTimeSlice(
      this.event.startTime,
      this.event.endTime,
      audio.store.uint8Buffer.buffer
    )
    const width = 1200
    const c = (await audio.drawSpectogramAsync(slicedBuffer, width, 500)) as HTMLCanvasElement;
    const cont = (this.$refs.canvasContainer as HTMLElement)
    cont.innerHTML = ''
    cont.appendChild(c)
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
