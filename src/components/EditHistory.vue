<template>
  <div style="height: 100%">
    <v-list v-if="history.actions.length > 0" dense>
      <v-subheader>
        <small>History</small>
      </v-subheader>
      <v-list-tile @click="goToInitialState">
        <v-list-tile-avatar><small>(1)</small></v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title class="sidebar-title">Open Document</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
      <RecycleScroller
        class="scroller"
        :items="groupedHistoryActions"
        :item-size="40">
        <template v-slot="{ item }">
          <v-list-tile
            :class="[item.apply === false && 'undone', 'history-list-item']"
            @dblclick="playEvent(item.before[0])"
            @mouseover="(ev) => handleEventMouseOver(ev, item)"
            @mouseout="handleEventMouseOut"
            @click="undoOrRedoUntil(item)">
            <v-list-tile-avatar>
              <v-icon v-if="item.type === 'RESIZE'">swap_horiz</v-icon>
              <v-icon v-if="item.type === 'DELETE'">delete_forever</v-icon>
              <v-icon v-if="item.type === 'ADD'">add_circle_outline</v-icon>
              <v-icon v-if="item.type === 'CHANGE_TOKENS'">edit</v-icon>
              <v-icon v-if="item.type === 'JOIN'">merge_type</v-icon>
              <v-icon v-if="item.type === 'SPLIT'">call_split</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content v-if="item.type === 'RESIZE'">
              <v-list-tile-title class="sidebar-title">resize segment</v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                <div class="inner" :key="i" v-for="(se, i) in item.before[0].speakerEvents">
                  {{ i }}: {{ se.tokens.map(t => t.tiers[defaultTier].text).join(' ') }}
                </div>
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-content v-if="item.type === 'JOIN'">
              <v-list-tile-title class="sidebar-title">
                join {{ item.before.length }} segments
              </v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                at {{ toTime(item.after[0].startTime) }} to {{ toTime(item.after[0].endTime) }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-content v-else-if="item.type === 'DELETE'">
              <v-list-tile-title v-if="item.before.length === 1" class="sidebar-title">
                delete segment
              </v-list-tile-title>
              <v-list-tile-title v-else>
                delete {{ item.before.length }} segments
              </v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                at {{ toTime(item.before[0].startTime) }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-content v-else-if="item.type === 'ADD'">
              <v-list-tile-title class="sidebar-title">add segment</v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                {{ toTime(item.after[0].startTime) }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-content v-else-if="item.type === 'SPLIT'">
              <v-list-tile-title class="sidebar-title">split segment</v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                {{ toTime(item.after[0].startTime) }}
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-content v-else-if="item.type === 'CHANGE_TOKENS'">
              <v-list-tile-title class="sidebar-title">update transcript</v-list-tile-title>
              <v-list-tile-sub-title class="subtitle">
                <div class="inner" :key="i" v-for="(se, i) in item.after[0].speakerEvents">
                  {{ i }}: {{ se.tokens.map(t => t.tiers[defaultTier].text).join(' ') }}
                </div>
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </RecycleScroller>
    </v-list>
    <v-menu
      absolute
      lazy
      left
      nudge-top="5"
      :position-x="menuX"
      :position-y="menuY"
      :value="hoveredEvent !== null">
      <v-card v-if="hoveredEvent !== null" class="pa-0 action-preview-container context-menu">
        <div class="pt-2 pb-2" style="background: rgba(0,0,0,.2)">
          <segment-transcript
            v-for="eventBefore in hoveredEvent.before"
            :key="'before-' + eventBefore.eventId"
            :event="eventBefore"
          />
        </div>
        <div class="text-xs-center">
          <v-icon>arrow_downward</v-icon>
        </div>
        <div class="pt-2 pb-2">
          <segment-transcript
            v-for="eventAfter in hoveredEvent.after"
            :key="'after-' + eventAfter.eventId"
            :event="eventAfter"
          />
        </div>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">

import { Vue, Component } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import { groupConsecutiveBy, timeFromSeconds } from '../util'
import { RecycleScroller } from 'vue-virtual-scroller'
import _ from 'lodash'

import {
  LocalTranscriptEvent,
  playEvent
} from '../store/transcript'

import {
  history,
  jumpToState,
  goToInitialState,
  HistoryEventAction
} from '../store/history'
import store from '@/store'
import EventService from '@/service/event-service'

@Component({
  components: {
    SegmentTranscript,
    RecycleScroller
  }
})
export default class EditHistory extends Vue {

  history = history
  toTime = timeFromSeconds
  playEvent = playEvent
  goToInitialState = goToInitialState
  hoveredEvent: HistoryEventAction|null = null
  menuX = 0
  menuY = 0

  get defaultTier() {
    return store.transcript?.meta.defaultTier || 'text'
  }

  get groupedHistoryActions(): HistoryEventAction[] {
    // group consecutive historyEventActions by type and all "before" eventIds
    const groups = groupConsecutiveBy(history.actions, (ha: HistoryEventAction) => {
      return ha.type + '__' + EventService.sortEvents(ha.before).map(e => e.eventId).join('__')
    }) as HistoryEventAction[][]
    // use the first historyEventAction for the "before" state, and the last for the "after" state.
    return _(groups)
      .map(group => ({...group[0], after: group.length > 0 ? group[group.length - 1].after : []}))
      .flatten()
      .value()
  }

  showEventIfExists(e: LocalTranscriptEvent) {
    if (store.transcript !== null) {
      const i = store.transcript.findEventIndexById(e.eventId)
      if (i > -1) {
        store.transcript.selectEvent(e)
        store.transcript.scrollToAudioEvent(e)
        store.transcript.scrollToTranscriptEvent(e)
      }
    }
  }

  undoOrRedoUntil(action: HistoryEventAction) {
    if (action.after[0] && store.transcript !== null) {
      store.transcript.selectEvent(action.after[0])
      store.transcript.scrollToAudioEvent(action.after[0])
      store.transcript.scrollToTranscriptEvent(action.after[0])
    }
    jumpToState(action, true)
  }

  handleEventMouseOver(ev: MouseEvent, e: HistoryEventAction) {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    this.menuX = rect.left
    this.menuY = rect.top
    // no more than three events in preview.
    // (in case somebody edit’s thousands of events at once)
    this.hoveredEvent = {
      ...e,
      before: e.before.slice(0, 3),
      after: e.after.slice(0, 3)
    }
  }

  handleEventMouseOut() {
    this.hoveredEvent = null
  }

}
</script>
<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.undone
  opacity .5

.scroller
  height calc(100% - 80px)

.action-preview-container
  max-width 400px
  overflow hidden
  div
    white-space nowrap
</style>
