
<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Main extends Vue {
  mounted() {
    const isChromium = (window as any).chrome !== undefined
    if (!isChromium) {
      alert('Transcribe currently only supports recent versions of Google Chrome, Chromium and Microsoft Edge browsers. Using other browsers might lead to unexpected or erroneous results.')
    }
  }
}
</script>

<style lang="stylus">
  @import '../../node_modules/@mdi/font/css/materialdesignicons.css'
  @import '../../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
  @import '../../node_modules/vuetify/dist/vuetify.min.css'
  @import '../styles/fonts.css';
  @import '../styles/global.css';
</style>
