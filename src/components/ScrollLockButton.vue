<template>
  <v-btn
    fab
    small
    @click="$emit('input', !value)"
    :class="[
      'lock-scroll-btn',
      'elevation-0',
      value && 'lock-active',
      settings.darkMode === true && 'theme--dark'
    ]">
    <div>
      <div class="bar" :style="{transform: `translate3d(${ value ? 0 : -3 }px, 0, 0)`}" />
      <div class="bar" :style="{top: '1px', transform: `translate3d(${ value ? 0 :  3 }px, 0, 0)`}" />
    </div>
  </v-btn>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings.store'

@Component
export default class ScrollLockButton extends Vue {
  @Prop({ default: false }) value!: boolean
  settings = settings
}
</script>
<style lang="stylus" scoped>
.lock-scroll-btn.lock-active.theme--dark
  background #616161 !important
  border-color #616161 !important
.bar
  position relative !important
  opacity .6 !important
  border-radius 3px
  width 10px
  height 3px
  background white
.theme--light .bar
  background #111
</style>
