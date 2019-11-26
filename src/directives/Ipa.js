import Vue from 'vue'

const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
const elIpa = '__rt_ipa__'

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
}

function insertAfter(parentNode, newNode, referenceNode) {
  if (parentNode) {
    parentNode.insertBefore(newNode, referenceNode ? referenceNode.nextSibling : parentNode.firstChild)
  }
}

function applyElIpa(el, bindings, vNode) {
  if (!inBrowser) {
    return
  }
  // console.log(el, el.parentNode, bindings, vNode)
  // el.parentNode.style.position = 'relative'
  overlayInstance.aElement = el
  insertAfter(el.parentNode, overlayInstance.$el, el)
}
function removeElIpa(el) {
  if (!inBrowser) {
    return
  }
  if (el[elIpa]) {
    if (el[elIpa].destroy) {
      el[elIpa].destroy()
    }
    el[elIpa] = null
    delete el[elIpa]
  }
}

var ExtIpa = Vue.extend({
  template: '<div class="ipa-thing" style="position: absolute; bottom: 100%; left: 0; max-height: 150px; overflow-y: auto; background: #fff; padding: 10px; padding-bottom: 5px; border: 1px solid #eee; border-radius: 5px; min-width: 250px;" v-if="ready && aKeys.length > 0">'
    + '	<div style="margin-bottom: 5px; white-space: nowrap;" v-for="aKey in aKeys">'
    + '		<span style="display: inline-block; width: 31px; text-align: center;">{{ aKey.k }}</span>'
    + '		<button @click="setKey(aKey.k, pKey)" @keyup.esc="unsetKeys()" @blur="blur" ref="aBtns" class="btn btn-grey btn-sm" style="display: inline-block; margin-right: 5px; min-width: 35px;" v-for="pKey in aKey.a">{{ pKey }}</button>'
    + '	</div>'
    + '</div>',
  data() {
    return {
      'aKeys': [],
      'aElement': null,
      'ready': false,
      'lastPosition': null,
    }
  },
  watch: {
    'aElement'(nVal, oVal) {
      if (oVal) {
        oVal.removeEventListener('keyup', this.keyUp)
        oVal.removeEventListener('blur', this.blur)
      }
      if (nVal) {
        this.ready = true
        nVal.addEventListener('keyup', this.keyUp)
        nVal.addEventListener('blur', this.blur)
      }
    },
  },
  methods: {
    blur(e) {
      this.$nextTick(() => {
        if (this.aKeys.length > 0) {
          let aEl = e.relatedTarget || document.activeElement
          if (aEl !== this.aElement && this.$refs.aBtns.indexOf(aEl) === -1) {
            this.aKeys = []
          }
        }
      })
    },
    unsetKeys() {
      if (this.aKeys.length > 0) {
        this.aKeys = []
        if (this.lastPosition || this.lastPosition === 0) {
          let selection = document.getSelection()
          selection.removeAllRanges()
          var range = new Range()
          range.setStart(this.aElement.firstChild, this.lastPosition)
          selection.addRange(range)
        }
      }
    },
    setKey(aKey, nKey) {
      this.aElement.innerText = this.aElement.innerText.substring(0, this.lastPosition - aKey.length) + nKey + this.aElement.innerText.substring(this.lastPosition, this.aElement.innerText.length)
      this.lastPosition = this.lastPosition - aKey.length + nKey.length
      this.unsetKeys()
    },
    keyUp(e) {
      if (e.key !== 'Tab' && e.key !== 'Shift') {
        this.aKeys = []
        let aSel = document.getSelection()
        this.lastPosition = aSel.focusOffset
        if (e.key.length === 1 && aSel.focusOffset === aSel.baseOffset) {
          if (e.key === '!') {
            for (var key in ipaKeys) {
              if (!ipaKeys.hasOwnProperty(key)) continue
              this.aKeys.push({ 'k': key, 'a': ipaKeys[key] })
            }
          } else {
            let alKey = ''
            if (aSel.focusOffset > 2) {
              alKey = this.aElement.innerText.substring(aSel.focusOffset - 3, aSel.focusOffset)
              if (ipaKeys[alKey]) {
                this.aKeys.push({ 'k': alKey, 'a': ipaKeys[alKey] })
              }
            }
            if (aSel.focusOffset > 1) {
              alKey = this.aElement.innerText.substring(aSel.focusOffset - 2, aSel.focusOffset)
              if (ipaKeys[alKey]) {
                this.aKeys.push({ 'k': alKey, 'a': ipaKeys[alKey] })
              }
            }
            let aKey = this.aElement.innerText.substring(aSel.focusOffset - 1, aSel.focusOffset)
            if (aKey && ipaKeys[aKey]) {
              this.aKeys.push({ 'k': aKey, 'a': ipaKeys[aKey] })
            }
          }
        }
      }
    },
  },
  mounted() {
    console.log('mounted')
  },
  beforeDestroy() {
    if (this.aElement) {
      this.aElement.removeEventListener('keyup', this.keyUp)
      this.aElement.removeEventListener('blur', this.blur)
    }
  },
})

const overlayInstance = new ExtIpa().$mount()

export default {
  bind(el, bindings, vNode) {
    if (bindings.value === true) {
      el.addEventListener('focus', () => {
        console.log('focus!!')
        applyElIpa(el, bindings, vNode)
      })
    }
  },
  inserted(el, bindings, vNode) {
    applyElIpa(el, bindings, vNode)
  },
  update(el, bindings, vNode) {
    if (bindings.value !== bindings.oldValue) {
      applyElIpa(el, bindings, vNode)
    }
  },
  componentUpdated(el, bindings, vNode) {
    if (bindings.value !== bindings.oldValue) {
      applyElIpa(el, bindings, vNode)
    }
  },
  unbind(el) {
    removeElIpa(el)
  }
}
