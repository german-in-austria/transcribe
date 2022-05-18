<template>
  <div
    @click="$emit('click', $event)"
    v-ripple
    :style="{
      width: size + 'px',
      height: size + 'px',
      lineHeight: size + 8 + 'px'
    }"
    :class="'square' + (disabled ? ' disabled' : '')">
    <slot />
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class PlayerBarButton extends Vue {
  @Prop({ default: 70 }) size!: number
  @Prop({ default: false }) disabled!: boolean
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
.disabled
  opacity 0.3
</style>
