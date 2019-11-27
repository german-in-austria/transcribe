<template>
  <div class="ipa-outer" v-if="ready && aKeys.length > 0">
    <div
      style="white-space: nowrap;"
      v-for="aKey in aKeys"
      :key="aKey.k">
      <!-- <span style="display: inline-block; width: 31px; text-align: center;">{{ aKey.k }}</span> -->
      <button
        @click="setKey(aKey.k, pKey)"
        @keyup.esc="unsetKeys()"
        @blur="blur"
        ref="aBtns"
        class="ipa-btn"
        v-for="pKey in aKey.a"
        :key="pKey">
        {{ pKey }}
      </button>
  </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

interface IpaKeys {
  [k: string]: string[]
}

const ipaKeys = {
  'a': ['ᵃ', 'ᵄ', 'ᵅ', 'ᵆ', 'ͣ', 'ᶛ', 'ₐ', 'a', 'ɑ', 'ɐ'],
  'b': ['ᵇ', 'ᵝ', 'ᵦ', 'b', 'b̥', 'β', 'β̥'],
  'c': ['ᶜ', 'ͨ', 'ᵡ', 'ᵪ', 'ᶝ'],
  'p': ['ᵖ', 'ₚ', 'p', 'pʰ'],
  'd': ['ᵈ', 'ͩ', 'ᵟ', 'd', 'd̥', 'ᶞ'],
  'e': ['ᵉ', 'ᵊ', 'ͤ', 'ᵋ', 'ᵌ', 'ₑ', 'ₔ', 'e', 'ɛ', 'ə'],
  'ä': ['ɛː', 'æ'],
  'f': ['ᶠ', 'ᵠ', 'ᵩ', 'ᶡ', 'ᶲ', 'f', 'v̥'],
  'g': ['ᵍ', 'ˠ', 'ᵧ', 'g', 'g̥'],
  'h': ['ʰ', 'ʱ', 'ͪ', 'ᶣ', 'ₕ'],
  'i': ['', 'ͥ', 'ᵎ', 'ᵢ', 'ᶤ', 'ᶦ', 'ᶥ', 'ᶧ', 'i', 'ɪ'],
  'j': ['ʲ'],
  'k': ['k', 'kʰ', 'k͡χ', 'ᵏ', 'ₖ'],
  'l': ['ˡ', 'ᶩ', 'ᶪ', 'ᶫ', 'ₗ', 'l', 'ɭ', 'ɬ'],
  'm': ['ᵐ', 'ͫ', 'ᵚ', 'ᶬ', 'ᶭ', 'ₘ', 'm', 'ɱ'],
  'n': ['ⁿ', 'ᵑ', 'ᶮ', 'ᶯ', 'ᶰ', 'ₙ', 'n', 'ŋ', 'n̩'],
  'o': ['ᵒ', 'ᵓ', 'ͦ', 'ᶱ', 'ₒ', 'o', 'ɔ'],
  'oa': ['ɔɐ̯', 'ɔo̯'],
  'ö': ['ø', 'œ'],
  's': ['ˢ', 'ᶳ', 'ₛ'],
  'r': ['ʳ', 'ʴ', 'ʵ', 'ʶ', 'ͬ', 'ᵣ', 'ᵨ', 'ʁ', 'ʀ', 'ɹ', 'ɾ'],
  't': ['t', 'tʰ', 'ᵗ', 'ͭ', 'ᶵ', 'ᶿ', 'ₜ'],
  'v': ['ᵛ', 'ͮ', 'ᵥ', 'ᶹ', 'ᶺ'],
  'z': ['ᶻ', 'ᶼ', 'ᶽ', 'z', 'z̥'],
  'sch': ['ᶴ', 'ᶾ', 'ʃ', 'ʒ̥', 'ʒ'],
  'u': ['ᵘ', 'ͧ', 'ᵤ', 'ᵙ', 'ᶶ', 'ᶸ', 'u', 'ʊ', 'ue̯'],
  'ü': ['y', 'ʏ', 'ʏɐ̯'],
  'w': ['ʷ', 'v', 'β', 'β̥'],
  'x': ['ˣ', 'ͯ', 'ₓ'],
  'y': ['ʸ', 'ᶷ'],
  'ch': ['ç', 'x', 'χ', 'ɣ̥', 'ʝ̥'],
  'ei': ['aɛ̯', 'æe̯', 'æː'],
  'au': ['ɑɔ̯'],
  'eu': ['ɔe̯'],
  'ie': ['ɪɐ̯'],
  'ia': ['ɪɐ̯'],
  'pf': ['p͡f', 'b̥͡f'],
  'ts': ['t͡s', 'd̥͡s'],
  '1': ['̯', '̃', '͡'],
  '0': ['ᵔ', 'ᵕ', '˜', '̯', '̃', 'ː', '͡', '̝', '̞', 'ʔ'],
  ':': ['ː'],
  '.': ['̩', '̥', '̝', '̞'],
  '?': ['?', 'ʔ']
} as IpaKeys

@Component
export default class  extends Vue {

  ipaKeys = ipaKeys
  aKeys: Array<{k: string, a: string[]}> = []
  aElement: HTMLElement|null = null
  ready = false
  lastPosition: number|null = null

  @Watch('aElement')
  onChangeElement(nVal: HTMLElement|null, oVal: HTMLElement|null) {
    if (oVal) {
      oVal.removeEventListener('keyup', this.keyUp)
      oVal.removeEventListener('blur', this.blur)
    }
    if (nVal) {
      this.ready = true
      nVal.addEventListener('keyup', this.keyUp)
      nVal.addEventListener('blur', this.blur)
    }
  }

  blur(e: FocusEvent) {
    this.$nextTick(() => {
      if (this.aKeys.length > 0) {
        const aEl = e.relatedTarget || document.activeElement
        if (aEl !== this.aElement && (this.$refs.aBtns as any).indexOf(aEl) === -1) {
          this.aKeys = []
        }
      }
    })
  }

  unsetKeys() {
    if (this.aKeys.length > 0) {
      this.aKeys = []
      if (this.lastPosition || this.lastPosition === 0) {
        const selection = document.getSelection()
        if (selection !== null && this.aElement !== null && this.aElement.firstChild !== null) {
          selection.removeAllRanges()
          const range = new Range()
          range.setStart(this.aElement.firstChild, this.lastPosition)
          selection.addRange(range)
        }
      }
    }
  }

  setKey(aKey: any, nKey: any) {
    if (this.aElement !== null) {
      this.aElement.innerText = this.aElement
        .innerText
        .substring(0, (this.lastPosition || 0) - aKey.length)
        + nKey
        + this.aElement.innerText.substring(this.lastPosition || 0, this.aElement.innerText.length)
      this.lastPosition = (this.lastPosition || 0) - aKey.length + nKey.length
      this.unsetKeys()
    }
  }

  keyUp(e: KeyboardEvent) {
    if (e.key !== 'Tab' && e.key !== 'Shift' && this.aElement !== null) {
      this.aKeys = []
      const aSel = document.getSelection()
      if (aSel !== null) {
        this.lastPosition = aSel.focusOffset
        if (e.key.length === 1 && aSel.focusOffset === (aSel as any).baseOffset) {
          if (e.key === '!') {
            for (const key in ipaKeys) {
              if (!ipaKeys.hasOwnProperty(key)) {
                continue
              }
              this.aKeys.push({ k: key, a: ipaKeys[key] })
            }
          } else {
            let alKey = ''
            if (aSel.focusOffset > 2) {
              alKey = this.aElement.innerText.substring(aSel.focusOffset - 3, aSel.focusOffset)
              if (ipaKeys[alKey]) {
                this.aKeys.push({ k: alKey, a: ipaKeys[alKey] })
              }
            }
            if (aSel.focusOffset > 1) {
              alKey = this.aElement.innerText.substring(aSel.focusOffset - 2, aSel.focusOffset)
              if (ipaKeys[alKey]) {
                this.aKeys.push({ k: alKey, a: ipaKeys[alKey] })
              }
            }
            const aKey = this.aElement.innerText.substring(aSel.focusOffset - 1, aSel.focusOffset)
            if (aKey && ipaKeys[aKey]) {
              this.aKeys.push({ k: aKey, a: ipaKeys[aKey] })
            }
          }
        }
      }
    }
  }

  beforeDestroy() {
    if (this.aElement) {
      this.aElement.removeEventListener('keyup', this.keyUp)
      this.aElement.removeEventListener('blur', this.blur)
    }
  }

}
</script>
<style lang="stylus" scoped>
.ipa-outer
  position absolute
  box-shadow 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12);
  z-index 2
  bottom 0
  left 0
  max-height 150px
  overflow-y auto
  background rgba(240,240,240,.5)
  border 1px solid #ddd
  color #333
  border-radius 4px
  backdrop-filter blur(20px)

.ipa-btn
  display: inline-block
  width: 35px
  line-height: 35px
  &:focus
    outline 0
    color white
    background cornflowerblue
</style>
