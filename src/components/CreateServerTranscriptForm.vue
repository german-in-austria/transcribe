<template>
  <v-form
    ref="basicInfoForm"
    class="pb-5"
    v-model="isBasicInfoValid">
    <v-select
      label="Project Preset"
      @input="emitUpdateIfValid"
      v-model="settings.projectPreset"
      :items="projectPresetNames">
    </v-select>
    <v-text-field
      v-model="transcriptName"
      @input="emitUpdateIfValid"
      label="Transcript Name"
      :rules="[
        (transcriptName === null || transcriptName.trim() === '') && 'Please enter a name for the transcript',
        !isTranscriptNameUnique(transcriptName) && 'Name already exists.'
      ]" />
    <v-autocomplete
      :disabled="surveys === null"
      :loading="surveys === null"
      :rules="[ selectedSurvey === null && 'Select a Survey' ]"
      label="Survey"
      v-model="selectedSurvey"
      @input="emitUpdateIfValid"
      two-line
      item-text="Audiofile"
      return-object
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
  </v-form>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import presets from '../presets'
import settings from '../store/settings'
import { ServerTranscriptListItem, ServerSurvey, getSurveys } from '../service/backend-server'
import _ from 'lodash'
import { clone } from '../util'

@Component
export default class CreateServerTranscriptForm extends Vue {

  @Prop({ default: false }) value!: boolean
  // TODO: maybe fetch here
  @Prop({ default: [] }) transcripts!: ServerTranscriptListItem[]
  @Prop({ default: null }) name!: string|null
  @Prop({ default: null }) survey!: ServerSurvey|null

  transcriptName = this.name
  isBasicInfoValid = false
  presets = presets
  settings = settings
  surveys: ServerSurvey[]|null = null
  selectedSurvey = clone(this.survey)

  async emitUpdateIfValid() {
    await this.$nextTick()
    if (this.isBasicInfoValid) {
      this.$emit('update', {
        transcriptName: this.transcriptName,
        selectedSurvey: this.selectedSurvey,
        preset: this.settings.projectPreset
      })
      this.$emit('input', true)
    } else {
      this.$emit('input', false)
    }
  }

  async mounted() {
    this.surveys = await getSurveys()
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
