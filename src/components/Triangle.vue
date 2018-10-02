<template>
  <div class="transcript-scrollhandle text-xs-center">
    <v-icon large v-if="isUp">arrow_drop_up</v-icon>
    <v-icon large v-else>arrow_drop_down</v-icon>
  </div>
  <!-- <div
    :style="{
        borderBottom: isUp ? '1px solid rgba(255,255,255,.4)' : '0',
        borderTop: isDown ? '1px solid rgba(255,255,255,.4)' : '0'}"
    class="transcript-scrollhandle">
    <div :style="{ transform: `translateY(${ isUp ? 50 : -66 }%) rotate(45deg)` }" class="inner" />
  </div> -->
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Triangle extends Vue {
  @Prop({default: true}) up: any
  @Prop({default: false}) down: any
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
  margin-top -15px
  position absolute
  i
    transform translateX(-50%)
//   position absolute
//   display inline-block
//   width 20px
//   left -10px
//   height 17px
//   border-bottom 1px solid rgba(255,255,255,.4)
//   border-radius 1px
//   overflow hidden
//   .inner
//     border-radius 2px
//     background rgba(255,255,255,.25)
//     border 1px solid rgba(255,255,255,.4)
//     transform-origin center center
//     width 20px
//     height 20px
</style>
