<template>
  <v-form
    ref="basicInfoForm"
    v-model="isBasicInfoValid">
    <v-select
      label="Project Preset"
      @input="emitUpdateIfValid"
      v-model="settings.projectPreset"
      :items="projectPresetNames">
    </v-select>
    <v-autocomplete
      v-if="settings.backEndUrl !== null"
      :disabled="surveys === null"
      :filter="surveyFilter"
      :item-disabled="(i) => i.id_transcript !== null"
      :items="surveys || []"
      :loading="surveys === null"
      :rules="[ selectedSurvey === null && 'Select a Survey' ]"
      @input="onUpdateSurvey"
      item-text="Audiofile"
      item-value="pk"
      label="Survey"
      return-object
      two-line
      v-model="selectedSurvey">
      <template slot="item" slot-scope="item">
        <v-list-tile-content>
          <v-list-tile-title>
            {{ item.item.Audiofile }} ({{ item.item.pk }}) {{ item.item.id_transcript !== null ? '— Transcript available' : '' }}
          </v-list-tile-title>
          <v-list-tile-sub-title>
            {{ item.item.OrtString }};
            {{ item.item.FX_Informanten.map(i => `${i.Kuerzel}${ i.Vorname ? ' (' + i.Vorname + ' ' + i.Name + ')' : ''}`).join(', ') }}
          </v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action-text class="pl-5">
          {{ item.item.Datum }}
        </v-list-tile-action-text>
      </template>
    </v-autocomplete>
    <v-text-field
      v-model="transcriptName"
      @input="emitUpdateIfValid"
      label="Transcript Name"
      :rules="[
        (transcriptName === null || transcriptName.trim() === '') && 'Please enter a name for the transcript',
        !isTranscriptNameUnique(transcriptName) && 'Name already exists.'
      ]" />
  </v-form>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import presets from '../presets'
import settings from '../store/settings.store'
import { ServerTranscriptListItem, ServerSurvey, getSurveys } from '../service/backend-server.service'
import _ from 'lodash'
import { clone } from '../util'

@Component
export default class ServerTranscriptInfoForm extends Vue {

  // the validity of the data. for use with v-model
  @Prop({ default: false }) value!: boolean
  @Prop({ default: [] }) transcripts!: ServerTranscriptListItem[]
  @Prop({ default: null }) name!: string|null
  @Prop({ default: null }) survey!: ServerSurvey|null

  transcriptName = this.name
  isBasicInfoValid = false
  presets = presets
  settings = settings
  surveys: ServerSurvey[]|null = null
  selectedSurvey = clone(this.survey)

  async onUpdateSurvey() {
    await this.$nextTick()
    if (this.selectedSurvey !== null && (this.transcriptName === null || this.transcriptName === '')) {
      this.transcriptName = this.selectedSurvey.Audiofile.replace('.ogg', '')
      await this.$nextTick()
    }
    this.emitUpdateIfValid()
  }

  async emitUpdateIfValid() {
    if (this.isBasicInfoValid) {
      this.$emit('update', {
        transcriptName: this.transcriptName,
        selectedSurvey: this.selectedSurvey,
        projectPreset: this.settings.projectPreset
      })
      this.$emit('input', true)
    } else {
      this.$emit('input', false)
    }
  }

  surveyFilter(item: ServerSurvey, queryText: string): boolean {
    const l = queryText.toLocaleLowerCase()
    return (
      (item.OrtString !== 'None' && item.OrtString.toLocaleLowerCase().includes(l)) ||
      item.Audiofile.toLocaleLowerCase().includes(l) ||
      item.Datum.includes(l)
    )
  }

  async mounted() {
    if (this.settings.backEndUrl !== null) {
      this.surveys = await getSurveys(this.settings.backEndUrl)
    } else {
      this.surveys = []
    }
  }

  get projectPresetNames(): string[] {
    return _.map(this.presets, (p, name) => name)
  }

  isTranscriptNameUnique(n: string|null): boolean {
    return this.transcripts.find(t => t.n === n) === undefined
  }
}
</script>
<style lang="stylus" scoped>
</style>
