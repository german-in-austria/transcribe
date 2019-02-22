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
          :style="{ backgroundColor: colorFromTokenType(token.tiers.default.type) }">
        </span><span class="token-spacer" /><span class="secondary-token-tier" v-for="tier in secondaryTiers" :key="tier.name">
          <span
            v-text="token.tiers[tier.name].text"
            @blur="(e) => updateAndCommitLocalTokenTier(e, tier.name, i)"
            contenteditable="true"
            @keydown.enter.meta="playEvent(event)"
            @keydown.enter.stop.prevent="viewAudioEvent(event)"
            class="secondary-token-tier-text" />
        </span>
      </span>
    </div>
    <div
      @focus="focused = true"
      @input="updateLocalTokens"
      @blur="updateAndCommitLocalTokens"
      @keydown.enter.meta="playEvent(event)"
      @keydown.enter.stop.prevent="viewAudioEvent(event)"
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
import { clone, isEqualDeep, requestFrameAsync } from '../util'
import {
  updateSpeakerTokens,
  LocalTranscriptEvent,
  eventStore,
  LocalTranscriptToken,
  makeTokenId,
  playEvent
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

  playEvent = playEvent
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

  viewAudioEvent(e: LocalTranscriptEvent) {
    eventStore.selectedEventIds = [ e.eventId ]
    eventStore.userState.viewingAudioEvent = e
  }

  get secondaryTiers() {
    return eventStore.metadata.tiers.filter(t => t.name !== 'default' && t.show === true)
  }

  get tokens() {
    return this.event.speakerEvents[this.speaker].tokens
  }

  colorFromTokenType(id: number): string {
    const c = this.settings.tokenTypes.find(tt => tt.id === id)
    if (c) {
      return c.color
    } else {
      return 'red'
    }
  }

  commit() {
    if (
      // it doesn’t exist
      this.event.speakerEvents[this.speaker] === undefined ||
      // it changed
      !isEqualDeep(this.localTokens, this.event.speakerEvents[this.speaker].tokens)
    ) {
      // perform update
      updateSpeakerTokens(this.localEvent, this.speaker, this.localTokens)
    } else {
      // nothing to update
    }
  }

  updateAndCommitLocalTokenTier(e: Event, tier: string, i: number) {
    this.localTokens[i].tiers[tier].text = (e.target as HTMLElement).textContent as string
    this.commit()
  }

  async updateAndCommitLocalTokens(e: Event) {
    await this.updateLocalTokens(e)
    this.commit()
  }

  async updateLocalTokens(e: Event) {
    await requestFrameAsync()
    const newTokens = this.tokenizeText((e.target as HTMLDivElement).textContent as string).map((t, i) => {
      return { text: t, index: i }
    })
    const oldTokens = this.localTokens.map((t, i) => ({ text: t.tiers.default.text, index: i }))
    console.log({ newTokens, oldTokens })
    const hunks = jsdiff.diffArrays(oldTokens, newTokens, { comparator: (l, r) => l.text === r.text })
    console.log({hunks})
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
        console.log('removed', u.text)
        ts.splice(u.index, 1)
      // INSERT
      } else if (u.type === 'add') {
        ts.splice(u.index, 0, {
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
    margin-top 4px
    position absolute
    display block
    margin-left -1px
    padding-left 2px
    background #272727
    color #989898
    width calc(100% - 2px)
    overflow hidden
    &:empty
      background #3e3e3e
    &:focus
      box-shadow 5px 0 10px rgba(0,0,0,.5)
      color #fff
      background #777
      outline 0
      border-radius 2px
      transform scale(1.1)
      transition transfrom .2s
      z-index 1
      min-width 100%
      width auto
      overflow unset
      padding-right 2px

.segment-editor
  position relative

.token-type-indicator
  border-radius 2px
  display inline

.token-display
  .token
    position relative
    display inline-block
    color transparent
    vertical-align top
    &:first-child .secondary-token-tier-text
      border-top-left-radius 5px
      border-bottom-left-radius 5px
    &:last-child .secondary-token-tier-text
      border-top-right-radius 5px
      border-bottom-right-radius 5px

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
