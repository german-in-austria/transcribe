import Vue from 'vue'
import Main from './components/Main.vue'
import Vuex from 'vuex'
import router from './router'
import VueRouter from 'vue-router'
import * as fontLoader from 'webfontloader'
import Vuetify from 'vuetify'
// import store from './store'
import VueLazyload from 'vue-lazyload'
import VueInputAutowidth from 'vue-input-autowidth'

Vue.use(VueInputAutowidth)

Vue.config.productionTip = true
// Vue.use(VueAnalytics)

Vue.use(Vuex)

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
