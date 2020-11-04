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
        Default Tier missing for speaker {{ speakerTier.to_speaker !== null ? speakerTier.to_speaker.Kuerzel : '' }}
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
          <v-spacer />Import "{{ importable.fileName }}"<v-spacer />
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
                    <v-select
                      label="Project Preset"
                      v-model="settings.projectPreset"
                      :items="projectPresetNames">
                    </v-select>
                    <v-text-field 
                      v-model="transcriptName"
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
              <v-layout :class="[
                'pl-3',
                'pb-2',
                'pt-2',
                'table-header',
                settings.darkMode === true && 'theme--dark'
              ]">
                <v-flex class="pl-3" xs1>
                  <v-checkbox
                    slot="activator"
                    color="white"
                    hide-details
                    :title="isAnythingOrAllSelected === true ? 'select none' : 'select all'"
                    class="mt-0"
                    @change="updateAllSelections"
                    :indeterminate="isAnythingOrAllSelected === null"
                    :input-value="isAnythingOrAllSelected"
                  />
                </v-flex>
                <v-flex class="grey--text caption pt-2" xs4>
                  From Exmaralda File
                </v-flex>
                <v-flex class="grey--text caption pt-2" xs4>
                  To Speakers and Tiers
                </v-flex>
                <v-flex class="grey--text caption pt-2 offset-xs2" xs1>
                  Preview
                </v-flex>
              </v-layout>
              <v-form
                :class="[
                  'pb-5',
                  settings.darkMode === true && 'theme--dark'
                ]"
                ref="tierForm"
                lazy-validation
                v-model="tiersValid">
                <v-layout
                  column
                  v-for="(speakerTier, i) in importable.speakerTiers"
                  :key="i"
                  class="pt-3 pb-3 pl-3">
                  <v-layout>
                    <v-flex xs1 class="pl-3">
                      <v-checkbox
                        class="pt-0"
                        @change="updateIsEverythingSelected"
                        v-model="speakerTier.select_for_import"
                      />
                    </v-flex>
                    <v-flex xs4 :class="[!speakerTier.select_for_import && 'disabled']">
                      <h4>{{ speakerTier.display_name }} <span class="caption grey--text">— {{ speakerTier.speaker_name }}</span></h4>
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
                    <v-flex xs2 :class="[ !speakerTier.select_for_import && 'disabled' ]" class="pl-2">
                      <v-select
                        label="Tier Type"
                        :value="speakerTier.to_tier_type"
                        @input="(e) => updateTierType(speakerTier, e, i)"
                        :disabled="speakerTier.to_speaker === null"
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
                    <v-flex xs2
                      :class="[ !speakerTier.select_for_import && 'disabled', 'pl-2', 'pr-2' ]">
                      <!-- select which type of transcript the token tier it is -->
                      <!-- placeholder -->
                      <v-select
                        v-if="speakerTier.to_tier_type === null"
                        :items="[]"
                        disabled
                        label="Transcript Type"
                      />
                      <!-- default tiers -->
                      <v-select
                        v-if="speakerTier.to_tier_type === 'default'"
                        :disabled="speakerTier.to_tier_type === null"
                        label="Transcript Type"
                        dense
                        :value="globalDefaultTier"
                        @input="(e) => updateTierTokenTypeAndGlobalDefault(i, e)"
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
                      <!-- token metadata -->
                      <v-select
                        v-if="speakerTier.to_tier_type === 'tokenized'"
                        label="Transcript Type"
                        dense
                        v-model="speakerTier.token_tier_type"
                        :rules="[
                          speakerTier.select_for_import &&
                          speakerTier.token_tier_type == null &&
                          'Select a Transcript Type'
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
                      <!-- tier name for free text tiers -->
                      <v-text-field
                        v-if="speakerTier.to_tier_type === 'freeText'"
                        validate-on-blur
                        label="Tier Name"
                        :disabled="speakerTier.to_tier_type === null"
                        v-model="speakerTier.to_tier_name"
                        :rules="[ speakerTier.select_for_import && !speakerTier.to_tier_name && 'Specify a name' ]"
                      />
                    </v-flex>
                    <v-flex xs1>
                      <v-btn v-ripple="false" icon @click="toggleSpeakerTierPreview(speakerTier.id)">
                        &#9662;
                      </v-btn>
                    </v-flex>
                  </v-layout>
                  <exmaralda-tier-preview
                    v-if="isSpeakerTierPreviewShown(speakerTier.id)"
                    :tier="speakerTier" />
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
                    @update="updateAudioFile"
                    :initial-file-name="audioFileName" />
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
import _ from 'lodash'

import settings from '../store/settings'
import presets from '../presets'
import { resourceAtUrlExists } from '../util'
import {
  ServerInformant,
  ServerSurvey,
  getSurveys,
  ServerTranscriptListItem,
  getAudioUrlFromServerNames
} from '../service/backend-server'

import {
  ParsedExmaraldaXML,
  SpeakerTierImportable,
  importableToServerTranscript
} from '../service/backend-exmaralda'

import {
  TokenTierType
} from '../store/transcript'

import ExmaraldaTierPreview from './ExmaraldaTierPreview.vue'
import DropFile from './DropFile.vue'

@Component({
  components: {
    DropFile,
    ExmaraldaTierPreview
  }
})
export default class ExmaraldaImporter extends Vue {

  @Prop({ required: true }) importable!: ParsedExmaraldaXML
  @Prop({ default: [] }) transcripts!: ServerTranscriptListItem[]

  surveys: ServerSurvey[]|null = null
  step = 1
  basicInfoValid = false
  tiersValid = false
  settings = settings
  presets = presets

  globalDefaultTier: TokenTierType|null = null
  transcriptName: string|null = this.importable.fileName.replace('.exb', '')
  selectedSurvey: ServerSurvey|null = null
  audioFileName: string|null = null
  audioFileUrl: string|null = null
  selectedAudioFile: File|null = null

  showMissingDefaultTierError = false
  isAnythingOrAllSelected: boolean|null = false
  visiblePreviewTier: string|null = null

  async mounted() {
    this.surveys = await getSurveys()
  }

  get projectPresetNames(): string[] {
    return _.map(this.presets, (p, name) => name)
  }

  isTranscriptNameUnique(n: string|null): boolean {
    return this.transcripts.find(t => t.n === n) === undefined
  }

  updateTierTokenTypeAndGlobalDefault(i: number, t: TokenTierType) {
    this.globalDefaultTier = t
  }

  isSpeakerTierPreviewShown(id: string): boolean {
    return this.visiblePreviewTier === id
  }

  toggleSpeakerTierPreview(id: string) {
    if (this.visiblePreviewTier === id) {
      this.visiblePreviewTier = null
    } else {
      this.visiblePreviewTier = id
    }
  }

  updateAudioFile(file: File|null) {
    this.selectedAudioFile = file
    this.audioFileName = file === null ? null : file.name
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
      (this.step === 3 && this.audioFileName !== null)
    )
  }

  async selectSurvey(survey: ServerSurvey) {
    this.selectedSurvey = survey
    const audioFileUrl = getAudioUrlFromServerNames(survey.Audiofile, survey.Dateipfad)
    if (audioFileUrl !== null && await resourceAtUrlExists(audioFileUrl)) {
      this.audioFileName = survey.Audiofile + '.ogg'
      this.audioFileUrl = audioFileUrl
    } else {
      // not found.
    }
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
    this.importable.speakerTiers[i].to_tier_type = to_tier_type
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

  updateAllSelections(v: boolean) {
    this.importable.speakerTiers = this.importable.speakerTiers.map((t) => {
      return { ...t, select_for_import: v }
    })
    this.updateIsEverythingSelected()
  }

  // FIXME: to_speaker can be null
  tokenTiersAvailable(to_speaker: ServerInformant) {

    const selectedTiersForSpeaker = this.importable.speakerTiers
      .filter(t =>
        t.select_for_import === true &&
        (t.to_tier_type === 'tokenized' || t.to_tier_type === 'default') &&
        t.to_speaker !== null &&
        t.to_speaker.pk === to_speaker.pk
      )
      .map(t => t.token_tier_type)

    return [
      {
        text: 'orthographic',
        value: 'ortho',
        description: 'standard orthographic transcript',
        disabled: selectedTiersForSpeaker.indexOf('ortho') > -1 || this.globalDefaultTier === 'ortho'
      },
      {
        text: 'eye dialect',
        value: 'text',
        description: 'phonetic transcription\n using the latin alphabet',
        disabled: selectedTiersForSpeaker.indexOf('text') > -1 || this.globalDefaultTier === 'text'
      },
      {
        text: 'phonetic',
        value: 'phon',
        description: 'actual phonetic transcription',
        disabled: selectedTiersForSpeaker.indexOf('phon') > -1 || this.globalDefaultTier === 'phon'
      }
    ]
  }

  get speakersWithMissingDefaultTier(): SpeakerTierImportable[] {
    return _(this.importable.speakerTiers)
      .filter(t => t.select_for_import === true && t.to_speaker !== null)
      .groupBy(st => st.to_speaker!.pk)
      .filter(tiersBySpeaker => tiersBySpeaker.filter(t => t.to_tier_type === 'default').length !== 1)
      .toArray()
      .flatten()
      .value()
  }

  everySelectedSpeakerHasExactlyOneDefaultTier(): boolean {
    return this.speakersWithMissingDefaultTier.length === 0
  }

  async validateAndNext() {
    if (this.step === 1) {
      if ((this.$refs.basicInfoForm as any).validate()) {
        this.step = this.step + 1
      }
    } else if (this.step === 2) {
      if ((this.$refs.tierForm as any).validate()) {
        if (this.everySelectedSpeakerHasExactlyOneDefaultTier() && this.globalDefaultTier !== null) {
          this.step = this.step + 1
        } else {
          this.showMissingDefaultTierError = true
        }
      }
    } else if (this.step === 3) {
      if (
        this.transcriptName !== null &&
        this.selectedSurvey !== null &&
        this.globalDefaultTier !== null
      ) {
        this.$emit(
          'finish',
          importableToServerTranscript(
            this.importable,
            this.transcriptName,
            this.selectedSurvey,
            this.globalDefaultTier
          ),
          this.selectedAudioFile,
          this.audioFileUrl
        )
      }
    }
  }

  updateIsEverythingSelected() {
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
  z-index 2
  background white
  &.theme--dark
    background #222

.v-form > .layout:nth-child(odd)
  background rgba(0,0,0,.05)

.v-form.theme--dark > .layout:nth-child(odd)
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
