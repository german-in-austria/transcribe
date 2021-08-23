<template>
  <div>{{ currentValue }}</div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class ForceRefresh extends Vue {

  @Prop({ default: 60 }) interval!: number
  @Prop({ required: true }) display!: (...args: any[]) => string
  i: NodeJS.Timer|null = null
  currentValue = this.display()

  mounted() {
    this.i = setInterval(async () => {
      this.currentValue = this.display()
    }, this.interval * 1000)
  }

  beforeDestroy() {
    if (this.i !== null) {
      clearInterval(this.i)
    }
  }
}

</script>
