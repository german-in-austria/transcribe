<template>
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
          @click="undoOrRedoUntil(item)">
          <v-list-tile-avatar>
            <v-icon v-if="item.type === 'RESIZE'">swap_horiz</v-icon>
            <v-icon v-if="item.type === 'DELETE'">delete_forever</v-icon>
            <v-icon v-if="item.type === 'ADD'">add_circle_outline</v-icon>
            <v-icon v-if="item.type === 'CHANGE_TOKENS'">edit</v-icon>
            <v-icon v-if="item.type === 'JOIN'">merge_type</v-icon>
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
            <v-list-tile-title class="sidebar-title">join segments</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">
              {{ item.before.length }} segments
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="item.type === 'DELETE'">
            <v-list-tile-title class="sidebar-title">delete segment</v-list-tile-title>
            <v-list-tile-sub-title class="subtitle">
              <div class="inner" :key="i" v-for="(se, i) in item.before[0].speakerEvents">
                {{ i }}: {{ se.tokens.map(t => t.tiers[defaultTier].text).join(' ') }}
              </div>
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-content v-else-if="item.type === 'ADD'">
            <v-list-tile-title class="sidebar-title">add segment</v-list-tile-title>
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

  showEventIfExists(e: LocalTranscriptEvent) {
    const i = findEventById(e.eventId)
    if (i > -1) {
      selectEvent(e)
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }

  get canUndo(): boolean {
    // there is an applied undoable action.
    return history.actions.find(a => a.apply === true) !== undefined
  }

  undoOrRedoUntil(action: HistoryEventAction) {
    if (action.after[0]) {
      selectEvent(action.after[0])
      scrollToAudioEvent(action.after[0])
      scrollToTranscriptEvent(action.after[0])
    }
    jumpToState(action)
  }

}
</script>
<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';

.undone
  opacity .5

.scroller
  height calc(100% - 40px)
</style>
