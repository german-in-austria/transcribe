<template>
  <v-list style="background: transparent" dense>
    <RecycleScroller
      class="scroller"
      :items="tierEventsWithId"
      :item-size="40">
      <template v-slot="{ item }">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>{{ item ? item.text : '' }}</v-list-tile-title>
          </v-list-tile-content>
          <v-list-tile-action-text>
            {{ toTime(item.startTime) }}
          </v-list-tile-action-text>
        </v-list-tile>
        <v-divider />
      </template>
    </RecycleScroller>
  </v-list>
</template>
<script lang="ts">

import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { SpeakerTierImportable } from '../service/backend-exmaralda'
import { RecycleScroller } from 'vue-virtual-scroller'
import { toTime } from '../store/transcript'
import _ from 'lodash'

@Component({
  components: {
    RecycleScroller
  }
})
export default class ExmaraldaTierPreview extends Vue {
  @Prop({ required: true }) tier!: SpeakerTierImportable
  toTime = toTime
  get tierEventsWithId() {
    return this.tier.events.map(te => {
      return {...te, id: _.uniqueId()}
    })
  }
}
</script>
<style lang="stylus" scoped>
@import '../../node_modules/vue-virtual-scroller/dist/vue-virtual-scroller.css';
.scroller
  height 300px
</style>
