<template>
  <v-btn :outline="value" @click="$emit('input', !value)" class="lock-scroll-btn" icon>
    <div>
      <v-icon :color="!value && 'grey'" :style="{transform: `translateX(${ value ? 0 : -3 }px)`}" class="down">arrow_drop_down</v-icon>
      <v-icon :color="!value && 'grey'" :style="{transform: `translateX(${ value ? 0 :  3 }px)`}" class="up">arrow_drop_up</v-icon>
    </div>
  </v-btn>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class  extends Vue {
  @Prop({ default: false }) value: boolean
}
</script>
<style lang="stylus" scoped>
.lock-scroll-btn
  > div
    display initial
  i.icon
    display block
    &:last-child
      margin-top -14px
</style>
