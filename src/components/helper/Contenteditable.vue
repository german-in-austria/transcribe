<template>
  <div
    ref="input"
    v-text="value"
    contenteditable="true"
    @keyup="emitCaretPos"
    @mouseup="emitCaretPos"
    v-on="$listeners"
  />
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class Contenteditable extends Vue {

  @Prop({ default: '' }) value: string

  createRange(node: Node, chars: number, range?: Range): Range {

    if (!range) {
      range = document.createRange()
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars === 0) {
      range.setEnd(node, chars);
    } else if (node && chars > 0) {
      // if it’s the node, create the range
      if (node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
        if (node.textContent.length < chars) {
          chars -= node.textContent.length
        } else {
          range.setEnd(node, chars)
          chars = 0
        }
      // drill down recursively
      } else {
        for (let lp = 0; lp < node.childNodes.length; lp++) {
          range = this.createRange(node.childNodes[lp], chars, range)
          if (chars === 0) {
            break;
          }
        }
      }
    }
    return range
  }

  setCurrentCursorPosition(chars: number) {
    if (
      chars >= 0 &&
      this.$refs.input instanceof HTMLElement &&
      this.$refs.input.childNodes[0] instanceof Node
    ) {
      const selection = window.getSelection()
      const range = this.createRange(this.$refs.input.childNodes[0], chars)
      if (range && selection !== null) {
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
      }
    }
  }

  emitCaretPos() {
    const sel = document.getSelection()
    if (sel !== null) {
      const caretPos = sel.focusOffset
      this.$emit('move-caret', caretPos)
    }
  }

  @Watch('value')
  async onChangeValue(newVal: string) {
    if (this.$refs.input === document.activeElement) {
      const sel = document.getSelection()
      if (sel !== null) {
        const caretPos = sel.focusOffset
        await this.$nextTick()
        this.setCurrentCursorPosition(caretPos)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
