<template>
  <v-btn
    fab
    small
    :color="value ? 'grey darken-2' : undefined"
    @click="$emit('input', !value)"
    class="lock-scroll-btn elevation-0">
    <div>
      <div class="bar" :style="{transform: `translateX(${ value ? 0 : -3 }px)`}" />
      <div class="bar" :style="{top: '1px', transform: `translateX(${ value ? 0 :  3 }px)`}" />
    </div>
  </v-btn>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class ScrollLockButton extends Vue {
  @Prop({ default: false }) value: boolean
}
</script>
<style lang="stylus" scoped>
// .lock-scroll-btn
.bar
  position relative !important
  opacity .6 !important
  width 10px
  height 4px
  background white

</style>
