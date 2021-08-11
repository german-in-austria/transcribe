<template>
  <div class="outer">
    <div v-for="(modifier) in convertModifier(value.modifier)" :key="modifier" class="modifiers">
      {{ modifier }}
    </div>
    <div class="key">
      {{ convertKey(value.key) }}
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { KeyboardAction, convertKey, convertModifier } from '@/service/keyboard.service'
@Component
export default class KeyboardShortcut extends Vue {
  @Prop({ required: true }) value!: KeyboardAction
  convertKey = convertKey
  convertModifier = convertModifier
}
</script>
<style lang="stylus" scoped>
.outer
  white-space nowrap
  padding-left 1px
.modifiers, .key
  font-size 80%
  border 1px solid rgba(255,255,255,.1)
  display inline-block
  padding 2px 2px 0 2px
  margin-right 2px
  border-radius 3px
  letter-spacing -.05em
  text-transform uppercase
</style>
