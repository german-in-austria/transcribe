
<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator'
// import 'material-icons'
// import '@mdi/font'
// import '../../node_modules/vuetify/dist/vuetify.min.css'
// import '../../public/css/materialdesignicons.min.css'
// import '../styles/fonts.css'
// import '../styles/global.css'

@Component
export default class Main extends Vue {
}
</script>

<style lang="stylus">
  // @import 'https://fonts.googleapis.com/icon?family=Material+Icons';
  @import '../../node_modules/@mdi/font/css/materialdesignicons.css'
  @import '../../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
  @import '../../node_modules/vuetify/dist/vuetify.min.css';
  @import '../styles/fonts.css';
  @import '../styles/global.css';
</style>
