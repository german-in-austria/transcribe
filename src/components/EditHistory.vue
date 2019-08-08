<template>
  <div>
    <v-list v-if="history.actions.length > 0" dense>
      <v-list-tile @click="goToInitialState">
        <v-list-tile-avatar><small>(1)</small></v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title class="sidebar-title">Open Document</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
      <RecycleScroller
        class="scroller"
        :items="history.actions"
        :item-size="40">
        <template v-slot="{ item }">
          <v-list-tile
            :class="item.apply === false && 'undone'"
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
              <!-- <v-btn icon @click="" class="undo-btn">
                <v-icon>undo</v-icon>
              </v-btn> -->
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
      <v-card v-if="hoveredEvent !== null" class="pa-0 action-preview-container">
        <div style="background: rgba(0,0,0,.1)">
          <segment-transcript
            v-for="eventBefore in hoveredEvent.before"
            :key="'before-' + eventBefore.eventId"
            :event="eventBefore"
          />
        </div>
        <div class="text-xs-center">
          <v-icon>arrow_downward</v-icon>
        </div>
        <div>
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

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import SegmentTranscript from './SegmentTranscript.vue'
import { RecycleScroller } from 'vue-virtual-scroller'

import {
  toTime,
  scrollToAudioEvent,
  scrollToTranscriptEvent,
  findEventById,
  LocalTranscriptEvent,
  selectEvent,
  playEvent,
  eventStore
} from '../store/transcript'

import {
  history,
  undo,
  jumpToState,
  goToInitialState,
  HistoryEventAction
} from '../store/history'

@Component({
  components: {
    SegmentTranscript,
    RecycleScroller
  }
})
export default class EditHistory extends Vue {

  defaultTier = eventStore.metadata.defaultTier
  history = history
  toTime = toTime
  playEvent = playEvent
  undo = undo
  goToInitialState = goToInitialState
  hoveredEvent: HistoryEventAction|null = null
  menuX = 0
  menuY = 0

  showEventIfExists(e: LocalTranscriptEvent) {
    const i = findEventById(e.eventId)
    if (i > -1) {
      selectEvent(e)
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }

  undoOrRedoUntil(action: HistoryEventAction) {
    if (action.after[0]) {
      selectEvent(action.after[0])
      scrollToAudioEvent(action.after[0])
      scrollToTranscriptEvent(action.after[0])
    }
    jumpToState(action)
  }

  handleEventMouseOver(ev: MouseEvent, e: HistoryEventAction) {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect()
    this.menuX = rect.left
    this.menuY = rect.top
    this.hoveredEvent = e
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
  height calc(100% - 40px)

.action-preview-container
  max-width 400px
  overflow hidden
  div
    white-space nowrap
</style>
