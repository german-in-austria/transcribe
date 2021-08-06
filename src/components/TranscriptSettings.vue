<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    persistent
    max-width="700px"
    v-model="transcript.uiState.showTranscriptMetaSettings">
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
            :name="transcript.meta.transcriptName"
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
          <v-subheader class="pa-0">Event Tiers ({{ transcript.meta.tiers.length }})</v-subheader>
          <speaker-tier-editor
            :speakers="transcript.meta.speakers"
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
import { Vue, Component } from 'vue-property-decorator'
import { LocalTranscriptTier, TokenTierType, LocalTranscriptSpeakers } from '../store/transcript'
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
import { computeTokenTypesForEvents } from '@/service/token-types.service'
import { resourceAtUrlExists, clone } from '@/util'
import { ProjectPresetName } from '@/presets'
import store from '@/store/'
import TranscriptAudio from '@/service/transcript-audio.class'

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

  transcript = store.transcript!
  isBasicInfoValid = true
  serverTranscript = serverTranscript
  serverTokenTiers = serverTokenTiers
  defaultTier: TokenTierType = 'ortho'
  tiers: LocalTranscriptTier[] = clone(this.transcript.meta.tiers)
  basicInfos: BasicInfos = {
    transcriptName: this.transcript.meta.transcriptName,
    selectedSurvey: serverTranscript?.aEinzelErhebung
      ? serverTranscriptSurveyToSurvey(serverTranscript?.aEinzelErhebung)
      : null,
    projectPreset: store.settings.projectPreset
  }

  async updateBasicInfos(args: BasicInfos) {
    this.basicInfos = args
    this.transcript.meta.transcriptName = args.transcriptName
    if (args.selectedSurvey !== null) {
      this.transcript.meta.speakers = _(args.selectedSurvey.FX_Informanten)
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
          ? this.transcript.meta.speakers
          : surveyToServerTranscriptInformants(args.selectedSurvey),
        aTiers: this.transcript.meta.tiers.reduce((m, e) => {
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
      this.transcript.meta.tiers = this.tiers
      this.transcript.meta.transcriptName = this.basicInfos.transcriptName
      // it’s a new transcript
      if (
        this.serverTranscript?.aTranskript?.pk === undefined &&
        this.basicInfos.selectedSurvey !== null
      ) {
        const st = this.createBasicServerTranscript(this.basicInfos)
        if (st !== null) {
          mergeServerTranscript(st)
          this.transcript.meta = { ...getMetadataFromServerTranscript(st), lockedTokens: this.transcript.meta.lockedTokens }
          const events = serverTranscriptToLocal(st, this.transcript.meta.defaultTier)
          this.transcript.events = computeTokenTypesForEvents(
            events,
            this.transcript.meta.defaultTier || 'text',
            Object.keys(this.transcript.meta.speakers)
          )
          const audioFileUrl = getAudioUrlFromServerNames(
            this.basicInfos.selectedSurvey.Audiofile,
            this.basicInfos.selectedSurvey.Dateipfad
          )
          if (audioFileUrl !== null && (await resourceAtUrlExists(audioFileUrl))) {
            this.transcript.audio = new TranscriptAudio(audioFileUrl)
          }
        }
      }
      this.transcript.uiState.showTranscriptMetaSettings = false
    }
  }

  updateSpeakers(ss: LocalTranscriptSpeakers) {
    this.transcript.meta.speakers = ss
  }
}

</script>
<style lang="stylus" scoped>
</style>
