<template>
  <div style="position:absolute">
    <div
      :key="key"
      v-for="(segment, key) in segments"
      @mousedown="selectSegment(segment)"
      @keyup.delete="deleteSegment(key, segment)"
      @dblclick="playSegment(key, segment)"
      :class="{segment: true, selected: selectedSegment === segment.id}"
      :style="{
        left: Number(segment.startTime) * pixelsPerSecond + 'px',
        width: (Number(segment.endTime) - Number(segment.startTime)) * pixelsPerSecond + 'px'
      }">
      <div slot="activator" class="segment-background" />
      <slot :segment="segment" />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { SpeakerEvent } from '@components/App.vue';

@Component
export default class Segments extends Vue {
  @Prop() metadata: any
  @Prop() segments: any[]
  @Prop() selectedSegment: number|null
  @Prop() speakerEvents: SpeakerEvent[]

  colors = [
    '#c0b8a6', '#eee1c6', '#ffe08c', '#ffdf6c', '#ababab', '#9ae7ff', '#004a7d', '#005abc', '#b9d6ff', '#949eaf', '#56524a', '#746a52', '#c0a96b', '#735c00', '#848484', '#7cdaff', '#00579a', '#467ab2', '#6f85a6', '#43474e', '#7b776e', '#e6d3a5', '#605121', '#bc9b00', '#6a6a6a', '#00a5ff', '#87cbff', '#33547a', '#5c6c83', '#afb9cb', '#949088', '#4d4637', '#b69b4b', '#907500', '#5e5e5e', '#6bccff', '#007ee6', '#0069ed', '#3e4756', '#5a5f66', '#afaba2', '#5d5132', '#89753a', '#564500', '#474747', '#b8e5ff', '#0064b9', '#4d6c94', '#a4badd', '#73777f', '#e7e2d9', '#938258', '#e3c467', '#dbb512', '#00ecff', '#96d8ff', '#a9d7ff', '#7faeea', '#8292ab', '#8c9199', '#9b9076', '#4f462f', '#d8b644', '#ffde00', '#00dcff', '#59beff', '#c7e4ff', '#6c93c5', '#555f6e', '#b4b9c2', '#655e4e', '#ecd292', '#9a8232', '#e2e2e2', '#6ae9ff', '#0098ff', '#0080ff', '#0050bf', '#7a8495', '#dee3ec', '#c4b89d', '#ae9c71', '#aa8e28', '#d4d4d4', '#00d1ff', '#0362a0', '#004c95', '#38485e', '#d3e4ff', '#8b8372', '#786941', '#f8d147', '#b9b9b9', '#00c4ff', '#1288da', '#58a2ee', '#a3c9fe', '#0056ea'
  ]
  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.totalWidth / this.metadata.audioLength
    }
  }
  selectSegment(segment: Segment) {
    this.$emit('select-segment', segment)
  }
  playSegment(key: number, segment: Segment) {
    this.$emit('play-segment', key, segment)
  }
  deleteSegment(key: number, segment: Segment) {
    console.log(key)
    console.log(segment)
    this.$emit('delete-segment', key, segment)
  }
  // mounted() {}
}
</script>
<style lang="stylus" scoped>
.segment
  height 100px
  top 50px
  border-radius 8px
  overflow hidden
  background rgba(0, 0, 0, .025)
  position absolute
  border-right 1px solid rgba(255,255,255,.2)
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.1);
  &.selected
    background transparent
    border: 2px solid cornflowerblue
    box-shadow 0 0 40px rgba(0,0,0,.2)
  &:hover:not(.selected)
    background rgba(0,0,0, .05)
  .segment-background
    background rgba(0,0,0,.05)
    position absolute
    left 0
    top 0
    right 0
    bottom 0
</style>
