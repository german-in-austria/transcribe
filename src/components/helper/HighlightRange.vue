<template>
  <div>
    <span ref="initial" class="initial">{{ initial }}</span><span class="highlight">{{ highlighted }}</span><span class="tail">{{ tail }}</span>
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

  updated() {
    // bad hack to fix a chrome bug
    // and invalidate the layout.
    const e = this.$refs.initial
    if (e instanceof HTMLElement) {
      e.style.direction = 'ltr'
      requestAnimationFrame(() => {
        e.style.direction = 'rtl'
      })
    }
  }

  get initial() {
    const highlightLength = this.end - this.start
    // const extendInEitherDirection = this.truncate !== null ? Math.floor((this.truncate - highlightLength) / 2) : 0
    const uncutInitial = this.text.substr(0, this.start)
    // const cutInitial = uncutInitial.substr(extendInEitherDirection * -1)
    // return cutInitial.length < uncutInitial.length ? '…' + cutInitial : cutInitial
    return uncutInitial
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
  display flex
  max-width 100%

.highlight
  color rgba(0,0,0,.8)
  background yellow
  border-radius 3px
  flex-grow 1
  white-space pre

.initial
  will-change direction
  direction rtl
  text-align left
  white-space pre
  overflow hidden
  text-overflow ellipsis
  &:after
    content "\200E‎"
  &:before
    content "\200E‎"

.tail
  overflow hidden
  white-space pre
  text-overflow ellipsis
  // so we can at least show the ellipsis
  // if necessary …
  min-width 1em
</style>
