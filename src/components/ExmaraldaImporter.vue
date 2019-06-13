<template>
  <div>
    <div class="snackbars">
      <v-snackbar
        bottom
        left
        color="error"
        :timeout="6000"
        v-for="(speakerTier, i) in speakersWithMissingDefaultTier"
        :key="i"
        v-model="showMissingDefaultTierError">
        Default Tier missing for speaker {{ speakerTier.to_speaker.Kuerzel }}
      </v-snackbar>
    </div>
    <v-dialog
      scrollable
      lazy
      :transition="false"
      @input="$event === false && $emit('close')"
      :value="true"
      content-class="dialog"
      max-width="1200">
      <v-card>
        <v-card-title class="display-block text-xs-center grey--text">
          <v-spacer />Import Exmaralda File<v-spacer />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-window v-model="step">
            <v-window-item :value="1">
              <div class="explainer">
                <h1>Select a Survey <br>and name your Transcript</h1>
                <p>
                  Find your Survey based on its date and participants.
                </p>
              </div>
              <v-layout>
                <v-flex xs6 offset-xs3>
                  <v-form
                    ref="basicInfoForm"
                    class="pb-5"
                    v-model="basicInfoValid">
                    <v-autocomplete
                      :loading="surveys === null"
                      :rules="[ selectedSurvey === null && 'Select a Survey' ]"
                      label="Survey"
                      :value="selectedSurvey"
                      @change="selectSurvey"
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
                    <v-text-field 
                      v-model="transcriptName"
                      label="Transcript Name"
                      validate-on-blur
                      :rules="[ (transcriptName === null || transcriptName.trim() === '') && 'Please enter a name for the transcript' ]" />
                  </v-form>
                </v-flex>
              </v-layout>
            </v-window-item>
            <v-window-item :value="2">
              <div class="explainer">
                <h1>Assign Tiers and Speakers</h1>
                <p>
                  Choose which tiers you want to import from your Exmaralda File on the left,
                  and assign them to the correct speaker and tier type on the right side.
                </p>
                <p>
                  Keep in mind that you have to select <b>exactly one</b> default tier per speaker,
                  as it forms the basis for any token related metadata.
                </p>
              </div>
              <v-layout class="pl-3 pb-2 pt-2 table-header">
                <v-flex class="pl-3" xs1>
                  <v-tooltip z-index="999" top>
                    <v-checkbox
                      slot="activator"
                      color="white"
                      hide-details
                      class="mt-0"
                      @change="updateAllSelections"
                      :indeterminate="isAnythingOrAllSelected === null"
                      :input-value="isAnythingOrAllSelected"
                    />
                    <span v-if="isAnythingOrAllSelected === true">select none</span>
                    <span v-else>select all</span>
                  </v-tooltip>
                </v-flex>
                <v-flex class="grey--text caption pt-2" xs5>
                  From Exmaralda File
                </v-flex>
                <v-flex class="grey--text caption pt-2" xs6>
                  To Speakers and Tiers
                </v-flex>
              </v-layout>
              <v-form
                class="pb-5"
                ref="tierForm"
                v-model="tiersValid"
                lazy-validation>
                <v-layout
                  v-for="(speakerTier, i) in importable.speakerTiers"
                  :key="i"
                  class="pl-3 pt-3">
                  <v-flex class="pl-3" xs1>
                    <v-checkbox
                      class="pt-0"
                      @change="updateIsEverthingSelected"
                      v-model="speakerTier.select_for_import"
                    />
                  </v-flex>
                  <v-flex xs5 :class="[!speakerTier.select_for_import && 'disabled']">
                    <h4 class="ellipsis">{{ speakerTier.display_name }} <span class="caption grey--text">— {{ speakerTier.speaker_name }}</span></h4>
                    <v-chip small>
                      <label>category</label>{{ speakerTier.category }}
                    </v-chip>
                    <v-chip small>
                      <label>type</label> {{ speakerTier.type }}
                    </v-chip>
                    <v-chip small>
                      <label>events</label> {{ speakerTier.events.length }}
                    </v-chip>
                  </v-flex>
                  <v-flex xs2 :class="[!speakerTier.select_for_import && 'disabled']" class="pl-2">
                    <v-select
                      :rules="[ speakerTier.select_for_import && speakerTier.to_speaker === null && 'Select a Speaker' ]"
                      dense
                      label="Speaker"
                      v-model="speakerTier.to_speaker"
                      return-object
                      item-value="pk"
                      item-text="Kuerzel"
                      :items="surveySpeakers">
                      <template slot="item" slot-scope="item">
                        <v-list-tile-content>
                          <v-list-tile-title>
                            {{ item.item.Kuerzel }}
                          </v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action-text class="pl-5">
                          {{ item.item.Vorname }} {{ item.item.Name }}, {{ item.item.Geburtsdatum }}
                        </v-list-tile-action-text>
                      </template>
                    </v-select>
                  </v-flex>
                  <v-flex :class="[ !speakerTier.select_for_import && 'disabled' ]" xs2 class="pl-2">
                    <v-select
                      label="Tier Type"
                      :value="speakerTier.to_tier_type"
                      @change="(e) => updateTierType(speakerTier, e, i)"
                      :rules="[
                        speakerTier.select_for_import === true &&
                        speakerTier.to_tier_type === null &&
                        'Select a Type'
                        ,
                        isDuplicateDefaultTierForSpeaker(speakerTier) &&
                        'Select one Default Tier per Speaker'
                      ]"
                      :items="[{
                        text: 'default',
                        value: 'default',
                        disabled: isDefaultTierSelectedForSpeaker(speakerTier.to_speaker),
                        description: 'the base transcript'
                      }, {
                        text: 'token data',
                        value: 'tokenized',
                        description: 'metadata for tokens'
                      }, {
                        text: 'event based',
                        value: 'freeText',
                        description: 'event based, e.g. comments'
                      }]"
                      dense>
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
                  </v-flex>
                  <v-flex :class="[ !speakerTier.select_for_import && 'disabled' ]" xs2 class="pl-2 pr-2">
                    <!-- select which type of transcript the token tier is -->
                    <v-select
                      v-if="speakerTier.to_tier_type === 'tokenized' || speakerTier.to_tier_type === 'default'"
                      label="Transcript Type"
                      dense
                      v-model="speakerTier.token_tier_type"
                      :rules="[
                        speakerTier.select_for_import && speakerTier.token_tier_type == null && 'Select a Transcript Type'
                      ]"
                      :items="tokenTiersAvailable(speakerTier.to_speaker)">
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
                    <!-- choose tier name, if it’s not the default tier -->
                    <v-text-field
                      v-else
                      validate-on-blur
                      label="Tier Name"
                      v-model="speakerTier.to_tier_name"
                      :rules="[ speakerTier.select_for_import && !speakerTier.to_tier_name && 'Specify a name' ]"
                    />
                  </v-flex>
                </v-layout>
              </v-form>
            </v-window-item>
            <v-window-item :value="3">
              <v-layout column justify-center fill-height>
                <v-flex class="explainer">
                  <h1>Add your Audio File</h1>
                  <p>
                    Must be in OGG/Vorbis format. Use Audacity to convert it.
                  </p>
                </v-flex>
                <v-flex>
                  <drop-file
                    @update="updateFile"
                    :initial-file-name="fileName" />
                </v-flex>
              </v-layout>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-layout>
            <v-flex class="text-xs-left" xs4>
              <v-btn flat @click="$emit('close')" large>Cancel</v-btn>
            </v-flex>
            <v-flex class="text-xs-center" xs4>
              <v-btn
                v-for="i in 3"
                :key="i"
                icon
                :disabled="!((step + 1 === i && canContinue) || i <= step)"
                :active="step === i"
                @click="step = i">
                <v-icon :color="step === i ? 'primary' : 'grey'">mdi-record</v-icon>
              </v-btn>
            </v-flex>
            <v-flex class="text-xs-right" xs4>
              <v-btn
                large
                :disabled="step === 1"
                color="primary"
                flat
                @click="step--">
                Back
              </v-btn>
              <v-btn
                large
                :color="canContinue ? 'primary' : 'red'"
                class="elevation-0"
                :disabled="!canContinue"
                @click="validateAndNext">
                <span v-if="step < 3">Next</span>
                <span v-else>Finish</span>
              </v-btn>
            </v-flex>
          </v-layout>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang='ts'>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import {
  ParsedExmaraldaXML,
  SpeakerTierImportable,
  importableToServerTranscript
} from '../service/exmaralda-backend'

import {
  getSurveys,
  ServerInformant,
  ServerSurvey
} from '../store/transcript'

import DropFile from './DropFile.vue'
import _ from 'lodash'

@Component({
  components: {
    DropFile
  }
})
export default class ExmaraldaImporter extends Vue {

  @Prop({ required: true }) importable: ParsedExmaraldaXML
  surveys: ServerSurvey[]|null = null

  log = console.log

  step = 1

  basicInfoValid = false
  tiersValid = false

  transcriptName: string|null = null
  selectedSurvey: ServerSurvey|null = null
  fileName: string|null = null
  selectedFile: File|null = null

  showMissingDefaultTierError = false
  isAnythingOrAllSelected: boolean|null = true

  async mounted() {
    this.surveys = await getSurveys()
  }

  updateFile(file: File|null) {
    this.selectedFile = file
    this.fileName = file === null ? null : file.name
  }

  get surveySpeakers() {
    if (this.selectedSurvey !== null) {
      return this.selectedSurvey.FX_Informanten
    }
  }

  get canContinue() {
    return (
      (this.step === 1 && this.basicInfoValid === true && this.surveys !== null) ||
      (this.step === 2 && this.tiersValid === true && this.isAnythingOrAllSelected !== false) ||
      (this.step === 3 && this.fileName !== null)
    )
  }

  selectSurvey(survey: ServerSurvey) {
    this.selectedSurvey = survey
    this.fileName = survey.Audiofile
  }

  getSelectedDefaultTierForSpeaker(to_speaker: ServerInformant): SpeakerTierImportable[] {
    return this.importable.speakerTiers.filter(t => {
      return (
        t.to_speaker !== null &&
        t.to_speaker.pk === to_speaker.pk &&
        t.to_tier_type === 'default' &&
        t.select_for_import === true
      )
    })
  }

  isDefaultTierSelectedForSpeaker(to_speaker: ServerInformant|null): boolean {
    return to_speaker !== null && this.getSelectedDefaultTierForSpeaker(to_speaker).length === 1
  }

  speakerHasDuplicateDefaultTiers(to_speaker: ServerInformant): boolean {
    return this.getSelectedDefaultTierForSpeaker(to_speaker).length > 1
  }

  updateTierType(
    speakerTier: SpeakerTierImportable,
    to_tier_type: SpeakerTierImportable['to_tier_type'],
    i: number
  ) {
    this.importable.speakerTiers[i] = {
      ...speakerTier,
      to_tier_type
    }
    this.updateTierName(speakerTier, speakerTier.to_tier_type)
  }

  isDuplicateDefaultTierForSpeaker(speakerTier: SpeakerTierImportable): boolean {
    if (
      speakerTier.select_for_import === false ||
      speakerTier.to_tier_type === 'default' ||
      speakerTier.to_speaker === null
    ) {
      return false
    } else {
      return this.speakerHasDuplicateDefaultTiers(speakerTier.to_speaker)
    }
  }

  updateTierName(speakerTier: SpeakerTierImportable, to_tier_name: string|null) {
    if (to_tier_name !== null) {
      this.importable.speakerTiers = this.importable.speakerTiers.map((t) => {
        if (t.speaker_name === speakerTier.speaker_name && t.display_name === speakerTier.display_name) {
          return { ...t, to_tier_name }
        } else {
          return t
        }
      })
    }
  }

  updateAllSelections(v: boolean) {
    this.importable.speakerTiers = this.importable.speakerTiers.map((t) => {
      return { ...t, select_for_import: v }
    })
    this.updateIsEverthingSelected()
  }

  tokenTiersAvailable(to_speaker: ServerInformant) {

    const selectedTiersForSpeaker = this.importable.speakerTiers
      .filter(t =>
        t.select_for_import === true &&
        t.to_speaker !== null &&
        t.to_speaker.pk === to_speaker.pk)

    return [
        {
          text: 'orthographic',
          value: 'ortho',
          description: 'standard orthographic transcript',
          disabled: selectedTiersForSpeaker.findIndex((t) => {
            return t.token_tier_type === 'ortho'
          }) > -1
        },
        {
          text: 'variational',
          value: 'text',
          description: 'phonetic transcription\n using the latin alphabet',
          disabled: selectedTiersForSpeaker.findIndex((t) => {
            return t.token_tier_type === 'text'
          }) > -1
        },
        {
          text: 'phonetic',
          value: 'phon',
          description: 'actual phonetic transcription',
          disabled: selectedTiersForSpeaker.findIndex((t) => {
            return t.token_tier_type === 'phon'
          }) > -1
        }
      ]
  }

  get speakersWithMissingDefaultTier(): SpeakerTierImportable[] {
    return _(this.importable.speakerTiers)
      .filter(t => t.select_for_import === true && t.to_speaker !== null)
      .groupBy((st) => st.to_speaker!.pk)
      .filter(tiersBySpeaker => tiersBySpeaker.filter(t => t.to_tier_type === 'default').length !== 1)
      .toArray()
      .flatten()
      .value()
  }

  everySelectedSpeakerHasExactlyOneDefaultTier(): boolean {
    return this.speakersWithMissingDefaultTier.length === 0
  }

  validateAndNext() {
    if (this.step === 1) {
      if ((this.$refs.basicInfoForm as any).validate()) {
        this.step = this.step + 1
      }
    } else if (this.step === 2) {
      if ((this.$refs.tierForm as any).validate()) {
        if (this.everySelectedSpeakerHasExactlyOneDefaultTier()) {
          this.step = this.step + 1
        } else {
          this.showMissingDefaultTierError = true
        }
      }
    } else if (this.step === 3) {
      if (this.transcriptName !== null && this.selectedSurvey !== null) {
        this.$emit(
          'finish',
          importableToServerTranscript(this.importable, this.transcriptName, this.selectedSurvey),
          this.selectedFile
        )
      }
    }
  }

  updateIsEverthingSelected() {
    const every = _(this.importable.speakerTiers).every(t => t.select_for_import)
    if (every) {
      this.isAnythingOrAllSelected = true
    } else {
      const some = _(this.importable.speakerTiers).some(t => t.select_for_import)
      if (some) {
        this.isAnythingOrAllSelected = null
      } else {
        this.isAnythingOrAllSelected = false
      }
    }
  }

}
</script>
<style lang="stylus" scoped>

.snackbars
  position fixed
  bottom 0
  right 0
  z-index 9999999999
  display flex
  width 100vw
  flex-direction column-reverse
  align-items flex-end
  justify-content space-around
  div
    position relative !important
    margin-bottom 8px

.table-header
  position sticky
  top 0
  background #353535
  z-index 2

.v-form > .layout:nth-child(odd)
  background rgba(255,255,255,.05)

.disabled
  opacity .5
  pointer-events none

.v-chip__content label
  background rgba(255,255,255,.1)
  padding 7px 3px 7px 8px
  font-weight normal
  border-bottom-left-radius 16px
  border-top-left-radius 16px
  margin-left -12px
  margin-right 6px

.v-chip--small .v-chip__content label
  padding 3px 6px 2px 8px

</style>
