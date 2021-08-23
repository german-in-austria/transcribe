<template>
  <div>
    <v-progress-circular indeterminate size="16" class="mr-3" width="2" />
    Loading Audio …
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class WaveFormLoadingPlaceholder extends Vue {
  mounted() {
  }
}
</script>
<style lang="stylus" scoped>
div
  height 300px
  letter-spacing 0.1em
  text-transform uppercase
  align-items center
  opacity 0.5
  display flex
  justify-content center
</style>
