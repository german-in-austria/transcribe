<template>
  <div>
    <v-list subheader dense>
      <v-subheader class="px-0">Tiers</v-subheader>
      <v-list-tile :key="tier.id" v-for="tier in eventTiers">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ tier.name }} {{ tier.id }}
          </v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
      <v-text-field solo placeholder="Add a new tier…" />
    </v-list>
    <v-list dense>
      <v-subheader class="px-0">Speakers</v-subheader>
      <v-list-tile :key="speaker.k" v-for="speaker in speakers">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ speaker.ka }}
          </v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <v-btn icon small><v-icon>close</v-icon></v-btn>
        </v-list-tile-action>
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
