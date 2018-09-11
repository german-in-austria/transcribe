<template>
  <div class="speaker-event">
    <div
      @keydown.meta.enter.prevent.stop.native="play"
      ref="editable"
      :class="{editable: true}"
      @focus="selectAll"
      @blur="updateLabelText"
      v-html="labelText"
      contenteditable="true"></div>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import * as uuid from 'uuid/v4'

@Component
export default class SpeakerEvent extends Vue {

  @Prop() segment: Segment
  @Prop() metadata: SegmentMetadata
  @Prop() index: number
  @Prop() speaker: string
  @Prop() id: string
  @Prop() isFocused: boolean

  @Watch('isFocused')
  onSeek(doFocus: boolean) {
    console.log('doFocus', doFocus)
    if (doFocus) {
      (this.$refs.editable as HTMLDivElement).focus()
    }
  }
  play(e: Event) {
    console.log(e)
    this.$emit('play')
  }
  updateLabelText(e: Event) {
    const tokens = ((e.target as HTMLDivElement).textContent || '').split(' ')
    this.$emit('updateSpeakerEvent', this.speaker, this.id, tokens)
  }
  selectAll(e: Event) {
    this.$emit('focusEvent')
    document.execCommand('selectAll', false, null)
  }
  mounted() {
    console.log(this.metadata);
    (this.$refs.editable as HTMLDivElement).focus()
  }
  get labelText(): string {
    return this.metadata && this.metadata.tokens ? this.metadata.tokens.join(' ') : ''
  }
}
</script>
<style lang="scss" scoped>
.speaker-event{
  display: inline-block
}
.editable{
  background: #d4d4d4;
  border-radius: 1em;
  min-width: 2em;
  transition: .4s color, .4s background;
  padding: .2em .75em;
  border: 1px solid transparent;
  &:empty{
    background: transparent;
    border: 1px dashed #d4d4d4;
  }
  &:focus{
    color: white;
    background: cornflowerblue;
    border: 1px solid transparent;
    outline: 0;
  }
  &::-webkit-selection {
    background:rgba(0,0,0,.3);
    color:white;
  }
  &::selection {
    background:rgba(0,0,0,.3);
    color:white;
  }
}
</style>
