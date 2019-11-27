
import IpaOverlay from './IpaOverlay.vue'
import Vue from 'vue'

const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

function insertAfter(parentNode: Node, newNode: Node, referenceNode: Node) {
  if (parentNode) {
    parentNode.insertBefore(newNode, referenceNode ? referenceNode.nextSibling : parentNode.firstChild)
  }
}

function applyElIpa(el: HTMLElement) {
  if (!inBrowser) {
    return
  }
  (overlayInstance as any).aElement = el
  console.log('applyElIpa')
  if (el.parentNode !== null) {
    insertAfter(el.parentNode, overlayInstance.$el, el)
  }
}

const overlayInstance = new IpaOverlay().$mount()

export default {
  bind(el: HTMLElement, bindings: any, vNode: Vue.VNode) {
    if (bindings.value === true) {
      el.addEventListener('focus', () => {
        console.log('focus!!')
        applyElIpa(el)
      })
    }
  },
  // inserted(el, bindings, vNode) {
  //   // applyElIpa(el, bindings, vNode)
  // },
  // update(el, bindings, vNode) {
  //   // if (bindings.value !== bindings.oldValue) {
  //   //   applyElIpa(el, bindings, vNode)
  //   // }
  // },
  // componentUpdated(el, bindings, vNode) {
  //   if (bindings.value !== bindings.oldValue) {
  //     applyElIpa(el, bindings, vNode)
  //   }
  // },
  // unbind(el) {
  //   // removeElIpa(el)
  // }
}
