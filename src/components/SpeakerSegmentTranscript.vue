<template>
  <div class="segment-editor">
    <div class="token-fake-display segment-text">
      <div
        class="token"
        v-for="(token, i) in localTokens"
        :key="i">
        {{ token }}&nbsp;
        <div
          :style="{
            backgroundColor: tokenTypeFromToken(token).color
          }"
          :class="['token-type-indicator', focused && 'focused']" />
      </div>
    </div>
    <div
      @focus="focused = true"
      @blur="updateLabelText"
      v-contenteditable:segmentText="true"
      :style="textStyle"
      class="tokens-input segment-text">
    </div>
  </div>
</template>

<script lang="ts">

import contenteditableDirective from 'vue-contenteditable-directive'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import { updateSpeakerTokens, LocalTranscriptEvent } from '../store/transcript'
import * as _ from 'lodash'

Vue.use(contenteditableDirective)

@Component
export default class SpeakerSegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() speaker: string

  localTokens = this.event.speakerEvents[this.speaker]
    ? this.event.speakerEvents[Number(this.speaker)].tokens.slice().map(t => t.tiers.default.text)
    : []
  focused = false
  settings = settings
  updateSpeakerTokens = updateSpeakerTokens

  tokenTypeFromToken(token: string) {
    const type = _(settings.tokenTypes).find((tt) => {
      return tt.regex.test(token)
    })
    if (type) {
      return type
    } else {
      return {
        color: '#222',
      }
    }
  }

  get tokens() {
    return this.event.speakerEvents[this.speaker].tokens
  }

  get segmentText() {
    return this.localTokens ? this.localTokens.join(' ') : ''
  }

  set segmentText(newVal: string) {
    this.localTokens = newVal.split(' ')
  }

  updateLocalTokens(e: Event) {
    this.localTokens = ((e.target as HTMLDivElement).textContent || '').split(' ')
  }

  updateLabelText(e: Event) {
    this.focused = false
    const text = (e.target as HTMLDivElement).textContent
    if (text !== null && text !== '') {
      updateSpeakerTokens(this.event, this.speaker, this.tokens)
      this.$emit('update-speaker-event', this.tokens)
    }
  }

  get textStyle() {
    if (this.settings.darkMode === true) {
      return {
        color: 'white'
      }
    } else {
      return {
        color: '#333'
      }
    }
  }

}
</script>

<style lang="stylus" scoped>
.segment-editor
  position relative

.token-type-indicator
  height 3px
  border-radius 2px
  margin 1px 3px 3px 0px

.token-fake-display
  pointer-events none
  position absolute
  .token
    display inline-block
    color transparent

.tokens-input
  outline 0
  opacity .7
  transition .5s color
  &:focus
    outline 0
    opacity 1

.segment-text
  padding 1px

</style>
