<template>
  <div :class="['segment-editor', isMarkedWithFragment && 'has-next-fragment']">
    <div :class="['token-display', 'segment-text']">
      <span
        class="token"
        v-for="(token, i) in localTokens"
        :key="token.id">
        <span
          v-text="token.tiers[defaultTier].text"
          :class="['token-type-indicator', focused && 'focused']"
          :style="{ backgroundColor: colorFromTokenType(token.tiers[defaultTier].type) }">
        </span><span v-if="!(i === localTokens.length - 1 && isMarkedWithFragment)" class="token-spacer" /><span class="secondary-token-tier" v-for="(tier, tierIndex) in secondaryTiers" :key="tier.name">
          <span
            v-if="tier.type === 'token'"
            :style="{top: (tierIndex + 1) * tierHeight + 'px'}"
            class="secondary-token-tier-text"
            v-text="token.tiers[tier.name] !== undefined ? token.tiers[tier.name].text : undefined"
            contenteditable="true"
            @blur="(e) => updateAndCommitLocalTokenTier(e, tier.name, i)"
            @focus="(e) => $emit('focus', e, event)"
            @keydown.enter.meta="playEvent(event)"
            @keydown.enter.exact.stop.prevent="viewAudioEvent(event)" />
          <span v-else class="secondary-token-tier-text" />
        </span>
      </span>
    </div>
    <div
      @focus="(e) => $emit('focus', e, event)"
      @input="updateLocalTokens"
      @blur="updateAndCommitLocalTokens"
      @keydown.enter.meta="playEvent(event)"
      @keydown.enter.exact.stop.prevent="viewAudioEvent(event)"
      @copy.prevent="copyTokens"
      @cut.prevent="cutTokens"
      @paste="pasteTokens"
      contenteditable="true"
      v-text="segmentText"
      :style="textStyle"
      class="tokens-input segment-text">
    </div>
    <div
      v-for="(tier, i) in secondaryTiers"
      :key="i"
      :style="{ height: tierHeight + 1 + 'px' }"
      class="secondary-free-text-tier">
      <span
        v-if="localTokens.length && tier.type === 'freeText'"
        v-text="getTierFreeTextText(tier.id)"
        contenteditable="true"
        class="secondary-free-text-tier-text"
        @blur="(e) => updateAndCommitLocalEventTier(e, tier.id, tier.type)"
        @focus="(e) => $emit('focus', e, event)"
        @keydown.enter.meta="playEvent(event)"
        @keydown.enter.exact.stop.prevent="viewAudioEvent(event)" />
    </div>
  </div>
</template>

<script lang="ts">

import contenteditableDirective from 'vue-contenteditable-directive'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import settings from '../store/settings'
import parseCsv from 'tiny-csv'
import { clone, isEqualDeep, requestFrameAsync, Pastable } from '../util'
import {
  LocalTranscriptEvent,
  LocalTranscriptToken,
  TierFreeText,
  TokenTierType,
  updateSpeakerEvent,
  eventStore,
  findPreviousSpeakerEvent,
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
  @Prop() nextEvent: LocalTranscriptEvent|undefined
  @Prop() previousEvent: LocalTranscriptEvent|undefined
  @Prop() speaker: number

  tierHeight = 25
  localEvent = clone(this.event)
  localTokens = this.localEvent.speakerEvents[this.speaker]
    ? this.localEvent.speakerEvents[this.speaker].tokens
    : []
  defaultTier = eventStore.metadata.defaultTier
  segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
  focused = false

  settings = settings
  playEvent = playEvent
  updateSpeakerEvent = updateSpeakerEvent

  // TODO: redundant.
  @Watch('event')
  onUpdateEvent(newEvent: LocalTranscriptEvent) {
    this.localEvent = clone(newEvent)
    this.localTokens = this.localEvent.speakerEvents[this.speaker]
      ? this.localEvent.speakerEvents[this.speaker].tokens
      : []
    this.segmentText = this.localTokens ? this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ') : ''
  }

  collectTokensViaOffsets(start: number, end: number): Array<Pastable<LocalTranscriptToken>> {
    // start and end are not necessarily from left to right
    const left = Math.min(start, end)
    const right = Math.max(start, end)
    // init cursor
    let cursor = 0
    // reduce to relevant tokens and mark partiality
    return this.localTokens.reduce((m, e, i) => {
      // get range for token
      const tokenStart = cursor
      const tokenEnd = cursor + e.tiers[this.defaultTier].text.length
      // move cursor to the end of the token and account for whitespace
      cursor = tokenEnd + 1
      // decide whether it’s in the range
      if (left <= tokenStart && right >= tokenEnd) {
        // token is fully in collection range, not partial
        return m.concat({ ...e, partial: false, index: i })
      } else if (left > tokenEnd || right < tokenStart) {
        // token is outside of collection range -> do nothing
        return m
      } else {
        // token is partly in collection range, not fully
        return m.concat([{
          ...e,
          index: i,
          tiers: {
            // leave the other tiers untouched
            ...e.tiers,
            // edit the defaultTier text, so it only contains the selected text
            [ this.defaultTier ]: {
              ...e.tiers[ this.defaultTier ],
              // must decide between left and right substring.
              text: (() => {
                if (right < tokenEnd) {
                  // only take the left part (it’s the start)
                  return e.tiers[ this.defaultTier ].text.substring(0, right - tokenStart)
                } else {
                  // only take the right part (it’s the end)
                  return e.tiers[ this.defaultTier ].text.substring(left - tokenStart)
                }
              })()
            },
          },
          partial: true
        }])
      }
    }, [] as Array<Pastable<LocalTranscriptToken>>)
  }

  tokensToCsv(tokens: Array<Pastable<LocalTranscriptToken>>): string {
    return _(tokens).reduce((m, e, i, l) => {
      if (i === 0) {
        // insert the header
        m = 'ORDER;TEXT;ORTHO;PHON;PARTIAL;INDEX\n'
      }
      // insert data
      return m
        + e.order + ';'
        + e.tiers.text.text + ';'
        + e.tiers.ortho.text + ';'
        + e.tiers.phon.text + ';'
        + e.partial + ';'
        + e.index + '\n'
    }, '')
  }

  parseCsv(csv: string): Array<{ [key: string]: string }> {
    const headers = csv.split('\n')[0].split(';')
    return _(csv.split('\n'))
      .tail()
      .filter(line => line.trim() !== '')
      .map(line => {
        const es = line.split(';')
        return headers.reduce((m, e, i, l) => {
          m[e] = es[i]
          return m
        }, {} as { [key: string]: string })
      })
      .value()
  }

  csvToTokenTiers(tokens: string): Array<Pastable<LocalTranscriptToken['tiers']>> {
    const parsedTokens = this.parseCsv(tokens)
    console.log({parsedTokens})
    return parsedTokens.map((v, k) => {
      return {
        index: Number(v.INDEX),
        partial: v.PARTIAL === 'true',
        text: {
          text: v.TEXT || '',
          type: -1
        },
        phon: {
          text: v.PHON || '',
          type: -1
        },
        ortho: {
          text: v.ORTHO || '',
          type: -1
        }
      }
    })
  }

  getOtherHalfOfToken(token: LocalTranscriptToken, tokenPart: LocalTranscriptToken): LocalTranscriptToken {
    const s = tokenPart.tiers[this.defaultTier].text
    return {
      ...token,
      tiers: {
        ...token.tiers,
        [this.defaultTier]: {
          text: token.tiers[this.defaultTier].text.replace(s, '')
        }
      }
    }
  }

  removeTokens(tokensToRemove: Array<Pastable<LocalTranscriptToken>>) {
    const tokensToRemoveById = _(tokensToRemove).keyBy('id').value()
    const newTokens =  this.localTokens.reduce((m, t, i, l) => {
      if (t.id in tokensToRemoveById) {
        // the token was partially selected
        if (tokensToRemoveById[t.id].partial === true) {
          console.log('partial token to remove', t, tokensToRemoveById[t.id])
          // push the non-selected half
          m.push(this.getOtherHalfOfToken(t, tokensToRemoveById[t.id]))
        // the token was fully selected
        } else {
          // it must be deleted entirely, so push it. do nothing.
        }
      } else {
        // it is not to be removed, so push it.
        m.push(t)
      }
      return m
    }, [] as LocalTranscriptToken[])
    this.localTokens = newTokens
  }

  insertTokensAfter(index: number, tokenTiers: Array<Pastable<LocalTranscriptToken['tiers']>>) {
    const tokens = tokenTiers.map((ttp): LocalTranscriptToken => {
      return {
        id: makeTokenId(),
        fragmentOf: -1,
        sentenceId: -1,
        order: 0,
        tiers: {
          text: ttp.text,
          ortho: ttp.ortho,
          phon: ttp.phon
        }
      }
    })
    this.localTokens.splice(index + 1, 0, ...tokens)
  }

  mergePastableTokensAt(tokenTiers: Array<Pastable<LocalTranscriptToken['tiers']>>, start: number, end: number) {
    // the target is either empty, or all of it is selected
    if (start === 0 && end === this.segmentText.length) {
      // replace all tokens
      console.log('all tokens selected, replace all', this.segmentText.length, start, end)
      this.localTokens = tokenTiers.map(({text, ortho, phon}, ti) => {
        return {
          id: makeTokenId(),
          fragmentOf: null,
          sentenceId: -1,
          order: (this.firstTokenOrder || 0) + ti,
          tiers: { text, ortho, phon }
        }
      })
    // the selection is collapsed (i.e. there’s a cursor, but no selection)
    } else if (start === end) {
      // find index at position and insert
      // TODO: wrong
      this.insertTokensAfter(start, tokenTiers)
      console.log('collapsed cursor: insert', start, end)
    } else {
      // replace the fully selected ones.
      const selectedTokens = this.collectTokensViaOffsets(start, end)
      this.removeTokens(selectedTokens)
      const insertTokensAfterIndex = selectedTokens[0].index
      this.insertTokensAfter(insertTokensAfterIndex, tokenTiers)
    }
    this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
  }

  cutTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const tokens = this.collectTokensViaOffsets(s.baseOffset, s.extentOffset)
      this.removeTokens(tokens)
      const csv = this.tokensToCsv(tokens)
      e.clipboardData.setData('text/plain', csv)
      this.segmentText = this.localTokens.map(t => t.tiers[this.defaultTier].text).join(' ')
    } else {
      // nothing is selected, copy nothing.
    }
  }

  copyTokens(e: ClipboardEvent) {
    const s = document.getSelection()
    if (s !== null) {
      const tokens = this.collectTokensViaOffsets(s.baseOffset, s.extentOffset)
      const csv = this.tokensToCsv(tokens)
      e.clipboardData.setData('text/plain', csv)
    } else {
      // nothing is selected, copy nothing.
    }
  }

  pasteTokens(e: ClipboardEvent) {
    const clipboardString = e.clipboardData.getData('text/plain')
    const s = document.getSelection()
    try {
      // TODO: check what is returned here if it’s not a csv
      const tokensTiers = this.csvToTokenTiers(clipboardString)
      if (tokensTiers.length > 0 && s !== null) {
        console.log({tokensTiers})
        e.preventDefault()
        this.mergePastableTokensAt(tokensTiers, s.baseOffset, s.extentOffset)
      }
    } catch (e) {
      // do nothing (i.e. default OS functionality)
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
    return eventStore.metadata.tiers.filter(t => t.name !== 'default' && t.show === true)
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

  viewAudioEvent(e: LocalTranscriptEvent) {
    eventStore.selectedEventIds = [ e.eventId ]
    eventStore.userState.viewingAudioEvent = e
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
      updateSpeakerEvent(this.localEvent, this.speaker, this.localTokens)
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
      return { text: t, index: i }
    })
    const oldTokens = this.localTokens.map((t, i) => ({ text: t.tiers[this.defaultTier].text, index: i }))
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

    const updatesByIndex = _.keyBy(updates, u => u.index)
    // FIXME: breaks when localTokens is shorter than the target.
    // solution: add the other ones back in before sorting.
    // both need an index.
    this.localTokens = this.localTokens.reduce((m, t, i, l) => {
      const update = updatesByIndex[i]
      if (update !== undefined) {
        // token deleted
        if (update.type === 'remove') {
          // do nothing
        // token inserted
        } else if (update.type === 'add') {
          // insert
          m.push({
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
                text: update.text,
                type: tokenTypeFromToken(update.text).id
              }
            }
          })
        } else if (update.type === 'update') {
          m.push({
            ...t,
            tiers: {
              ...t.tiers,
              [ this.defaultTier ]: {
                text: update.text,
                type: tokenTypeFromToken(update.text).id
              }
            }
          })
        }
      // no update -> keep.
      } else {
        m.push(t)
      }
      return m
    }, [] as LocalTranscriptToken[])
    // updates.forEach((u) => {
    //   // DELETE
    //   if (u.type === 'remove') {
    //     console.log('removed', u.text)
    //     this.localTokens.splice(u.index, 1)
    //   // INSERT
    //   } else if (u.type === 'add') {
    //   // UPDATE
    //   } else if (u.type === 'update') {
    //     this.localTokens[u.index].tiers[ this.defaultTier ] = {
    //       text: u.text,
    //       type: tokenTypeFromToken(u.text).id
    //     }
    //   }
    // })
    // console.log('after update, before map', this.localTokens)
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
  color #777
  .secondary-free-text-tier-text
    display inline-block
    min-width 1.6em
    margin-left -1px
    padding 0 2px
    border-radius 5px
    background #272727
    white-space nowrap
    &:empty
      background #3e3e3e
    &:focus
      outline 0
      color #fff
      background #777

.secondary-token-tier
  color #777
  .secondary-token-tier-text
    position absolute
    display block
    margin-left -1px
    padding-left 2px
    background #272727
    color #989898
    width calc(100% - 2px)
    overflow hidden
    white-space nowrap
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
  transition .25s background-color
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

.has-next-fragment
  text-align right
</style>
