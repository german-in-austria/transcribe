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
      @blur="commit"
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
import { clone, isEqualDeep } from '../util'
import {
  updateSpeakerTokens,
  LocalTranscriptEvent,
  eventStore,
  LocalTranscriptToken,
  makeTokenId
} from '../store/transcript'
import * as _ from 'lodash'
import * as jsdiff from 'diff'

function tokenTypeFromToken(token: string) {
  const type = _(settings.tokenTypes).find((tt) => {
    return tt.regex.test(token)
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

  localEvent = clone(this.event)
  localTokens = this.localEvent.speakerEvents[this.speaker]
    ? this.localEvent.speakerEvents[this.speaker].tokens
    : []
  segmentText = this.localTokens ? this.localTokens.map(t => t.tiers.default.text).join(' ') : ''
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

  commit() {
    if (!isEqualDeep(this.localTokens, this.event.speakerEvents[this.speaker].tokens)) {
      updateSpeakerTokens(this.localEvent, this.speaker, this.localTokens)
    } else {
      // nothing to update
    }
  }

  updateLocalTokens(e: Event) {
    requestAnimationFrame(() => {
      const newTokens = this.tokenizeText((e.target as HTMLDivElement).textContent as string).map((t, i) => {
        return { text: t, index: i }
      })
      const oldTokens = this.localTokens.map((t, i) => ({ text: t.tiers.default.text, index: i }))
      console.log({ newTokens, oldTokens })
      const hunks = jsdiff.diffArrays(oldTokens, newTokens, { comparator: (l, r) => l.text === r.text })

      const updates = _(hunks)
        .filter((h) => h.added === true || h.removed === true)
        .map((h) => h.value.map(v => ({
          ...v,
          type: (() => {
            if (h.added === true) {
              return 'add'
            } else if (h.removed) {
              return 'remove'
            }
          })()
        })))
        .flatten()
        .groupBy('index')
        .map((g) => {
          if (g.length > 1) {
            return [{
              ...g[1],
              type: 'update'
            }]
          } else {
            return g
          }
        })
        .flatten()
        .value()
      console.log({updates})
      const ts = this.localTokens
      updates.forEach((u) => {
        // DELETE
        if (u.type === 'remove') {
          ts.splice(u.index, 1)
        // INSERT
        } else if (u.type === 'add') {
          ts.splice(u.index, 1, {
            id: makeTokenId(),
            tiers: {
              default: {
                text: u.text,
                type: tokenTypeFromToken(u.text).id
              },
              ortho: {
                text: '',
                type: null
              }
            }
          })
        // UPDATE
        } else if (u.type === 'update') {
          ts[u.index].tiers.default = {
            text: u.text,
            type: tokenTypeFromToken(u.text).id
          }
        }
      })
    })
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
