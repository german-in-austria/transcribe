<template>
  <div
    v-if="ready && aKeys.length > 0"
    :class="[
      'ipa-overlay',
      $vuetify.dark && 'dark-theme'
    ]"
    :style="{
      top: top + 'px',
      left: left + 'px',
      transform: directionV === 'top' ? 'translateY(-100%)' : 'none',
      maxWidth: maxWidth + 'px'
    }"
    class="ipa-overlay">
    <div
      style="white-space: nowrap;"
      v-for="aKey in aKeys"
      :key="aKey.k">
      <!-- <span style="display: inline-block; width: 31px; text-align: center;">{{ aKey.k }}</span> -->
      <button
        @click.stop.prevent="(e) => setKey(e, aKey.k, pKey)"
        @keyup.esc="unsetKeys()"
        @keydown.enter.stop.prevent="(e) => setKey(e, aKey.k, pKey)"
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

@Component
export default class IpaOverlay extends Vue {

  ipaKeys: IpaKeys = {
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
  }

  aKeys: Array<{k: string, a: string[]}> = []
  aElement: HTMLElement|HTMLInputElement|null = null
  ready = false
  lastPosition: number|null = null
  log = console.log
  directionV: 'top'|'bottom' = 'top'
  directionH: 'left'|'right' = 'left'
  maxWidth = 350

  top = 0
  left = 0

  @Watch('aElement')
  onChangeElement(nVal: HTMLElement|HTMLInputElement|null, oVal: HTMLElement|HTMLInputElement|null) {
    if (oVal) {
      oVal.removeEventListener('keydown', this.keyDown)
      oVal.removeEventListener('keyup', this.keyUp)
      oVal.removeEventListener('blur', this.blur)
    }
    if (nVal) {
      this.updatePosition(nVal)
      this.ready = true
      nVal.addEventListener('keydown', this.keyDown)
      nVal.addEventListener('keyup', this.keyUp)
      nVal.addEventListener('blur', this.blur)
    }
  }

  updatePosition(el = this.aElement) {
    if (el !== null) {
      const rect = el.getBoundingClientRect()
      if (this.directionV === 'top') {
        this.top = rect.top
      } else if (this.directionV === 'bottom') {
        this.top = rect.bottom
      } else {
        this.top = rect.top
      }
      if (this.directionH === 'left') {
        this.left = rect.left
      } else if (this.directionH === 'right') {
        this.left = rect.right
      } else {
        this.left = rect.left
      }
    }
  }

  blur(e: Event) {
    this.$nextTick(() => {
      if (this.aKeys.length > 0) {
        const aEl = (e as any).relatedTarget || document.activeElement
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
        if (this.aElement instanceof HTMLInputElement) {
          this.aElement.focus()
          this.aElement.setSelectionRange(this.lastPosition, this.lastPosition)
        } else {
          if (selection !== null && this.aElement !== null && this.aElement.firstChild !== null) {
            selection.removeAllRanges()
            const range = new Range()
            range.setStart(this.aElement.firstChild, this.lastPosition)
            selection.addRange(range)
          }
        }
      }
    }
  }

  setKey(e: MouseEvent, aKey: any, nKey: any) {
    if (this.aElement !== null) {
      if (this.aElement instanceof HTMLElement && this.aElement.innerText) {
        this.aElement.innerText = this.aElement
          .innerText
          .substring(0, (this.lastPosition || 0) - aKey.length)
          + nKey
          + this.aElement.innerText.substring(this.lastPosition || 0, this.aElement.innerText.length)
      } else if (this.aElement instanceof HTMLInputElement && this.aElement.value) {
        this.aElement.value = this.aElement
          .value
          .substring(0, (this.lastPosition || 0) - aKey.length)
          + nKey
          + this.aElement.value.substring(this.lastPosition || 0, this.aElement.value.length)
      }
      this.aElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
      this.lastPosition = (this.lastPosition || 0) - aKey.length + nKey.length
      this.unsetKeys()
    }
  }

  keyDown(e: Event) {
    if ((e as KeyboardEvent).key === 'Tab') {
      // to put the focus inside the overlay
      if (this.$refs.aBtns) {
        const currentFocus = (this.$refs.aBtns as Element[]).findIndex(el => el === document.activeElement)
        if ((this.$refs.aBtns as HTMLElement[])[currentFocus + 1] !== undefined) {
          e.preventDefault();
          e.stopPropagation();
          (this.$refs.aBtns as HTMLElement[])[currentFocus + 1].focus()
        }
      }
    }
    this.updatePosition(this.aElement)
  }

  keyUp(e: Event) {
    // console.log(e, this.aElement)
    const k = (e as KeyboardEvent).key

    if (k === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      this.aKeys = []
    } else if (k !== 'Tab' && k !== 'Shift' && this.aElement !== null) {
      this.aKeys = []
      const aSel = document.getSelection()
      // console.log({ aSel })
      if (aSel !== null) {
        // tslint:disable-next-line:max-line-length
        const focusOffset = this.aElement instanceof HTMLInputElement ? this.aElement.selectionEnd || 0 : aSel.focusOffset
        // tslint:disable-next-line:max-line-length
        const baseOffset = this.aElement instanceof HTMLInputElement ? this.aElement.selectionStart || 0 : (aSel as any).baseOffset
        const value = this.aElement.innerText || (this.aElement as HTMLInputElement).value
        this.lastPosition = focusOffset
        if (k.length === 1 && focusOffset === baseOffset) {
          if (k === '!') {
            for (const key in this.ipaKeys) {
              if (!this.ipaKeys.hasOwnProperty(key)) {
                continue
              }
              this.aKeys.push({ k: key, a: this.ipaKeys[key] })
            }
          } else {
            let alKey = ''
            if (focusOffset > 2) {
              alKey = value.substring(focusOffset - 3, focusOffset)
              if (this.ipaKeys[alKey]) {
                this.aKeys.push({ k: alKey, a: this.ipaKeys[alKey] })
              }
            }
            if (focusOffset > 1) {
              alKey = value.substring(focusOffset - 2, focusOffset)
              if (this.ipaKeys[alKey]) {
                this.aKeys.push({ k: alKey, a: this.ipaKeys[alKey] })
              }
            }
            const aKey = value.substring(focusOffset - 1, focusOffset)
            if (aKey && this.ipaKeys[aKey]) {
              this.aKeys.push({ k: aKey, a: this.ipaKeys[aKey] })
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
      this.aElement.removeEventListener('keydown', this.keyDown)
    }
  }

}
</script>
<style lang="stylus" scoped>
.ipa-overlay
  position absolute
  box-shadow 0 5px 5px -3px rgba(0,0,0,.2), 0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12)
  z-index 99
  max-height 150px
  overflow-y auto
  background rgba(240,240,240,.9)
  border 1px solid #ddd
  color #333
  border-radius 4px
  font-family sans-serif

.dark-theme.ipa-overlay
  background rgba(30, 30, 30, .9)
  color white

.ipa-btn
  display: inline-block
  width: 35px
  line-height: 35px
  &:focus
    outline 0
    color white
    background cornflowerblue
</style>
