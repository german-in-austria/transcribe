<template>
   <v-list v-if="history.length > 0" dense>
    <v-list-tile
      :key="i"
      v-for="(action, i) in history"
      @click="showEventIfExists(action.events[0])">
      <v-list-tile-avatar>
        <v-icon v-if="action.type === 'RESIZE'">swap_horiz</v-icon>
        <v-icon v-if="action.type === 'DELETE'">delete_forever</v-icon>
        <v-icon v-if="action.type === 'ADD'">add_circle_outline</v-icon>
        <v-icon v-if="action.type === 'CHANGE_TOKENS'">edit</v-icon>
        <v-icon v-if="action.type === 'JOIN'">merge_type</v-icon>
      </v-list-tile-avatar>
      <v-list-tile-content v-if="action.type === 'RESIZE'">
        <v-list-tile-title class="sidebar-title">resize segment</v-list-tile-title>
        <v-list-tile-sub-title class="subtitle">
          <div class="inner" :key="i" v-for="(se, i) in action.events[0].speakerEvents">
            {{ i }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
          </div>
        </v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-content v-if="action.type === 'JOIN'">
        <v-list-tile-title class="sidebar-title">join segments</v-list-tile-title>
        <v-list-tile-sub-title class="subtitle">
          {{ action.events.length }} segments
        </v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-content v-else-if="action.type === 'DELETE'">
        <v-list-tile-title class="sidebar-title">delete segment</v-list-tile-title>
        <v-list-tile-sub-title class="subtitle">
          <div class="inner" :key="i" v-for="(se, i) in action.events[0].speakerEvents">
            {{ i }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
          </div>
        </v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-content v-else-if="action.type === 'ADD'">
        <v-list-tile-title class="sidebar-title">add segment</v-list-tile-title>
        <v-list-tile-sub-title class="subtitle">
          {{ toTime(action.events[0].startTime) }}
        </v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-content v-else-if="action.type === 'CHANGE_TOKENS'">
        <v-list-tile-title class="sidebar-title">update transcript</v-list-tile-title>
        <v-list-tile-sub-title class="subtitle">
          <div class="inner" :key="i" v-for="(se, i) in action.events[0].speakerEvents">
            {{ i }}: {{ se.tokens.map(t => t.tiers.default.text).join(' ') }}
          </div>
        </v-list-tile-sub-title>
      </v-list-tile-content>
      <v-list-tile-action>
        <v-btn icon @click="" class="undo-btn">
          <v-icon>undo</v-icon>
        </v-btn>
      </v-list-tile-action>
    </v-list-tile>
  </v-list>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
// tslint:disable-next-line:max-line-length
import { history, toTime, scrollToAudioEvent, scrollToTranscriptEvent, findSegmentById, LocalTranscriptEvent } from '@store/transcript'
@Component
export default class EditHistory extends Vue {
  history = history
  toTime = toTime
  showEventIfExists(e: LocalTranscriptEvent) {
    const i = findSegmentById(e.eventId)
    if (i > -1) {
      scrollToAudioEvent(e)
      scrollToTranscriptEvent(e)
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
