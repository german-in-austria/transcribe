<template>
  <div @keyup.ctrl.space.stop.prevent="handleSpace">
    <wave-form
      @change-metadata="changeMetadata"
      :data="true"
      :audio-element="audioElement" >
      <segments
        :metadata="metadata"
        :segments="transcript.segments">
        <template slot-scope="segment">
          <div class="segment-inner"></div>
        </template>
      </segments>
    </wave-form>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import waveForm from './Waveform.vue'
import { Transcript } from './App.vue'
import segments from '@components/Segments.vue'

@Component({
  components: {
    waveForm,
    segments
  }
})
export default class  extends Vue {
  @Prop() audioElement: any
  @Prop() transcript: Transcript
  metadata: any = null
  changeMetadata(metadata: any) {
    console.log({metadata})
    this.metadata = metadata
  }
}
</script>
<style lang="scss" scoped>
</style>
