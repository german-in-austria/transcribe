<template>
  <v-dialog
    lazy
    :transition="false"
    @input="$event === false && $emit('close')"
    :value="true"
    content-class="dialog"
    max-width="700">
    <v-card>
      <v-card-title>Import Exmaralda File</v-card-title>
      <v-card-text>

      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { ParsedXML } from '@service/transcript-parser'

@Component
export default class ExmeraldaImporter extends Vue {
  @Prop() tree: ParsedXML|null
  mounted() {
    console.log({tree: this.tree})
  }
}
</script>
<style lang="scss" scoped>
</style>
