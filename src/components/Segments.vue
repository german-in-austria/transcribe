<template>
  <div style="position:absolute">
    <div
      :key="key"
      v-for="(segment, key) in segments"
      @mousedown="selectSegment(segment)"
      @dblclick="playSegment(key, segment)"
      @keyup.delete="deleteSegment(key, segment)"
      @keyup.right.prevent.stop="selectNext(key)"
      @keyup.left.prevent.stop="selectPrevious(key)"
      tabindex="-1"
      :class="[ 'segment', selectedSegment.id === segment.id && 'selected' ]"
      :style="{
        left  : offsetFromSegment(segment) + 'px',
        width : widthFromSegment(segment) + 'px'
      }">
      <div slot="activator" class="segment-background" />
      <slot :segment="segment" />
      <resizer
        @resize="onResizeLeft"
        :elsize="widthFromSegment(segment)"
        side="left"
      />
      <resizer
        @resize="onResizeRight"
        :elsize="widthFromSegment(segment)"
        side="right"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { SpeakerEvent } from '@components/App.vue'
import Resizer from '@components/helper/Resizer.vue'

@Component({
  components: {
    Resizer
  }
})
export default class Segments extends Vue {

  @Prop() metadata: any
  @Prop() segments: Segment[]
  @Prop() selectedSegment: Segment|null
  @Prop() speakerEvents: SpeakerEvent[]

  widthFromSegment(s: Segment) {
    return (Number(s.endTime) - Number(s.startTime)) * this.pixelsPerSecond
  }

  offsetFromSegment(s: Segment) {
    return Number(s.startTime) * this.pixelsPerSecond
  }

  get pixelsPerSecond() {
    if ( this.metadata !== null) {
      return this.metadata.totalWidth / this.metadata.audioLength
    } else {
      return 0
    }
  }
  selectNext(i: number) {
    console.log({i})
    this.$emit('select-next', i)
  }
  selectPrevious(i: number) {
    console.log({i})
    this.$emit('select-previous', i)
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
  onResizeRight(w: number, oldW: number) {
    if (this.selectedSegment !== null) {
      const newDuration = w / this.pixelsPerSecond
      const oldDuration = oldW / this.pixelsPerSecond
      const difference = newDuration - oldDuration
      console.log({w, oldW, difference})
      const s = this.segments.find((r) => this.selectedSegment ? r.id === this.selectedSegment.id : false)
      if (s && w > 0) {
        s.endTime = s.endTime + difference
      }
    }
  }
  onResizeLeft(w: number, oldW: number) {
    if (this.selectedSegment !== null) {
      const newDuration = w / this.pixelsPerSecond
      const oldDuration = oldW / this.pixelsPerSecond
      const difference = oldDuration - newDuration
      // TODO: don’t loop. this is a performance problem
      const s = this.segments.find((r) => this.selectedSegment ? r.id === this.selectedSegment.id : false)
      if (s && w > 0) {
        s.startTime = s.startTime + difference
      }
    }
  }
  // mounted() {}
}
</script>
