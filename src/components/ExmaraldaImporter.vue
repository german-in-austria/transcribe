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
        Default Tier missing for speaker {{ speakerTier.toSpeaker !== null ? speakerTier.toSpeaker.Kuerzel : '' }}
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
                  <server-transcript-info-form
                    v-model="isBasicInfoValid"
                    @update="updateBasicInfo"
                    class="pb-5"
                    :transcripts="transcripts"
                    :name="transcriptName"
                    :survey="selectedSurvey"
                  />
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
                'pl-3 pb-2 pt-2 table-header',
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
                v-model="areTiersValid">
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
                        v-model="speakerTier.selectForImport"
                      />
                    </v-flex>
                    <v-flex xs4 :class="[!speakerTier.selectForImport && 'disabled']">
                      <h4>{{ speakerTier.display_name }} <span class="caption grey--text">— {{ speakerTier.speakerName }}</span></h4>
                      <v-chip small>
                        <label>events</label> {{ speakerTier.events.length }}
                      </v-chip>
                      <v-chip small>
                        <label>category</label>{{ speakerTier.category }}
                      </v-chip>
                      <v-chip small>
                        <label>type</label> {{ speakerTier.type }}
                      </v-chip>
                    </v-flex>
                    <v-flex xs2 :class="[!speakerTier.selectForImport && 'disabled']" class="pl-2">
                      <v-select
                        :rules="[ speakerTier.selectForImport && speakerTier.toSpeaker === null && 'Select a Speaker' ]"
                        dense
                        label="Speaker"
                        v-model="speakerTier.toSpeaker"
                        return-object
                        item-value="pk"
                        item-text="Kuerzel"
                        :items="possibleSpeakers">
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
                    <v-flex xs2 :class="[ !speakerTier.selectForImport && 'disabled' ]" class="pl-2">
                      <v-select
                        label="Tier Type"
                        :value="speakerTier.toTierType"
                        @input="(e) => updateTierType(speakerTier, e, i)"
                        :disabled="speakerTier.toSpeaker === null"
                        :rules="[
                          speakerTier.selectForImport === true &&
                          speakerTier.toTierType === null &&
                          'Select a Type'
                          ,
                          isDuplicateDefaultTierForSpeaker(speakerTier) &&
                          'Select one Default Tier per Speaker'
                        ]"
                        :items="[{
                          text: 'default',
                          value: 'default',
                          disabled: isDefaultTierSelectedForSpeaker(speakerTier.toSpeaker),
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
                      :class="[ !speakerTier.selectForImport && 'disabled', 'pl-2', 'pr-2' ]">
                      <!-- select which type of transcript the token tier it is -->
                      <!-- placeholder -->
                      <v-select
                        v-if="speakerTier.toTierType === null"
                        :items="[]"
                        disabled
                        label="Transcript Type"
                      />
                      <!-- default tiers -->
                      <v-select
                        v-if="speakerTier.toTierType === 'default'"
                        :disabled="speakerTier.toTierType === null"
                        label="Transcript Type"
                        dense
                        :value="globalDefaultTier"
                        @input="(e) => updateTierTokenTypeAndGlobalDefault(i, e)"
                        :items="tokenTiersAvailable(speakerTier.toSpeaker)">
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
                        v-if="speakerTier.toTierType === 'tokenized'"
                        label="Transcript Type"
                        dense
                        v-model="speakerTier.tokenTierType"
                        :rules="[
                          speakerTier.selectForImport &&
                          speakerTier.tokenTierType == null &&
                          'Select a Transcript Type'
                        ]"
                        :items="tokenTiersAvailable(speakerTier.toSpeaker)">
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
                        v-if="speakerTier.toTierType === 'freeText'"
                        validate-on-blur
                        label="Tier Name"
                        :disabled="speakerTier.toTierType === null"
                        v-model="speakerTier.toTierName"
                        :rules="[ speakerTier.selectForImport && !speakerTier.toTierName && 'Specify a name' ]"
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

import settings from '../store/settings.store'
import { resourceAtUrlExists } from '../util'
import {
  ServerInformant,
  ServerSurvey,
  ServerTranscriptListItem,
  getAudioUrlFromServerNames,
  serverTokenTiers
} from '../service/backend-server.service'

import {
  ParsedExmaraldaXML,
  SpeakerTierImportable,
  importableToServerTranscript
} from '../service/backend-exmaralda.service'

import {
  TokenTierType
} from '@/types/transcript'

import ExmaraldaTierPreview from './ExmaraldaTierPreview.vue'
import DropFile from './DropFile.vue'
import ServerTranscriptInfoForm from './ServerTranscriptInfoForm.vue'
import { ProjectPresetName } from '@/presets'

@Component({
  components: {
    DropFile,
    ExmaraldaTierPreview,
    ServerTranscriptInfoForm
  }
})
export default class ExmaraldaImporter extends Vue {

  @Prop({ required: true }) importable!: ParsedExmaraldaXML
  @Prop({ default: [] }) transcripts!: ServerTranscriptListItem[]

  step = 1
  isBasicInfoValid = false
  areTiersValid = false
  settings = settings

  globalDefaultTier: TokenTierType|null = null
  transcriptName: string|null = this.importable.fileName.replace('.exb', '')
  selectedSurvey: ServerSurvey|null = null
  audioFileName: string|null = null
  audioFileUrl: string|null = null
  selectedAudioFile: File|null = null

  showMissingDefaultTierError = false
  isAnythingOrAllSelected: boolean|null = false
  visiblePreviewTier: string|null = null

  updateBasicInfo(args: { transcriptName: string, selectedSurvey: ServerSurvey, projectPreset: ProjectPresetName}) {
    this.transcriptName = args.transcriptName
    this.selectSurvey(args.selectedSurvey)
    settings.projectPreset = args.projectPreset
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

  get possibleSpeakers(): ServerInformant[] {
    if (this.selectedSurvey !== null) {
      return this.selectedSurvey.FX_Informanten
    } else {
      return Object.keys(this.importable.speakers).map(s => ({
        Kuerzel: s,
        Vorname: null,
        Kuerzel_anonym: null,
        Name: null,
        pk: Number(_.uniqueId()) * -1
      }))
    }
  }

  get canContinue() {
    return (
      (this.step === 1 && this.isBasicInfoValid === true) ||
      (this.step === 2 && this.areTiersValid === true && this.isAnythingOrAllSelected !== false) ||
      (this.step === 3 &&
        this.audioFileName !== null &&
        this.transcriptName !== null &&
        (settings.backEndUrl !== null && this.selectedSurvey !== null) &&
        this.globalDefaultTier !== null
      )
    )
  }

  async selectSurvey(survey: ServerSurvey) {
    this.selectedSurvey = survey
    if (settings.backEndUrl !== null) {
      const audioFileUrl = getAudioUrlFromServerNames(survey.Audiofile, survey.Dateipfad, settings.backEndUrl)
      if (audioFileUrl !== null && await resourceAtUrlExists(audioFileUrl)) {
        this.audioFileName = survey.Audiofile + '.ogg'
        this.audioFileUrl = audioFileUrl
      } else {
        // not found.
      }
    }
  }

  getSelectedDefaultTierForSpeaker(toSpeaker: ServerInformant): SpeakerTierImportable[] {
    return this.importable.speakerTiers.filter(t => {
      return (
        t.toSpeaker !== null &&
        t.toSpeaker.pk === toSpeaker.pk &&
        t.toTierType === 'default' &&
        t.selectForImport === true
      )
    })
  }

  isDefaultTierSelectedForSpeaker(toSpeaker: ServerInformant|null): boolean {
    return toSpeaker !== null && this.getSelectedDefaultTierForSpeaker(toSpeaker).length === 1
  }

  speakerHasDuplicateDefaultTiers(toSpeaker: ServerInformant): boolean {
    return this.getSelectedDefaultTierForSpeaker(toSpeaker).length > 1
  }

  updateTierType(
    speakerTier: SpeakerTierImportable,
    toTierType: SpeakerTierImportable['toTierType'],
    i: number
  ) {
    this.importable.speakerTiers[i].toTierType = toTierType
  }

  isDuplicateDefaultTierForSpeaker(speakerTier: SpeakerTierImportable): boolean {
    if (
      speakerTier.selectForImport === false ||
      speakerTier.toTierType === 'default' ||
      speakerTier.toSpeaker === null
    ) {
      return false
    } else {
      return this.speakerHasDuplicateDefaultTiers(speakerTier.toSpeaker)
    }
  }

  updateAllSelections(v: boolean) {
    this.importable.speakerTiers = this.importable.speakerTiers.map((t) => {
      return { ...t, selectForImport: v }
    })
    this.updateIsEverythingSelected()
  }

  // FIXME: toSpeaker can be null
  tokenTiersAvailable(toSpeaker: ServerInformant) {

    const selectedTiersForSpeaker = this.importable.speakerTiers
      .filter(t =>
        t.selectForImport === true &&
        (t.toTierType === 'tokenized' || t.toTierType === 'default') &&
        t.toSpeaker !== null &&
        t.toSpeaker.pk === toSpeaker.pk
      )
      .map(t => t.tokenTierType)

    return serverTokenTiers.map(stt => {
      return { ...stt, disabled: selectedTiersForSpeaker.indexOf(stt.value) > -1 || this.globalDefaultTier === stt.value }
    })
  }

  get speakersWithMissingDefaultTier(): SpeakerTierImportable[] {
    return _(this.importable.speakerTiers)
      .filter(t => t.selectForImport === true && t.toSpeaker !== null)
      .groupBy(st => st.toSpeaker!.pk)
      .filter(tiersBySpeaker => tiersBySpeaker.filter(t => t.toTierType === 'default').length !== 1)
      .toArray()
      .flatten()
      .value()
  }

  everySelectedSpeakerHasExactlyOneDefaultTier(): boolean {
    return this.speakersWithMissingDefaultTier.length === 0
  }

  async validateAndNext() {
    if (this.step === 1) {
      if (this.isBasicInfoValid) {
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
        (settings.backEndUrl !== null && this.selectedSurvey !== null) &&
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
    const every = _(this.importable.speakerTiers).every(t => t.selectForImport)
    if (every) {
      this.isAnythingOrAllSelected = true
    } else {
      const some = _(this.importable.speakerTiers).some(t => t.selectForImport)
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
