<template>
  <div
    :data-speaker-id="speaker"
    :class="[
      'segment-editor',
      isMarkedWithFragment && 'has-next-fragment',
      settings.darkMode === false && 'theme--light'
    ]">
    <div :class="['token-display', 'segment-text']">
      <span
        class="token"
        v-for="(token, i) in localTokens"
        :key="token.id">
        <span
          v-text="token.tiers[defaultTier].text"
          :class="[
            'token-type-indicator',
            focused && 'focused',
            'type-' + token.tiers[defaultTier].type,
            eventStore.lockedTokens.indexOf(token.id) > -1 && 'locked-token'
          ]"
          :style="{ backgroundColor: colorFromTokenType(token.tiers[defaultTier].type) }">
        </span><span v-if="!(i === localTokens.length - 1 && isMarkedWithFragment)" class="token-spacer" /><span :class="['secondary-token-tier', settings.darkMode === true && 'theme--dark']" v-for="(tier, tierIndex) in secondaryTiers" :key="tier.name">
          <span
            v-if="tier.type === 'token'"
            :style="{top: (tierIndex + 1) * tierHeight + 'px'}"
            :class="['secondary-token-tier-text', settings.darkMode === true && 'theme--dark']"
            v-text="token.tiers[tier.name] !== undefined ? token.tiers[tier.name].text : undefined"
            contenteditable="true"
            @blur="(e) => updateAndCommitLocalTokenTier(e, tier.name, i)"
            @focus="(e) => $emit('focus', e, event)" />
          <span v-else class="secondary-token-tier-text" />
        </span>
      </span>
    </div>
    <div
      @focus="onFocus"
      @input="updateLocalTokens"
      @blur="updateAndCommitLocalTokens"
      @keydown.tab.shift.exact="focusPreviousFrom($event, defaultTier)"
      @keydown.tab.exact="focusNextFrom($event, defaultTier)"
      @keydown.enter.exact.prevent="viewAndSelectAudioEvent(event)"
      @copy.prevent="copyTokens"
      @cut.prevent="cutTokens"
      @paste="pasteTokens"
      contenteditable="true"
      v-text="segmentText"
      :style="textStyle"
      :data-speaker-id="speaker"
      :data-event-id="event.eventId"
      class="tokens-input segment-text">
    </div>
    <div
      v-for="(tier, i) in secondaryTiers"
      :key="i"
      :style="{ height: tierHeight + 1 + 'px' }"
      :class="['secondary-free-text-tier', settings.darkMode === true && 'theme--dark']">
      <span
        v-if="localTokens.length && tier.type === 'freeText'"
        v-text="getTierFreeTextText(tier.id)"
        contenteditable="true"
        :class="['secondary-free-text-tier-text', settings.darkMode === true && 'theme--dark']"
        @keydown.tab.shift.exact="focusPreviousFrom(tier.id)"
        @keydown.tab.exact="focusNextFrom(tier.id)"
        @blur="(e) => updateAndCommitLocalEventTier(e, tier.id, tier.type)"
        @focus="(e) => $emit('focus', e, event)" />
    </div>
  </div>
</template>

<script lang="ts">

import contenteditableDirective from 'vue-contenteditable-directive'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings, { tokenTypesPresets } from '../store/settings'
import parseCsv from 'tiny-csv'

import {
  clone,
  isEqualDeep,
  requestFrameAsync,
  isUndoOrRedo
} from '../util'

import {
  LocalTranscriptEvent,
  LocalTranscriptToken,
  TierFreeText,
  TokenTierType,
  updateSpeakerEvent,
  eventStore,
  findPreviousSpeakerEvent,
  makeTokenId,
  playEvent,
  tokenTypeFromToken,
  findEventIndexById,
  scrollToAudioEvent,
  scrollToTranscriptEvent
} from '../store/transcript'

import * as copyPaste from '../service/copy-paste'
import { undoable } from '../store/history'
import * as _ from 'lodash'
import * as jsdiff from 'diff'
import eventBus from '../service/event-bus'

@Component
export default class SpeakerSegmentTranscript extends Vue {

  @Prop() event: LocalTranscriptEvent
  @Prop() nextEvent: LocalTranscriptEvent|undefined
  @Prop() previousEvent: LocalTranscriptEvent|undefined
  @Prop() speaker: number
  @Prop() index: number

  tierHeight = 25
  localEvent = clone(this.event)
  eventStore = eventStore
  localTokens = this.localEvent.speakerEvents[this.speaker]
    ? this.localEvent.speakerEvents[this.speaker].tokens
    : []
  defaultTier = eventStore.metadata.defaultTier
  segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
  focused = false

  settings = settings
  playEvent = playEvent
  updateSpeakerEvent = updateSpeakerEvent

  isFirstSpeaker(speakerId: number) {
    return _(eventStore.metadata.speakers)
      .map((s, id) => ({...s, id}))
      .findIndex(s => s.id === String(speakerId)) === 0
  }

  isLastSpeaker(speakerId: number) {
    return _(eventStore.metadata.speakers)
      .map((s, id) => ({...s, id}))
      .findIndex(s => s.id === String(speakerId)) === _(eventStore.metadata.speakers).toArray().value().length - 1
  }

  focusPreviousFrom(e: KeyboardEvent, tier: string) {
    console.log('prev', tier, eventStore.metadata.tiers, this.speaker, eventStore.metadata.speakers)
    if (this.isFirstSpeaker(this.speaker)) {
      e.preventDefault()
      const i = findEventIndexById(this.event.eventId)
      scrollToTranscriptEvent(
        eventStore.events[i > 0 ? i - 1 : 0],
        { animate: true, focusSpeaker: this.speaker }
      )
    }
  }

  focusNextFrom(e: KeyboardEvent, tier: string) {
    console.log('next', tier, eventStore.metadata.tiers, this.speaker, eventStore.metadata.speakers)
    if (this.isLastSpeaker(this.speaker)) {
      e.preventDefault()
      const i = findEventIndexById(this.event.eventId)
      scrollToTranscriptEvent(
        eventStore.events[i > -1 ? i + 1 : 0],
        { animate: true, focusSpeaker: this.speaker }
      )
    }
  }

  // TODO: redundant?
  @Watch('event')
  onUpdateEvent(newEvent: LocalTranscriptEvent) {
    this.localEvent = clone(newEvent)
    this.localTokens = this.localEvent.speakerEvents[this.speaker]
      ? this.localEvent.speakerEvents[this.speaker].tokens
      : []
    this.segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
  }

  async cutTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const base = s.baseOffset
      const extent = s.extentOffset
      const selectedTokens = copyPaste.collectTokensViaOffsets(this.localTokens, base, extent)
      this.localTokens = copyPaste.removeTokensAndTokenParts(this.localTokens, selectedTokens)
      const csv = copyPaste.serializeTokens(selectedTokens)
      e.clipboardData.setData('text/plain', csv)
      this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
      await this.$nextTick()
      this.setCursorPosition(e.currentTarget as HTMLElement, Math.min(base, extent))
    } else {
      // nothing is selected, copy nothing.
    }
  }

  onFocus(e: FocusEvent) {
    e.preventDefault()
    this.$emit('focus', e, this.event)
  }

  copyTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const tokens = copyPaste.collectTokensViaOffsets(this.localTokens, s.baseOffset, s.extentOffset)
      const csv = copyPaste.serializeTokens(tokens)
      e.clipboardData.setData('text/plain', csv)
    } else {
      // nothing is selected, copy nothing.
    }
  }

  setCursorPosition(el: HTMLElement, at: number) {
    const pos = Math.min(this.segmentText.length, at)
    const range = document.createRange()
    const sel = window.getSelection()
    range.setStart(el.firstChild || el.parentNode!.firstChild!, pos)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  async pasteTokens(e: ClipboardEvent) {
    // get clipboard data as string
    if (e.clipboardData !== null) {
      const clipboardString = e.clipboardData.getData('text/plain')
      const s = document.getSelection()
      try {
        // TODO: check what is returned here if it’s not a csv
        const tokensTiers = copyPaste.unserializeTokenTiers(clipboardString)
        if (tokensTiers.length > 0 && s !== null) {
          // copy to local variables, because the selection might change.
          const base = s.baseOffset
          const extent = s.extentOffset
          e.preventDefault()
          // update tokens
          this.localTokens = copyPaste.mergePastableTokensAt(
            this.localTokens,
            tokensTiers,
            base,
            extent,
            this.firstTokenOrder || 0
          )
          // update text presentation
          this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
          if (e.currentTarget !== null) {
            await this.$nextTick()
            console.log('s.baseOffset, s.extentOffset', base, extent)
            this.setCursorPosition(e.currentTarget as HTMLElement, Math.max(base, extent))
          }
        } else {
          // paste as string.
          document.execCommand('insertHTML', false, clipboardString)
        }
      } catch (e) {
        console.error(e)
        // do nothing (i.e. default OS functionality)
      }
    }
  }

  getTierFreeTextText(tierId: string) {
    return (
      this.localEvent.speakerEvents[this.speaker] !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers[tierId] !== undefined
        ? (this.localEvent.speakerEvents[this.speaker].speakerEventTiers[tierId] as TierFreeText).text
        : ''
    )
  }

  get isMarkedWithFragment(): boolean {
    const last = _(this.localTokens).last()
    return last !== undefined && last.tiers[this.defaultTier].text.endsWith('=')
  }

  get firstTokenFragmentOf(): number|null {
    const speakerEvent = this.event.speakerEvents[this.speaker]
    if (speakerEvent !== undefined) {
      const firstToken = _(speakerEvent.tokens).first()
      if (firstToken !== undefined && firstToken.fragmentOf) {
        return firstToken.fragmentOf
      } else {
        return null
      }
    } else {
      return null
    }
  }

  get secondaryTokenTiers() {
    return this.secondaryTiers.filter(t => t.type === 'token')
  }

  get secondaryFreeTextTiers() {
    return this.secondaryTiers.filter(t => t.type === 'freeText')
  }

  get secondaryTiers() {
    return eventStore.metadata.tiers.filter(t => t.id !== this.defaultTier && t.show === true)
  }

  get tokens() {
    return this.event.speakerEvents[this.speaker].tokens
  }

  get firstTokenOrder() {
    const speakerEvent = this.event.speakerEvents[this.speaker]
    if (speakerEvent) {
      const firstToken = this.event.speakerEvents[this.speaker].tokens[0]
      if (firstToken) {
        return firstToken.order
      } else {
        return undefined
      }
    } else {
      const i = findPreviousSpeakerEvent(this.speaker, this.event.eventId)
      if (i !== undefined) {
        const prevLastToken = _(eventStore.events[i].speakerEvents[this.speaker].tokens).last()
        if (prevLastToken) {
          return prevLastToken.order + 1
        } else {
          return 0
        }
      } else {
        return 0
      }
    }
  }

  tokenizeText(text: string) {
    return text.trim().split(' ').filter((t) => t !== '')
  }

  viewAndSelectAudioEvent(e: LocalTranscriptEvent) {
    eventStore.selectedEventIds = [ e.eventId ]
    scrollToAudioEvent(e)
  }

  colorFromTokenType(id: number): string {
    const c = tokenTypesPresets[settings.tokenTypesPreset].find(tt => tt.id === id)
    if (c) {
      return c.color
    } else {
      return 'red'
    }
  }

  commit() {
    if (
      // it’s new and not empty
      (
        this.event.speakerEvents[this.speaker] === undefined &&
        this.localTokens.length !== 0
      ) ||
      // it’s old and it has changed
      (
        this.event.speakerEvents[this.speaker] !== undefined &&
        !isEqualDeep(this.localTokens, this.event.speakerEvents[this.speaker].tokens)
      )
    ) {
      // console.log(this.localEvent, this.speaker, this.localTokens)
      // perform update
      undoable(updateSpeakerEvent(this.localEvent, this.speaker, this.localTokens))
    } else {
      // nothing to update
    }
  }

  updateAndCommitLocalEventTier(e: Event, id: string, tierType: string) {
    if (
      this.localEvent.speakerEvents[this.speaker] !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers[id] !== undefined) {
      if (tierType === 'freeText') {
        (this.localEvent
          .speakerEvents[this.speaker]
          .speakerEventTiers[id] as TierFreeText
        ).text = (e.target as HTMLElement).textContent as string
      }
      this.commit()
    } else {
      console.log('CREATE!')
      // does not yet exist
    }
  }

  updateAndCommitLocalTokenTier(e: Event, tierName: TokenTierType, i: number) {
    const text = (e.target as HTMLElement).textContent as string
    this.localTokens[i].tiers[tierName] = { text, type: null }
    this.commit()
  }

  async updateAndCommitLocalTokens(e: Event) {
    await this.updateLocalTokens(e)
    this.commit()
  }

  async updateLocalTokens(e: Event) {
    // await requestFrameAsync()
    const newTokens = this.tokenizeText((e.target as HTMLDivElement).textContent as string).map((t, i) => {
      return { text: t, index: i, id: -1 }
    })
    const oldTokens = this.localTokens.map((t, i) => ({
      text: t.tiers[this.defaultTier].text,
      id: t.id,
      index: i
    }))
    const hunks = jsdiff.diffArrays(oldTokens, newTokens, { comparator: (l, r) => l.text === r.text })
    console.log({ hunks })
    const changes = _(hunks)
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
            id: g[0].id,
            type: 'update'
          }]
        } else {
          return g
        }
      })
      .flatten()
      .value()

    console.log({changes})

    let addedCounter = 0
    _.each(changes, (change, i) => {
      if (change.type === 'update') {
        this.localTokens[change.index + addedCounter] = {
          ...this.localTokens[change.index + addedCounter],
          tiers: {
            ...this.localTokens[change.index + addedCounter].tiers,
            [ this.defaultTier ]: {
              text: change.text,
              type: tokenTypeFromToken(change.text).id
            }
          }
        }
      } else if (change.type === 'add') {
        this.localTokens.splice(change.index + addedCounter, 0, {
          id: makeTokenId(),
          fragmentOf: i === 0 ? this.firstTokenFragmentOf : null,
          order: -1,
          sentenceId: -1, // how?
          tiers: {
            text: {
              text: '',
              type: null
            },
            ortho: {
              text: '',
              type: null
            },
            phon: {
              text: '',
              type: null
            },
            [ this.defaultTier ]: {
              text: change.text,
              type: tokenTypeFromToken(change.text).id
            }
          }
        })
        addedCounter = addedCounter + 1
      } else if (change.type === 'remove') {
        if (change.id !== -1 && eventStore.lockedTokens.indexOf(change.id) > -1) {
          // can’t delete because it’s locked.
          console.log('can’t delete')

          // FIXME: this doesn’t always work.
          // update display text
          setTimeout(() => {
            // tslint:disable-next-line:max-line-length
            this.segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
          }, 16)
        } else {
          this.localTokens.splice(change.index + addedCounter, 1)
          addedCounter = addedCounter - 1
        }
      }
    })
    this.localTokens = this.localTokens.map((t, i) => {
      return { ...t, order: (this.firstTokenOrder || 0) + i }
    })
  }

  updateLabelText(e: Event) {
    this.focused = false
    const text = (e.target as HTMLDivElement).textContent
    if (text !== null && text !== '') {
      updateSpeakerEvent(this.event, this.speaker, this.tokens)
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

.secondary-free-text-tier
  &.theme--dark
    color #777
  .secondary-free-text-tier-text
    display inline-block
    min-width 1.6em
    margin-left -1px
    padding 0 2px
    border-radius 5px
    white-space nowrap
    background #ccc
    color #333
    &.theme--dark
      background #3e3e3e
    &:empty
      background #eee
      &.theme--dark
        background #252525
    &:focus
      outline 0
      color #333
      background #fff
      &.theme--dark
        color #fff
        background #777

.secondary-token-tier
  &.theme--dark
    color #777
  .secondary-token-tier-text
    position absolute
    display block
    margin-left -1px
    padding-left 2px
    width calc(100% - 2px)
    overflow hidden
    white-space nowrap
    background #ccc
    color #333
    &.theme--dark
      background #3e3e3e
      color #ddd
    &:empty
      background #eee
      &.theme--dark
        background #252525
    &:focus
      box-shadow 5px 0 10px rgba(0,0,0,.5)
      outline 0
      border-radius 2px
      transform scale(1.1)
      transition transfrom .2s
      z-index 1
      min-width 100%
      width auto
      overflow unset
      padding-right 2px
      color #333
      background #fff
      &.theme--dark
        color #fff
        background #777

.segment-editor
  position relative

.token-type-indicator
  transition .25s background-color
  border-radius 2px
  display inline
  pointer-events none

.locked-token
  border-bottom 3px solid red

// in the light theme, the text inside of the
// indicator should be in front and white.
.theme--light .token-type-indicator:not(.type-1)
  z-index 1
  position relative
  color white

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

.has-next-fragment
  text-align right
</style>
