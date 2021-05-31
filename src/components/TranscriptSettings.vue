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
            :tiers="tiers"
            @update:tiers="tiers = $event"
            @update:speakers="updateSpeakers"
          />
        </section>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn
          large
          class="elevation-0"
          @click="$emit('close')">
          Cancel
        </v-btn>
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
import { eventStore, LocalTranscriptTier, loadAudioFromUrl, TokenTierType, LocalTranscriptSpeakers } from '../store/transcript'
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
  serverTranscriptToLocal,
  serverTranscriptSurveyToSurvey
} from '@/service/backend-server'
import _ from 'lodash'
import { computeTokenTypesForEvents } from '@/service/token-types'
import { resourceAtUrlExists, clone } from '@/util'
import { ProjectPresetName } from '@/presets'
import settings from '../store/settings'

interface BasicInfos {
  transcriptName: string|null
  selectedSurvey: ServerSurvey|null
  projectPreset: ProjectPresetName|null
}

@Component({
  components: {
    ServerTranscriptInfoForm,
    SpeakerTierEditor
  }
})
export default class TranscriptSettings extends Vue {

  eventStore = eventStore
  isBasicInfoValid = true
  serverTranscript = serverTranscript
  serverTokenTiers = serverTokenTiers
  defaultTier: TokenTierType = 'ortho'
  tiers: LocalTranscriptTier[] = clone(eventStore.metadata.tiers)
  basicInfos: BasicInfos = {
    transcriptName: eventStore.metadata.transcriptName,
    selectedSurvey: serverTranscript?.aEinzelErhebung
      ? serverTranscriptSurveyToSurvey(serverTranscript?.aEinzelErhebung)
      : null,
    projectPreset: settings.projectPreset
  }

  async updateBasicInfos(args: BasicInfos) {
    this.basicInfos = args
    eventStore.metadata.transcriptName = args.transcriptName
    if (args.selectedSurvey !== null) {
      eventStore.metadata.speakers = _(args.selectedSurvey.FX_Informanten)
        .keyBy('pk')
        .mapValues(i => ({ k: i.Kuerzel, ka: i.Kuerzel_anonym || '', searchInSpeaker: true }))
        .value()
    }
  }

  createBasicServerTranscript(args: BasicInfos): ServerTranscript|null {
    if (args.selectedSurvey !== null && args.transcriptName !== null) {
      return {
        aNr: 0,
        nNr: 0,
        aEinzelErhebung: args.selectedSurvey === null ? undefined : surveyToServerTranscriptSurvey(args.selectedSurvey),
        aInformanten: args.selectedSurvey === null
          ? eventStore.metadata.speakers
          : surveyToServerTranscriptInformants(args.selectedSurvey),
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
    } else {
      return null
    }
  }

  async confirm() {
    if (
      this.basicInfos !== null &&
      this.isBasicInfoValid
    ) {
      this.eventStore.metadata.tiers = this.tiers
      this.eventStore.metadata.transcriptName = this.basicInfos.transcriptName
      // this.eventStore.metadata.speakers = this.speakers
      // it’s a new transcript
      if (
        this.serverTranscript?.aTranskript?.pk === undefined &&
        this.basicInfos.selectedSurvey !== null
      ) {
        const st = this.createBasicServerTranscript(this.basicInfos)
        if (st !== null) {
          mergeServerTranscript(st)
          eventStore.metadata = getMetadataFromServerTranscript(st)
          const events = serverTranscriptToLocal(st, eventStore.metadata.defaultTier)
          eventStore.events = computeTokenTypesForEvents(
            events,
            eventStore.metadata.defaultTier || 'text',
            _(eventStore.metadata.speakers).map((s, k) => k).value()
          )
          const audioFileUrl = getAudioUrlFromServerNames(
            this.basicInfos.selectedSurvey.Audiofile,
            this.basicInfos.selectedSurvey.Dateipfad
          )
          if (audioFileUrl !== null && (await resourceAtUrlExists(audioFileUrl))) {
            await loadAudioFromUrl(audioFileUrl)
          }
        }
      }
      eventStore.userState.showSpeakerTierEditModal = false
    }
  }

  updateSpeakers(ss: LocalTranscriptSpeakers) {
    this.eventStore.metadata.speakers = ss
  }

}
</script>
<style lang="stylus" scoped>
</style>
