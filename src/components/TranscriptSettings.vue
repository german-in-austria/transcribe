<template>
  <v-dialog
    lazy
    :transition="false"
    scrollable
    max-width="700px"
    v-model="eventStore.userState.showSpeakerTierEditModal">
    <v-card>
      <v-card-title>
        <v-spacer />Transcript Infos<v-spacer />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <server-transcript-info-form
          class="px-4"
          v-model="isBasicInfoValid"
          :transcripts="[]"
          :name="eventStore.metadata.transcriptName"
          :survey="serverTranscript !== null ? serverTranscript.aEinzelErhebung : null"
          @update="updateBasicInfos"
        />
        <speaker-tier-editor
          class="px-4"
          :speakers="eventStore.metadata.speakers"
          :tiers="eventStore.metadata.tiers"
          @update:tiers="updateTiers"
          @update:speakers="updateSpeakers"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn
          :disabled="!isBasicInfoValid"
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
import { eventStore, LocalTranscriptTier, LocalTranscriptSpeakers } from '../store/transcript'
import ServerTranscriptInfoForm from './ServerTranscriptInfoForm.vue'
import SpeakerTierEditor from './SpeakerTierEditor.vue'
import { ServerSurvey, getAudioUrlFromServerNames, serverTranscript } from '@/service/backend-server'
import _ from 'lodash'
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

  mounted() {
    
  }

  async updateBasicInfos(args: { transcriptName: string, selectedSurvey: ServerSurvey, preset: string}) {
    eventStore.metadata.transcriptName = args.transcriptName
    eventStore.metadata.speakers = _(args.selectedSurvey.FX_Informanten)
      .keyBy('pk')
      .mapValues(i => ({ k: i.Kuerzel, ka: i.Kuerzel_anonym!, searchInSpeaker: true }))
      .value()
    console.log(eventStore.metadata.speakers)
    const audioFileUrl = getAudioUrlFromServerNames(args.selectedSurvey.Audiofile, args.selectedSurvey.Dateipfad)
    if (audioFileUrl !== null && await resourceAtUrlExists(audioFileUrl)) {
      console.log(audioFileUrl)
      // this.audioFileName = survey.Audiofile + '.ogg'
      // this.audioFileUrl = audioFileUrl
    } else {
      // not found.
    }
  }

  updateTiers(ts: LocalTranscriptTier[]) {
    console.log(ts)
  }

  updateSpeakers(ss: LocalTranscriptSpeakers) {
    console.log(ss)
  }
}
</script>
<style lang="stylus" scoped>
</style>
