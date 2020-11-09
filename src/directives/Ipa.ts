
import Vue from 'vue'
import IpaOverlay from './IpaOverlay.vue'
import { DirectiveBinding } from 'vue/types/options'
const IpaOverlayClass = Vue.extend(IpaOverlay)
// create the instance once.
export const overlayInstance = new IpaOverlayClass()
overlayInstance.$mount()
// append it to the body once.
document.body.appendChild(overlayInstance.$el)

export default {
  bind(el: HTMLElement, bindings: DirectiveBinding) {
    if (bindings.value.show !== false) {
      el.addEventListener('focus', () => {
        const instance = overlayInstance as any
        // update the instance with the new props.
        instance.aElement = el
        instance.directionV = bindings.value.directionV || 'top'
        instance.directionH = bindings.value.directionH || 'left'
        instance.maxWidth = bindings.value.maxWidth || 350
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
