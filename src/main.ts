import Vue from 'vue'
import Main from './components/Main.vue'
import fIcon from './components/helper/FIcon.vue'
import router from './router'
import * as fontLoader from 'webfontloader'
import Vuetify from 'vuetify'
import * as Sentry from '@sentry/browser'
import VueRouter from 'vue-router'
import ipaDirectives from './directives/Ipa'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://21e0884e7e9744faa9f730caf468bad0@sentry.io/1793743'
  })
}

Vue.config.devtools = true
Vue.config.performance = true
Vue.config.productionTip = true

Vue.directive('rt-ipa', ipaDirectives)

Vue.use(Vuetify, {
  iconfont: 'mdi'
})
Vue.use(VueRouter)

// a replacement for the rather slow v-icon component.
Vue.component('f-icon', fIcon)

// load webfonts asynchronously
if (window) {
  fontLoader.load({
    custom: {
      families: [
        'HKGrotesk'
      ]
    }
  })
}
/* eslint:disable */
new Vue({
  router,
  render: h => h(Main)
}).$mount('#app')
