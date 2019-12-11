
import IpaOverlay from './IpaOverlay.vue'
import Vue from 'vue'

export const overlayInstance = new IpaOverlay().$mount()

document.body.appendChild(overlayInstance.$el)

export default {
  bind(el: HTMLElement, bindings: any, vNode: Vue.VNode) {
    if (bindings.value === true) {
      el.addEventListener('focus', () => {
        (overlayInstance as any).aElement = el
      })
    }
  },
  // inserted(el, bindings, vNode) {
  // },
  // update(el, bindings, vNode) {
  // },
  // componentUpdated(el, bindings, vNode) {
  // },
  // unbind(el) {
  // }
}
