<!--<template>
  <div
    ref="input"
    v-text="value"
    contenteditable="true"
    v-on="$listeners"
  />
</template>-->
<script lang="ts">
// import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import Vue from 'vue'

function createRange(node: Node, chars: number, range?: Range): Range {
  if (!range) {
    range = document.createRange()
    range.selectNode(node)
    range.setStart(node, 0)
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
        range = createRange(node.childNodes[lp], chars, range)
        if (chars === 0) {
          break
        }
      }
    }
  }
  return range
}

function setCurrentCursorPosition(chars: number, input: HTMLElement) {
  if (chars >= 0) {
    const selection = window.getSelection()
    const range = createRange(input.childNodes[0], chars)
    if (range && selection !== null) {
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}

export default Vue.component('Contenteditable', {
  functional: true,
  props: {
    value: String,
    isFocused: Boolean
  },
  render(c, context) {
    console.log('render with value', context.props.value)
    console.log('isFocused', context.props.isFocused)
    if (context.props.isFocused === true) {
      const sel = document.getSelection()
      if (sel !== null) {
        const caretPos = sel.focusOffset
        Vue.nextTick(() => {
          setCurrentCursorPosition(caretPos, context.parent.$el as HTMLElement)
        })
      }
    }
    return c('div', {
      ref: 'input',
      on: context.listeners,
      class: context.data.staticClass,
      style: context.data.style,
      attrs: {
        contenteditable: 'true',
        ...context.data.attrs
      }
    }, context.props.value)
  }
})

// @Component
// export default class Contenteditable extends Vue {

//   @Prop({ default: '' }) value!: string

//   createRange(node: Node, chars: number, range?: Range): Range {

//     if (!range) {
//       range = document.createRange()
//       range.selectNode(node);
//       range.setStart(node, 0);
//     }

//     if (chars === 0) {
//       range.setEnd(node, chars);
//     } else if (node && chars > 0) {
//       // if it’s the node, create the range
//       if (node.nodeType === Node.TEXT_NODE && node.textContent !== null) {
//         if (node.textContent.length < chars) {
//           chars -= node.textContent.length
//         } else {
//           range.setEnd(node, chars)
//           chars = 0
//         }
//       // drill down recursively
//       } else {
//         for (let lp = 0; lp < node.childNodes.length; lp++) {
//           range = this.createRange(node.childNodes[lp], chars, range)
//           if (chars === 0) {
//             break;
//           }
//         }
//       }
//     }
//     return range
//   }

//   setCurrentCursorPosition(chars: number) {
//     if (
//       chars >= 0 &&
//       this.$refs.input instanceof HTMLElement &&
//       this.$refs.input.childNodes[0] instanceof Node
//     ) {
//       const selection = window.getSelection()
//       const range = this.createRange(this.$refs.input.childNodes[0], chars)
//       if (range && selection !== null) {
//           range.collapse(false)
//           selection.removeAllRanges()
//           selection.addRange(range)
//       }
//     }
//   }

//   @Watch('value')
//   async onChangeValue(newVal: string) {
//     if (this.$refs.input === document.activeElement) {
//       const sel = document.getSelection()
//       if (sel !== null) {
//         const caretPos = sel.focusOffset
//         await this.$nextTick()
//         this.setCurrentCursorPosition(caretPos)
//       }
//     }
//   }
// }
</script>
<!--<style lang="scss" scoped>
</style>-->
