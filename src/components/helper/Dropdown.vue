<template>
  <select :value="value" @change="$emit('input', $event.target.value)">
    <option
      v-for="(item, i) in items"
      :value="item"
      :key="i">
      {{ stringify(item) }}
    </option>
  </select>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Dropdown extends Vue {
  @Prop({ required: true }) value!: any
  @Prop({ default: [] }) items!: any[]
  @Prop() stringify?: (e: any) => string
}
</script>
<style lang="stylus" scoped>
select
  background rgba(255,255,255,.4)
  padding 0 0.7em 0 0.7em
  outline 0
</style>
