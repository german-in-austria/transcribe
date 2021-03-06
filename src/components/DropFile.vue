<template>
  <div>
    <v-layout
      fill-height
      justify-center
      align-center
      column
      @dragover.prevent=""
      @dragenter="highlight"
      @dragleave="unhighlight"
      @drop.stop.prevent="useAudioFile"
      class="drop-area mb-5">
      <v-flex v-if="fileName !== null" class="text-xs-center" shrink>
        <v-icon color="primary" style="opacity: .5; font-size: 4em">audiotrack</v-icon>
        <p>{{ fileName }}</p>
        <v-btn @click="resetForm" flat small round>remove</v-btn>
      </v-flex>
      <v-flex
        v-else
        class="text-xs-center cursor-pointer grey--text"
        @click="openFileDialog"
        shrink>
        <slot>
          <v-icon color="#666" style="font-size: 4em">open_in_browser</v-icon>
          <p class="mt-2">drop your audio file here</p>
        </slot>
      </v-flex>
    </v-layout>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class DropFile extends Vue {

  @Prop({ default: null }) initialFileName: string|null
  fileName = this.initialFileName
  file: File|null = null

  @Watch('initialFileName')
  onUpdateInitialFileName(n: string|null) {
    this.fileName = n
  }

  highlight(e: DragEvent|Event) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      console.log(e.dataTransfer.files[0], e.dataTransfer.items[0], e.dataTransfer.types[0]);
      (e.target as Element).classList.add('highlight')
    }
  }

  unhighlight(e: Event) {
    (e.target as Element).classList.remove('highlight')
  }

  useAudioFile(e: DragEvent) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      // console.log(e.dataTransfer.files[0], e.dataTransfer.items[0], e.dataTransfer.types[0])
      this.unhighlight(e)
      this.file = e.dataTransfer.files[0]
      this.fileName = this.file.name
      this.$emit('update', this.file)
    }
  }

  resetForm() {
    this.file = null
    this.fileName = null
    this.$emit('update', this.file)
  }

  openFileDialog() {
    const x = document.createElement('input')
    x.type = 'file'
    x.accept = '.ogg'
    x.addEventListener('change', async (e) => {
      if (x.files !== null) {
        this.file = x.files[0]
        this.fileName = this.file.name
        this.$emit('update', this.file)
      }
    })
    x.click()
  }
}
</script>
<style lang="stylus">
.drop-area
  margin 0 auto
  width 80%
  min-height 300px
  border-radius 5px
  background rgba(0,0,0,.2)
  box-shadow inset 0 0 30px rgba(0,0,0,.2), inset 0 -2px rgba(255,255,255,.2)
  &.highlight
    background rgba(0, 50, 150, .5)

</style>
