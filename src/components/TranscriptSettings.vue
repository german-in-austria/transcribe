<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    persistent
    max-width="700px"
    v-model="eventStore.userState.showSpeakerTierEditModal">
    <v-card>
      <v-card-title>
        <v-spacer />Transcript Infos<v-spacer />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <section class="px-4 py-0">
          <v-subheader class="pa-0">Basic Metadata (required)</v-subheader>
          <server-transcript-info-form
            v-model="isBasicInfoValid"
            :transcripts="[]"
            :name="eventStore.metadata.transcriptName"
            :survey="serverTranscript !== null ? serverTranscript.aEinzelErhebung : null"
            @update="updateBasicInfos"
          />
          <v-select
            label="Default Tier"
            v-model="defaultTier"
            :items="serverTokenTiers">
            <template slot="item" slot-scope="item">
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ item.item.text }}
                </v-list-tile-title>
              </v-list-tile-content>
              <v-list-tile-action-text class="pl-5">
                {{ item.item.description }}
              </v-list-tile-action-text>
            </template>
          </v-select>
        </section>
        <v-divider class="mx-2" />
        <section class="px-4 py-0">
          <v-subheader class="pa-0">Event Tiers ({{ eventStore.metadata.tiers.length }})</v-subheader>
          <speaker-tier-editor
            :speakers="eventStore.metadata.speakers"
            :tiers="eventStore.metadata.tiers"
            @update:tiers="updateTiers"
            @update:speakers="updateSpeakers"
          />
        </section>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn
          :disabled="!isBasicInfoValid"
          @click="confirm"
          large
          color="primary"
          class="elevation-0">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { eventStore, LocalTranscriptTier, loadAudioFromUrl, TokenTierType } from '../store/transcript'
import ServerTranscriptInfoForm from './ServerTranscriptInfoForm.vue'
import SpeakerTierEditor from './SpeakerTierEditor.vue'
import {
  ServerSurvey,
  getAudioUrlFromServerNames,
  serverTranscript,
  ServerTranscript,
  surveyToServerTranscriptSurvey,
  surveyToServerTranscriptInformants,
  serverTokenTiers,
  mergeServerTranscript,
  getMetadataFromServerTranscript,
  serverTranscriptToLocal
} from '@/service/backend-server'
import _ from 'lodash'
import { computeTokenTypesForEvents } from '@/service/token-types'
import { resourceAtUrlExists } from '@/util'

@Component({
  components: {
    ServerTranscriptInfoForm,
    SpeakerTierEditor
  }
})
export default class TranscriptSettings extends Vue {

  eventStore = eventStore
  isBasicInfoValid = false
  serverTranscript = serverTranscript
  eventTiers = []
  serverTokenTiers = serverTokenTiers
  basicInfos: any = {}
  defaultTier: TokenTierType = 'ortho'

  async updateBasicInfos(args: { transcriptName: string, selectedSurvey: ServerSurvey, preset: string}) {
    this.basicInfos = args
    eventStore.metadata.transcriptName = args.transcriptName
    eventStore.metadata.speakers = _(args.selectedSurvey.FX_Informanten)
      .keyBy('pk')
      .mapValues(i => ({ k: i.Kuerzel, ka: i.Kuerzel_anonym || '', searchInSpeaker: true }))
      .value()
  }

  createBasicServerTranscript(args: { transcriptName: string, selectedSurvey: ServerSurvey, preset: string}): ServerTranscript {
    return {
      aNr: 0,
      nNr: 0,
      aEinzelErhebung: surveyToServerTranscriptSurvey(args.selectedSurvey),
      aInformanten: surveyToServerTranscriptInformants(args.selectedSurvey),
      aTiers: eventStore.metadata.tiers.reduce((m, e) => {
        m[e.id] = { tier_name: e.name }
        return m
      }, {} as ServerTranscript['aTiers']),
      aTokens: {},
      aEvents: [],
      aTranskript: {
        default_tier: this.defaultTier,
        n: args.transcriptName,
        pk: -1,
        ut: 'now'
      }
    }
  }

  async confirm() {
    if (this.isBasicInfoValid) {
      const st = this.createBasicServerTranscript(this.basicInfos)
      mergeServerTranscript(st)
      eventStore.metadata = getMetadataFromServerTranscript(st)
      const events = serverTranscriptToLocal(st, eventStore.metadata.defaultTier)
      eventStore.events = computeTokenTypesForEvents(
        events,
        eventStore.metadata.defaultTier || 'text',
        _(eventStore.metadata.speakers).map((s, k) => k).value()
      )
      const audioFileUrl = getAudioUrlFromServerNames(this.basicInfos.selectedSurvey.Audiofile, this.basicInfos.selectedSurvey.Dateipfad)
      if (audioFileUrl !== null && (await resourceAtUrlExists(audioFileUrl))) {
        await loadAudioFromUrl(audioFileUrl)
      }
      eventStore.userState.showSpeakerTierEditModal = false
    }
  }

  updateSpeakers() {
    console.log('')
  }

  updateTiers(ts: LocalTranscriptTier[]) {
    this.eventStore.metadata.tiers = ts
  }
}
</script>
<style lang="stylus" scoped>
</style>
