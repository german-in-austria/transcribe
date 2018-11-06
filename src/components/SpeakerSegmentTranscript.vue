<template>
  <div class="segment-editor">
    <div class="token-fake-display segment-text">
      <div
        class="token"
        v-for="(token, i) in localTokens"
        :key="i">
        {{ token }}&nbsp;
        <div
          :style="{ backgroundColor: tokenTypeFromToken(token).color }"
          :class="['token-type-indicator', focused && 'focused']">
        </div>
        <div class="secondary-token-tier" v-for="tier in secondaryTiers" :key="tier.name">
          <div v-if="event.speakerEvents[speaker] && event.speakerEvents[speaker].tokens[i]">
            {{ event.speakerEvents[speaker].tokens[i].tiers[tier.name].text }}
          </div>
        </div>
      </div>
    </div>
    <div
      @focus="focused = true"
      @input="updateLocalTokens"
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
import {
  updateSpeakerTokens,
  LocalTranscriptEvent,
  eventStore,
  LocalTranscriptToken,
  makeTokenId
} from '../store/transcript'
import * as _ from 'lodash'
import * as listDiff from 'list-diff2'

Vue.use(contenteditableDirective)

@Component
export default class SpeakerSegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() speaker: number

  localTokens = this.event.speakerEvents[this.speaker]
    ? this.event.speakerEvents[this.speaker].tokens.slice().map(t => t.tiers.default.text)
    : []
  localEvent = _.clone(this.event)
  focused = false
  settings = settings
  updateSpeakerTokens = updateSpeakerTokens

  tokenizeText(text: string) {
    return text.trim().split(' ')
  }

  get secondaryTiers() {
    return eventStore.metadata.tiers.filter(t => t.name !== 'default' && t.show === true)
  }

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
    const newTokens = this.tokenizeText((e.target as HTMLDivElement).textContent as string)
    console.log({newTokens})
    const {moves, children} = listDiff(
      this.localTokens.map(t => ({ text: t })),
      newTokens.map(t => ({ text: t })),
      'text'
    )
    const updates = _(moves)
      .groupBy('index')
      .map((moveGroup, k) => {
        if (moveGroup.length > 1) {
          return [ { index: moveGroup[0].index, type: 2, item: moveGroup[moveGroup.length - 1].item } ]
        } else {
          return moveGroup
        }
      })
      .flatten()
      .value()
    console.log({ moves, updates })
    const ts = this.event.speakerEvents[this.speaker].tokens
    updates.forEach((u) => {
      // DELETE
      if (u.type === 0) {
        ts.splice(u.index, 1)
      // INSERT
      } else if (u.type === 1) {
        ts.splice(u.index, 1, {
          id: makeTokenId(),
          tiers: {
            default: {
              text: u.item.text,
              type: 0
            },
            ortho: {
              text: '',
              type: null
            }
          }
        })
      // UPDATE
      } else if (u.type === 2) {
        ts[u.index].tiers.default.text = u.item.text
      }
    })
    console.log(this.event)
    // moves.forEach((move: any) => {
    //   if (move.type === 0) {
    //     this.event.speakerEvents[this.speaker].tokens.splice(move.index, 0)
    //   }
    // })
    // this.event = {
    //   ...this.event,
    //   speakerEvents: {
    //     ...this.event.speakerEvents,
    //     [this.speaker]: {
    //       ...this.event.speakerEvents[this.speaker],
    //       tokens: this.event.speakerEvents[this.speaker].tokens.filter(t => {
    //         return t
    //       })
    //     }
    //   }
    // }
    // console.log(editDiff(this.segmentText, newTokens.join(' '), window.getSelection().anchorOffset))
    // const ev: LocalTranscriptToken[] = this.localTokens.map((t, i) => {
    //   return {
    //     id: this.localEvent.speakerEvents[this.speaker].tokens[i].id
    //   }
    //   // console.log(t, this.localEvent.speakerEvents[this.speaker].tokens[i].tiers.default.text)
    // })
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
.secondary-token-tier
  color #777

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
    vertical-align top

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
