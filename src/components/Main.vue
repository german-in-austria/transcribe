<template>
  <router-view></router-view>
</template>

<script lang="ts">

import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Main extends Vue {}
</script>

<style>
  @import 'https://fonts.googleapis.com/icon?family=Material+Icons';
  @import '../../node_modules/vuetify/dist/vuetify.min.css';
  @import '/static/css/materialdesignicons.min.css';
  @import '../styles/fonts.scss';
  @import '../styles/global.scss';
</style>
