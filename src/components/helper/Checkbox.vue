<template>
  <label style="display: block; margin-bottom: .5em">
    <input
      class="mr-2"
      @change="$emit('input', !value)"
      :disabled="disabled"
      :checked="value" type="checkbox" />
    <span style="user-select: none;" v-if="label !== undefined">{{ label }}</span>
    <slot v-else />
  </label>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Checkbox extends Vue {
  @Prop() label?: string
  @Prop({ required: true }) value!: boolean
  @Prop({ default: false }) disabled!: boolean
}
</script>
<style lang="scss" scoped>
</style>
