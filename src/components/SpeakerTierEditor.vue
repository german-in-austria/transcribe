<template>
  <div>
    <v-autocomplete
      :disabled="surveys === null"
      :loading="surveys === null"
      :rules="[ selectedSurvey === null && 'Select a Survey' ]"
      label="Survey"
      :value="selectedSurvey"
      @change="selectedSurvey = $event"
      item-value="pk"
      item-text="Audiofile"
      return-object
      two-line
      :items="surveys || []">
      <template slot="item" slot-scope="item">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ item.item.Audiofile }} ({{ item.item.pk }})
          </v-list-tile-title>
          <v-list-tile-sub-title>
            {{ item.item.FX_Informanten.map(i => `${i.Kuerzel}${ i.Vorname ? ' (' + i.Vorname + ' ' + i.Name + ')' : ''}`).join(', ') }}
          </v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action-text class="pl-5">
          {{ item.item.Datum }}
        </v-list-tile-action-text>
      </template>
    </v-autocomplete>
    <v-list dense navigation>
      <v-subheader>Tiers</v-subheader>
      <v-list-tile :key="tier.id" v-for="tier in eventTiers">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ tier.name }} {{ tier.id }}
          </v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { LocalTranscriptTier, LocalTranscriptSpeakers } from '../store/transcript'
import { ServerSurvey, getSurveys, serverTranscript } from '../service/backend-server'

@Component
export default class SpeakerTierEditor extends Vue {

  @Prop({ default: {} }) speakers!: LocalTranscriptSpeakers
  @Prop({ default: [] }) tiers!: LocalTranscriptTier[]

  surveys: ServerSurvey[]|null = null

  get selectedSurvey() {
    if (serverTranscript !== null) {
      return serverTranscript.aEinzelErhebung
    } else {
      return undefined
    }
  }

  set selectedSurvey(o: any) {
    if (serverTranscript !== null && serverTranscript.aEinzelErhebung !== undefined) {
      serverTranscript.aEinzelErhebung = o
    }
  }

  async mounted() {
    this.surveys = await getSurveys()
  }

  get eventTiers(): LocalTranscriptTier[] {
    return this.tiers.filter(t => t.type === 'freeText')
  }
}
</script>
<style lang="scss" scoped>
</style>
