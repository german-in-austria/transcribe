<template>
  <div>
    <h1>hello</h1>
    <div ref="svgContainer"></div>
    <h2>h2</h2>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as drawBuffer from 'draw-wave'

const ctxClass: any = window.AudioContext

@Component
export default class Waveform extends Vue {

  svg: SVGElement|null = null
  audioBuffer: AudioBuffer|null = null

  @Prop() audioElement: HTMLAudioElement|null
  @Prop() audioUrl: string
  @Prop() data: boolean

  async mounted() {
    if (this.audioElement !== null) {
      const x =  await fetch(this.audioElement.src).then(y => y.arrayBuffer())
      const context: AudioContext = new ctxClass()
      context.decodeAudioData(x, (audioBuffer) => {
        this.audioBuffer = audioBuffer
        this.svg = drawBuffer.svg(this.audioBuffer, 5000, 300, '#52F6A4')
        if (this.$refs.svgContainer instanceof HTMLElement) {
          (this.$refs.svgContainer as HTMLElement).appendChild(this.svg as Node)
        }
      }, (err) => {
        console.log(err)
      })
    }
  }
}
</script>
