<template>
  <div class="segment-editor">
    <div class="token-display segment-text">
      <span
        class="token"
        v-for="(token, i) in localTokens"
        :key="token.id">
        <span
          v-html="token.tiers.default.text"
          :class="['token-type-indicator', focused && 'focused']"
          :style="{ backgroundColor: colorFromTokenType(token.tiers.default.type).color }">
        </span><span class="secondary-token-tier" v-for="tier in secondaryTiers" :key="tier.name">
          <span
            v-if="event.speakerEvents[speaker] && event.speakerEvents[speaker].tokens[i]"
            v-html="event.speakerEvents[speaker].tokens[i].tiers[tier.name].text"
            class="secondary-token-tier-text" />
        </span><span class="token-spacer" />
      </span>
    </div>
    <div
      @focus="focused = true"
      @input="updateLocalTokens"
      contenteditable="true"
      v-text="segmentText"
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

// Vue.use(contenteditableDirective)

function tokenTypeFromToken(token: string) {
    const type = _(settings.tokenTypes).find((tt) => {
      console.log({token}, tt.regex, tt.name)
      const x = tt.regex.test(token)
      console.log({x})
      return x
    })
    if (type !== undefined) {
      return type
    } else {
      return {
        name: 'error',
        color: 'red',
        id: -1
      }
    }
  }

@Component
export default class SpeakerSegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() speaker: number

  localTokens = this.event.speakerEvents[this.speaker]
    ? this.event.speakerEvents[this.speaker].tokens
    : []
  segmentText = this.localTokens ? this.localTokens.map(t => t.tiers.default.text).join(' ') : ''
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

  get tokens() {
    return this.event.speakerEvents[this.speaker].tokens
  }

  colorFromTokenType(id: number) {
    const c = this.settings.tokenTypes.find(tt => tt.id === id)
    if (c) {
      return c
    } else {
      return 'red'
    }
  }

  updateLocalTokens(e: Event) {
    const newTokens = this.tokenizeText((e.target as HTMLDivElement).textContent as string).map(t => ({ text: t }))
    const oldTokens = this.localTokens.map(t => ({ text: t.tiers.default.text }))
    console.log({ newTokens, oldTokens })
    const {moves, children} = listDiff(oldTokens, newTokens, 'text')
    const updates = _(moves)
      .groupBy('index')
      .map((moveGroup, k) => {
        if (moveGroup.length > 1) {
          return [{
            index: moveGroup[0].index,
            type: 2,
            item: moveGroup[moveGroup.length - 1].item
          }]
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
              type: tokenTypeFromToken(u.item.text).id
            },
            ortho: {
              text: '',
              type: null
            }
          }
        })
      // UPDATE
      } else if (u.type === 2) {
        ts[u.index].tiers.default = {
          text: u.item.text,
          type: tokenTypeFromToken(u.item.text).id
        }
      }
    })
    console.log(ts)
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
  .secondary-token-tier-text
  display inline-block
    border-bottom 1px dotted #777
    // margin-right .25em

.segment-editor
  position relative

.token-type-indicator
  border-radius 2px
  display inline

.token-display
  .token
    display inline
    color transparent
    vertical-align top

.tokens-input
  top 0
  position absolute
  width 100%
  outline 0
  opacity .7
  transition .5s color
  &:focus
    outline 0
    opacity 1

.segment-text
  padding 1px

.token-spacer
  display inline-block
  width .25em
</style>
