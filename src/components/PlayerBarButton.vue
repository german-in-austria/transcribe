<template>
  <div
    @click="$emit('click', $event)"
    v-ripple
    :style="{
      width: size + 'px',
      height: size + 'px',
      lineHeight: size + 8 + 'px'
    }"
    class="square">
    <slot />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class PlayerBarButton extends Vue {
  @Prop({ default: 70 }) size: number
}
</script>
<style lang="stylus" scoped>
.square
  cursor pointer
  display inline-block
  text-align center
  user-select none
  transition background .2s
  &:hover
    background rgba(0,0,0,.1)
</style>
