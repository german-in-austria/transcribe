<template>
  <div class="transcript-scrollhandle text-xs-center" />
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Triangle extends Vue {
  @Prop({ default: true }) up: any
  @Prop({ default: false }) down: any
  isUp = false
  isDown = false
  mounted() {
    if (this.up === '') {
      this.isUp = true
    } else if (this.down === '') {
      this.isDown = true
    }
  }
}
</script>
<style lang="stylus" scoped>
.transcript-scrollhandle
  border-radius 6px
  height 11px
  user-select none
  margin-top 0
  background #777
  width 50px
  margin-left -8px
</style>
