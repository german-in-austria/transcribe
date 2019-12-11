<template>
  <div>
    <span>{{ initial }}</span><span class="highlight">{{ highlighted }}</span><span>{{ tail }}</span>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class HighlightRange extends Vue {

  @Prop() text: string
  @Prop() start: number
  @Prop() end: number
  @Prop({ default: null }) truncate: number|null

  get initial() {
    const highlightLength = this.end - this.start
    const extendInEitherDirection = this.truncate !== null ? Math.floor((this.truncate - highlightLength) / 2) : 0
    const uncutInitial = this.text.substr(0, this.start)
    const cutInitial = uncutInitial.substr(extendInEitherDirection * -1)
    return cutInitial.length < uncutInitial.length ? '…' + cutInitial : cutInitial
  }

  get highlighted() {
    return this.text.substr(this.start, this.end - this.start)
  }

  get tail() {
    // tslint:disable-next-line:max-line-length
    return this.text.substr(this.end)
  }
}
</script>
<style lang="stylus" scoped>
div
  white-space nowrap
  overflow hidden
  text-overflow ellipsis
  max-width 100%
.highlight
  background yellow
  border-radius 3px
</style>
