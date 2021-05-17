<template>
  <div
    :class="[
      'segment-editor',
      isMarkedWithFragment && 'has-next-fragment',
      settings.darkMode === false && 'theme--light'
    ]">
    <div :class="['token-display', 'segment-text']">
      <span v-if="localTokens.length === 0" class="token" />
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
        </span><span v-if="!(i === localTokens.length - 1 && isMarkedWithFragment)" class="token-spacer" /><span :class="['secondary-token-tier', settings.darkMode === true && 'theme--dark']" v-for="(tier, tierIndex) in secondaryTiers" :key="tier.id">
          <contenteditable
            v-rt-ipa="{show: tier.id === 'phon'}"
            v-if="tier.type === 'token'"
            :style="{top: (tierIndex + 1) * tierHeight + 'px'}"
            :class="['secondary-token-tier-text', settings.darkMode === true && 'theme--dark']"
            :value="token.tiers[tier.id] !== undefined ? token.tiers[tier.id].text : undefined"
            :id="`speaker_event_tier_${speaker}__${tier.id}`"
            :data-speaker-id="speaker"
            :data-event-id="event.eventId"
            @keydown.enter.exact.prevent="viewAndSelectAudioEvent(event)"
            @input="(e) => { debouncedUpdateTokenTier(e.target.textContent, tier.id, i) }"
            @blur="onBlurEvent"
            @focus="onFocusEvent" />
          <span v-else class="secondary-token-tier-text" />
        </span>
      </span>
    </div>
    <contenteditable
      @blur="onBlurEvent"
      @focus="onFocusEvent"
      @input="(e) => updateDefaultTier(e.target.textContent)"
      @keydown.tab.shift.exact="focusPreviousFrom($event, defaultTier)"
      @keydown.tab.exact="focusNextFrom($event, defaultTier)"
      @keydown.enter.exact.prevent="viewAndSelectAudioEvent(event)"
      @keydown.right.exact="handleCursor($event, defaultTier)"
      @keydown.left.exact="handleCursor($event, defaultTier)"
      @copy.prevent="copyTokens"
      @cut.prevent="cutTokens"
      @paste.prevent="pasteTokens"
      :id="`speaker_event_tier_${speaker}__${defaultTier}`"
      :value="segmentText"
      :style="textStyle"
      :data-speaker-id="speaker"
      :data-event-id="event.eventId"
      class="tokens-input segment-text"
    />
    <div
      v-for="(tier, i) in secondaryTiers"
      :key="i"
      :style="{ height: tierHeight + 1 + 'px' }"
      :class="['secondary-free-text-tier', settings.darkMode === true && 'theme--dark']">
      <span
        v-if="tier.type === 'freeText'"
        v-text="getTierFreeTextText(tier.id)"
        contenteditable="true"
        :id="`speaker_event_tier_${speaker}__${tier.id}`"
        :class="['secondary-free-text-tier-text', settings.darkMode === true && 'theme--dark']"
        :data-speaker-id="speaker"
        :data-event-id="event.eventId"
        @keydown.tab.shift.exact="focusPreviousFrom($event, tier.id)"
        @keydown.enter.exact.prevent="viewAndSelectAudioEvent(event)"
        @keydown.tab.exact="focusNextFrom($event, tier.id)"
        @blur="(e) => { updateEventTier(e.target.textContent, tier.id); onBlurEvent() }"
        @focus="onFocusEvent"
        />
    </div>
  </div>
</template>

<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import presets from '../presets'

import {
  clone,
  isEqualDeep
} from '../util'

import {
  LocalTranscriptEvent,
  TierFreeText,
  TokenTierType,
  updateSpeakerEvent,
  eventStore,
  makeTokenId,
  playEvent,
  tokenTypeFromToken,
  findEventIndexById,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  makeEventTierId,
  selectEvent,
  getFirstTokenOrder
} from '../store/transcript'

import contenteditable from './helper/Contenteditable.vue'
import * as copyPaste from '../service/copy-paste'
import { undoable } from '../store/history'
import _ from 'lodash'
import * as jsdiff from 'diff'
import eventBus from '../service/event-bus'
import { computeTokenTypesForEvents } from '../service/token-types'

@Component({
  components: {
    contenteditable
  }
})
export default class SpeakerSegmentTranscript extends Vue {

  @Prop({ required: true }) event!: LocalTranscriptEvent
  @Prop({ required: true }) speaker!: string

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

  debouncedUpdateTokenTier = _.debounce(this.updateTokenTier, 300)
  debouncedUpdateEventTier = _.debounce(this.updateEventTier, 300)
  debouncedCommitEvent = _.debounce(this.commitEvent, 300)

  mounted() {
    // tslint:disable-next-line:max-line-length
    eventBus.$on('updateSpeakerEventText', this.updateTextFromEventBus)
  }

  destroyed() {
    eventBus.$off('updateSpeakerEventText', this.updateTextFromEventBus)
  }

  updateTextFromEventBus({ eventId, speakerId, text }: { eventId: string, speakerId: string, text: string }) {
    if (Number(eventId) === this.event.eventId && speakerId === this.speaker) {
      this.segmentText = text.replace(/\s/g, ' ')
      this.updateDefaultTier(this.segmentText)
    }
  }

  onBlurEvent() {
    eventStore.userState.editingTranscriptEvent = null
    this.focused = false
    if (presets[settings.projectPreset].autoCorrectDelimiterSpace === true) {
      if (this.event.speakerEvents[this.speaker] !== undefined) {
        const text = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
        const replacedText = text.replace(presets[settings.projectPreset].autoCorrectDelimiterSpaceRegex, ' $1')
        this.updateDefaultTier(replacedText)
      }
    }
  }

  onFocusEvent() {
    eventStore.userState.editingTranscriptEvent = this.event
    selectEvent(this.event)
    if (settings.lockScroll === true) {
      scrollToAudioEvent(this.event)
    }
    this.focused = true
  }

  updateTokenTier(text: string|undefined|null, tierType: TokenTierType, index: number) {
    const cleanText = text === undefined || text === null ? '' : text
    this.localTokens[index].tiers[tierType] = { text: cleanText, type: null }
    this.commitEvent()
  }

  updateAllTokenTypes(event: LocalTranscriptEvent) {
    eventStore.events = computeTokenTypesForEvents(eventStore.events, this.defaultTier, [ String(this.speaker) ])
    const thisEvent = eventStore.events[findEventIndexById(this.event.eventId)]
    this.updateLocalTokenTypes(thisEvent)
  }

  updateLocalTokenTypes(e: LocalTranscriptEvent) {
    this.localTokens = this.localTokens.map((t, i) => {
      return {
        ...t,
        tiers: {
          ...t.tiers,
          [this.defaultTier]: {
            text: t.tiers[this.defaultTier].text,
            type: e.speakerEvents[this.speaker].tokens[i].tiers[this.defaultTier].type
          }
        }
      }
    })
  }

  updateDefaultTier(text: string|undefined|null) {
    const cleanText = text === undefined || text === null ? '' : text
    this.updateLocalTokens(cleanText)
    this.debouncedCommitEvent()
  }

  handleCursor(e: KeyboardEvent, tier: TokenTierType) {
    const s = getSelection()
    const n = s !== null ? s.focusNode : null
    if (e.currentTarget instanceof HTMLElement && s !== null && n !== null) {
      if (e.key === 'ArrowLeft' && s.anchorOffset === 0) {
        this.focusPreviousFrom(e, tier)
      } else if (e.key === 'ArrowRight' && s !== null && s.anchorOffset === n.textContent!.length) {
        this.focusNextFrom(e, tier)
      }
    }
  }

  focusPreviousFrom(e: KeyboardEvent, tier: TokenTierType) {
    e.preventDefault()
    const i = findEventIndexById(this.event.eventId)
    const prevE = eventStore.events[i > 0 ? i - 1 : 0]
    if (prevE !== undefined) {
      scrollToTranscriptEvent(
        prevE,
        {
          animate: true,
          focusSpeaker: this.speaker,
          focusTier: tier,
          focusRight: true
        }
      )
    }
  }

  focusNextFrom(e: KeyboardEvent, tier: TokenTierType) {
    e.preventDefault()
    const i = findEventIndexById(this.event.eventId)
    const nextE = eventStore.events[i > -1 ? i + 1 : 0]
    if (nextE !== undefined) {
      scrollToTranscriptEvent(
        nextE,
        { animate: true, focusSpeaker: this.speaker, focusTier: tier, focusRight: false }
      )
    }
  }

  @Watch('event', { deep: true })
  onUpdateEvent(newEvent: LocalTranscriptEvent) {
    // update if not focused
    // console.log('watcher', window.getSelection())
    this.localEvent = clone(newEvent)
    this.localTokens = this.localEvent.speakerEvents[this.speaker]
      ? this.localEvent.speakerEvents[this.speaker].tokens
      : []
    this.segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
    // don’t update if focused
  }

  async cutTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const base = (s as any).baseOffset
      const extent = (s as any).extentOffset
      const selectedTokens = copyPaste.collectTokensViaOffsets(this.localTokens, base, extent)
      this.localTokens = copyPaste.removeTokensAndTokenParts(this.localTokens, selectedTokens)
      const csv = copyPaste.serializeTokens(selectedTokens)
      if (e.clipboardData !== null) {
        e.clipboardData.setData('text/plain', csv)
      }
      this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
      await this.$nextTick()
      this.setCursorPosition(e.currentTarget as HTMLElement, Math.min(base, extent))
      this.debouncedCommitEvent()
    } else {
      // nothing is selected, copy nothing.
    }
  }

  copyTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const tokens = copyPaste.collectTokensViaOffsets(this.localTokens, (s as any).baseOffset, (s as any).extentOffset)
      const csv = copyPaste.serializeTokens(tokens)
      if (e.clipboardData !== null) {
        e.clipboardData.setData('text/plain', csv)
      }
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
    if (sel !== null) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
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
          const base = (s as any).baseOffset
          const extent = (s as any).extentOffset
          e.preventDefault()
          // update tokens
          this.localTokens = copyPaste.mergePastableTokensAt(
            this.localTokens,
            tokensTiers,
            base,
            extent,
            getFirstTokenOrder(this.event, this.speaker)
          )
          // update text presentation
          this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
          if (e.currentTarget !== null) {
            await this.$nextTick()
            this.setCursorPosition(e.currentTarget as HTMLElement, Math.max(base, extent))
          }
        } else {
          // paste as string.
          document.execCommand('insertHTML', false, clipboardString)
        }
        this.debouncedCommitEvent()
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

  tokenizeText(text: string) {
    return text.split(' ').filter((t) => t !== '')
  }

  viewAndSelectAudioEvent(e: LocalTranscriptEvent) {
    selectEvent(e)
    scrollToAudioEvent(e)
  }

  colorFromTokenType(id: number): string {
    const c = presets[settings.projectPreset].tokenTypes.concat({
      name: 'placeholder',
      type: 'single',
      regex: /⦿/,
      color: 'grey',
      id: -2
    }).find(tt => tt.id === id)
    if (c) {
      return c.color
    } else {
      return 'red'
    }
  }

  commitEvent() {
    const oldEvent = findEventIndexById(this.event.eventId)
    const newEvent: LocalTranscriptEvent = {
      ...this.localEvent,
      speakerEvents: {
        [ this.speaker ]: {
          ...this.localEvent.speakerEvents[this.speaker],
          tokens: this.localTokens
        }
      }
    }
    if (!isEqualDeep(this.localEvent, oldEvent)) {
      undoable(updateSpeakerEvent(newEvent, Number(this.speaker)))
      this.updateAllTokenTypes(newEvent)
    } else {
      // nothing to update
    }
  }

  isValidTierEventText(text: string): boolean {
    return text.trim() !== ''
  }

  hasEventTierChanged(text: string, tierId: string): boolean {
    return this.localEvent.speakerEvents[this.speaker].speakerEventTiers[tierId].text !== text
  }

  eventTierExists(tierId: string): boolean {
    return this.localEvent.speakerEvents[this.speaker] !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers !== undefined &&
      this.localEvent.speakerEvents[this.speaker].speakerEventTiers[tierId] !== undefined
  }

  createEventTier(text: string, tierId: string) {
    this.localEvent = {
      ...this.localEvent,
      speakerEvents: {
        ...this.localEvent.speakerEvents,
        [ this.speaker ]: {
          ...this.localEvent.speakerEvents[this.speaker],
          speakerEventTiers: {
            ...(this.localEvent.speakerEvents[this.speaker] || {}).speakerEventTiers,
            [ tierId ]: {
              id: String(makeEventTierId()),
              type: 'freeText',
              text
            }
          }
        }
      }
    }
  }

  deleteEventTier(tierId: string) {
    const e = this.localEvent
    delete e.speakerEvents[this.speaker].speakerEventTiers[tierId]
    this.localEvent = e
  }

  updateEventTierText(text: string, tierId: string) {
    this.localEvent.speakerEvents[this.speaker].speakerEventTiers[tierId].text = text
  }

  updateEventTier(text: string|null|undefined, tierId: string) {
    const cleanText = text === null || text === undefined ? '' : text
    if (this.eventTierExists(tierId) && this.hasEventTierChanged(cleanText, tierId)) {
      if (this.isValidTierEventText(cleanText)) {
        // update
        this.updateEventTierText(cleanText, tierId)
        this.commitEvent()
      } else {
        // delete
        this.deleteEventTier(tierId)
        this.commitEvent()
      }
    } else if (this.isValidTierEventText(cleanText)) {
      // create
      if (this.localTokens.length === 0) {
        // if there are no tokens, put the placeholder.
        this.updateLocalTokens(settings.placeholderToken)
      }
      this.createEventTier(cleanText, tierId)
      this.commitEvent()
    }
  }

  updateLocalTokens(text: string) {
    // await requestFrameAsync()
    const newTokens = this.tokenizeText(text).map((t, i) => {
      return { text: t, index: i, id: -1 }
    })
    const oldTokens = this.localTokens.map((t, i) => ({
      text: t.tiers[this.defaultTier].text,
      id: t.id,
      index: i
    }))
    const hunks = jsdiff.diffArrays(oldTokens, newTokens, { comparator: (l, r) => l.text === r.text })
    // console.log({ hunks })
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
          fragmentOf: Number(i) === 0 ? this.firstTokenFragmentOf : null,
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
      return { ...t, order: (getFirstTokenOrder(this.event, this.speaker)) + i }
    })
    return this.localTokens
  }

  get textStyle() {
    if (this.settings.darkMode === true) {
      return {
        color: 'white'
      }
    } else {
      return {
        color: 'white',
        caretColor: 'black'
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
      color #ccc
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
  border-bottom 3px solid green

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

.theme--light .token-display
  .token-type-indicator
    position relative
    z-index 0
    &.type-1
      z-index 1
      color #333 !important

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
