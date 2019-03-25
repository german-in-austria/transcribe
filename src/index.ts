import Vue from 'vue'
import Main from './components/Main.vue'
import router from './router'
import { platform } from './util'
import VueRouter from 'vue-router'
import * as fontLoader from 'webfontloader'
import Vuetify from 'vuetify'
// import store from './store'
import VueLazyload from 'vue-lazyload'

Vue.config.devtools = true
Vue.config.performance = true
Vue.config.productionTip = true

if (platform() === 'windows') {
  Vue.config.keyCodes.meta = 17
} else if (platform() === 'mac') {
  // FIREFOX, OPERA, WEBKIT/BLINK
  Vue.config.keyCodes.meta = [ 224, 17, 91, 93 ]
} else {
  Vue.config.keyCodes.meta = 17
}

Vue.use(VueRouter)

Vue.use(Vuetify)
Vue.use(VueLazyload, {
  lazyComponent : true
})
// load webfonts asnychronously
if (window) {
  fontLoader.load({
    custom: {
      families : ['HKGrotesk']
    }
  })
}

/* tslint:disable */
new Vue({
    el : '#app',
    render : h => h(Main),
    router,
    // store
})
