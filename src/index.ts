import Vue from 'vue'
import Main from './components/Main.vue'
import router from './router'
import VueRouter from 'vue-router'
import * as fontLoader from 'webfontloader'
import Vuetify from 'vuetify'
import * as VueLazyload from 'vue-lazyload'
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: 'https://21e0884e7e9744faa9f730caf468bad0@sentry.io/1793743'
})

Vue.config.devtools = true
Vue.config.performance = true
Vue.config.productionTip = true

Vue.use(VueRouter)

Vue.use(Vuetify)
Vue.use(VueLazyload, {
  lazyComponent : true
})
// load webfonts asynchronously
if (window) {
  fontLoader.load({
    custom: {
      families : [
        'HKGrotesk'
      ]
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
