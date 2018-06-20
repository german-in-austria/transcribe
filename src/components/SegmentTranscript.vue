<template>
  <div class="segment-editor">
    <div class="token-fake-display segment-text">
      <div
        class="token"
        v-for="(token, i) in localTokens"
        :key="i">
        {{ token }}&nbsp;
        <div :class="['token-type-indicator', tokenTypeFromToken(token), focused && 'focused']" />
      </div>
    </div>
    <div
      @focus="focused = true"
      @blur="updateLabelText"
      v-contenteditable:segmentText="true"
      class="tokens-input segment-text">
    </div>
  </div>
</template>

<script lang="ts">

import contenteditableDirective from 'vue-contenteditable-directive'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
Vue.use(contenteditableDirective)

@Component
export default class SegmentEditor extends Vue {

  @Prop() tokens: string[]
  localTokens = this.tokens.slice()
  focused = false

  tokenTypeFromToken(token: string) {
    return token.startsWith('((') ? 'non-verbal' : ''
  }

  get segmentText() {
    return this.localTokens ? this.localTokens.join(' ') : ''
  }

  set segmentText(newVal: string) {
    this.localTokens = newVal.split(' ')
  }

  updateLocalTokens(e: Event) {
    this.localTokens = ((e.target as HTMLDivElement).textContent || '').split(' ')
  }

  updateLabelText(e: Event) {
    this.focused = false
    const tokens = ((e.target as HTMLDivElement).textContent || '').split(' ')
    this.$emit('updateSpeakerEvent', tokens)
  }

}
</script>

<style lang="stylus" scoped>
.segment-editor
  position relative

.token-type-indicator
  background cornflowerblue
  height 3px
  border-radius 2px
  margin 1px 3px 3px 0px
  opacity .25
  transition .25s opacity
  &.focused
    opacity 1
  &.non-verbal
    background red
  // OTHER TOKEN TYPES GO HERE

.token-fake-display
  pointer-events none
  position absolute
  .token
    display inline-block
    color transparent

.tokens-input
  tokens-input
  outline 0
  color #ccc
  transition .5s color
  &:focus
    outline 0
    color white

.segment-text
  padding 1px

</style>
