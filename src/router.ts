import Router from 'vue-router'
import App from './components/App.vue'

export default new Router({
  mode : 'history',
  routes : [
    {
      path:      '/',
      component: App
    }
  ]
})
