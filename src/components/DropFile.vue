<template>
  <div>
    <div ref="dropArea" class="drop-area">
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component
export default class DropFile extends Vue {

  highlight(e: DragEvent|Event) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      console.log(e.dataTransfer.files[0], e.dataTransfer.items[0], e.dataTransfer.types[0])
    };
    (this.$refs.dropArea as Element).classList.add('highlight')
  }

  unhighlight() {
    (this.$refs.dropArea as Element).classList.remove('highlight')
  }

  useAudioFile(e: DragEvent|Event) {
    if (e instanceof DragEvent && e.dataTransfer !== null) {
      console.log(e.dataTransfer.files[0], e.dataTransfer.items[0], e.dataTransfer.types[0])
    }
  }

  mounted() {
    const dropArea = this.$refs.dropArea
    if (dropArea instanceof Element) {
      dropArea.addEventListener('dragenter', this.highlight, false)
      dropArea.addEventListener('dragleave', this.unhighlight, false)
      dropArea.addEventListener('drop', this.useAudioFile, false)
    }
  }

  beforeDestroy() {
    const dropArea = this.$refs.dropArea
    if (dropArea instanceof Element) {
      dropArea.removeEventListener('dragenter', this.highlight, false)
      dropArea.addEventListener('dragleave', this.unhighlight, false)
      dropArea.addEventListener('drop', this.useAudioFile, false)
    }
  }
}
</script>
<style lang="stylus" scoped>
.drop-area{
  width 200px
  height 200px
  border 2px dotted white
  border-radius 5px
}
</style>
