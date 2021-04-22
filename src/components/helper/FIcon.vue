<script lang="ts">
import Vue from 'vue'
export default Vue.component('FIcon', {
  functional: true,
  name: 'FIcon',
  props: {
    color: String,
    value: String,
    dark: Boolean
  },
  render(c, context) {
    // console.time('icon')
    return c('i', {
      class: [
        'v-icon',
        context.data.staticClass,
        context.props.value,
        context.props.value.includes('mdi') ? 'mdi' : 'material-icons',
        context.props.color !== undefined ? context.props.color + '--text' : '',
        context.props.dark ? 'theme--dark' : ''
      ]
    })
    // console.timeEnd('icon')
    // return x
  }
})
</script>
