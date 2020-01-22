import Router from 'vue-router'
import App from './components/App.vue'

export default new Router({
  mode : 'history',
  routes : [
    {
      path: '/',
      component: App
    },
    {
      path: '/transcript/:transcript_id',
      component: App,
      props: (r) => r.params.transcript_id
    }
  ]
})
