import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

declare const process: any

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    // pages,
    // user,
    // ui
  },
  strict: false
})
