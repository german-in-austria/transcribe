<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    @input="$event === false && $emit('close')"
    :value="show"
    style="height: 90%"
    max-width="100%">
    <v-card class="spectrogram-main pt-3" style="background: rgb(10, 10, 10);">
      <small class="text-xs-center pb-2">Spectrogram</small>
      <v-card-text class="pa-0">
        <v-layout column>
          <v-flex>
            <v-layout style="background: rgb(10,10,10)" row>
              <v-flex class="pl-0" style="min-height: 300px" xs8>
                <div style="overflow-x: scroll;" :class="{ 'fit-size': fitSize, 'mt-4': true }" ref="canvasContainer" />
                <v-checkbox class="ml-4" v-model="fitSize" label="fit size" />
              </v-flex>
              <v-flex xs4>
                 <v-sparkline
                  style="height: 100%"
                  :smooth="0"
                  :gradient="['#f72047', '#ffd200', '#1feaea']"
                  :line-width="1"
                  :value="f"
                  stroke-linecap="round"
                ></v-sparkline>
              </v-flex>
            </v-layout>
          </v-flex>
          <v-flex class="pt-3 pb-3 text-xs-center" style="background: rgb(27,27,27)">
            <segment-transcript class="text-xs-left" style="border-left: 0;" :event="event" />
          </v-flex>
        </v-layout>
      </v-card-text>
      <v-card-actions style="background: rgb(37, 37, 37)">
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
import segmentTranscript from './SegmentTranscript.vue'
import { LocalTranscriptEvent } from '@store/transcript'

@Component({
  components: {
    segmentTranscript
  }
})
export default class Settings extends Vue {

  @Prop({ default: false }) show: boolean
  @Prop({ required: true }) event: LocalTranscriptEvent
  fitSize = true
  f: number[] = []

  async mounted() {
    const slicedBuffer = await audio.decodeBufferTimeSlice(
      this.event.startTime,
      this.event.endTime,
      audio.store.uint8Buffer.buffer
    )
    const width = 1200
    const height = 250
    const [c, f] = (await audio.drawSpectrogramAsync(slicedBuffer, width, height))
    c.style.width = `${width}px`
    c.style.height = `${height}px`
    const cont = (this.$refs.canvasContainer as HTMLElement)
    cont.innerHTML = ''
    cont.appendChild(c)
    const step = (i = 0) => {
      if (f[i] !== undefined) {
        this.f = Array.from(f[i]).reverse()
        requestAnimationFrame(() => step(i + 1))
      }
    }
    step()
    // const wl = await audio.drawWave(slicedBuffer, 1000, 300, undefined, 0, false)
    // const wr = await audio.drawWave(slicedBuffer, 1000, 300, undefined, 1, false)

  }
}
</script>
<style lang="stylus">

.spectrogram-main canvas
  transition .5s width

.spectrogram-main .fit-size canvas
  width 100% !important
  height 250px !important
</style>

<style lang="stylus" scoped>
.spectrogram-main
  height 100%

.no-flex-direction
  flex-direction: unset

select.keyboard-shortcut
  -webkit-appearance: none;
  background: rgba(0,0,0,.1);
  margin-right: .5em;
  padding: .15em .7em;
  font-size: 90%;
  outline: 0;

</style>
