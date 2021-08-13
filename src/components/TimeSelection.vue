<template>
  <div
    v-if="
      transcript.uiState.timeSpanSelection.start !== null &&
      transcript.uiState.timeSpanSelection.end !== null"
    :style="{
      left: getSelectionLeft() * settings.pixelsPerSecond + 'px',
      width: getSelectionLength() * settings.pixelsPerSecond + 'px'
    }"
    class="selection">
    <div class="selection-length">
      {{ getSelectionLength().toFixed(2) }} sec
    </div>
  </div>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '@/store/settings.store'
import Transcript from '@/classes/transcript.class'

@Component
export default class TimeSelection extends Vue {
  @Prop({ required: true }) transcript!: Transcript
  settings = settings

  getSelectionLeft() {
    return Math.min(this.transcript.uiState.timeSpanSelection.start || 0, this.transcript.uiState.timeSpanSelection.end || 0)
  }

  getSelectionLength() {
    return Math.abs(
      (this.transcript.uiState.timeSpanSelection.end || 0) -
      (this.transcript.uiState.timeSpanSelection.start || 0)
    )
  }

}
</script>
<style lang="scss" scoped>
</style>
