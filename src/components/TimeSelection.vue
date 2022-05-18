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
<style lang="stylus" scoped>
.selection-length
  background cornflowerblue
  color white
  font-size 85%
  text-align center
  line-height 22px
  height 22px
  user-select none
  overflow hidden
  position absolute
  top 0
  border-bottom-right-radius 8px
  border-top-left-radius 7px
  margin 0 auto
  padding 0 10px

.selection
  top 50px
  bottom 60px
  position absolute
  background rgba(100, 149, 237, 0.2)
  border 1px solid cornflowerblue
  border-radius 8px
  opacity 1
  z-index 2
  pointer-events none

</style>
