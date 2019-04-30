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
        Default Tier missing for speaker {{ speakerTier.to_speaker }}
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
                    v-model="basicInfoValid"
                    lazy-validation>
                    <v-autocomplete
                      :loading="surveys === null"
                      :rules="[ selectedSurvey === null && 'Select a Survey' ]"
                      label="Survey"
                      v-model="selectedSurvey"
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
                      :rules="[ transcriptName === null || transcriptName.trim() === '' && 'Please enter a name for the transcript' ]" />
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
                <v-layout class="pl-3 pt-3" v-for="(speakerTier, i) in tree.speakerTiers" :key="i">
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
                      item-text="Kuerzel_anonym"
                      :items="speakers">
                      <template slot="item" slot-scope="item">
                        <v-list-tile-content>
                          <v-list-tile-title>
                            {{ item.item.Kuerzel_anonym }}
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
                      v-model="speakerTier.to_tier_type"
                      @change="updateTierName(speakerTier, speakerTier.to_tier_type)"
                      :rules="[
                        speakerTier.select_for_import && speakerTier.to_tier_type === null && 'Select a Type',
                        isDuplicateDefaultTierForSpeaker(speakerTier) && 'Select one Default Tier per Speaker'
                      ]"
                      :items="[{
                        text: 'default',
                        value: 'default',
                        disabled: isDefaultTierSelectedForSpeaker(speakerTier.to_speaker),
                        comment: 'the base transcript'
                      }, {
                        text: 'token data',
                        value: 'tokenized',
                        comment: 'metadata for tokens'
                      }, {
                        text: 'free text',
                        value: 'freeText',
                        comment: 'event based, e.g. comments'
                      }]"
                      dense>
                      <template slot="item" slot-scope="item">
                        <v-list-tile-content>
                          <v-list-tile-title>
                            {{ item.item.text }}
                          </v-list-tile-title>
                        </v-list-tile-content>
                        <v-list-tile-action-text class="pl-5">
                          {{ item.item.comment }}
                        </v-list-tile-action-text>
                      </template>
                    </v-select>
                  </v-flex>
                  <v-flex :class="[ !speakerTier.select_for_import && 'disabled' ]" xs2 class="pl-2 pr-2">
                    <v-text-field
                      :disabled="speakerTier.to_tier_type === 'default'"
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
              <div class="explainer">
                <h1>Add your Audio File</h1>
                <p>
                  Must be in OGG/Vorbis format. Use Audacity to convert it.
                </p>
              </div>
              <drop-file />
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-divider />
        <v-card-actions class="text-xs-right pa-3">
          <v-btn flat @click="$emit('close')">Cancel</v-btn>
          <v-spacer />
          <v-btn large :disabled="step === 1" color="primary" flat @click="step--">Back</v-btn>
          <v-btn large
            :color="(!basicInfoValid && step === 1) || (!tiersValid && step === 2) ? 'red' : 'primary'"
            class="elevation-0"
            :disabled="(!basicInfoValid && step === 1) || (!tiersValid && step === 2)"
            @click="validateAndNext">
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang='ts'>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { ParsedExmaraldaXML, SpeakerTierImportable } from '@service/exmaralda-parser'
import { getSurveys, Informant, ServerSurvey } from '../store/transcript'
import DropFile from './DropFile.vue'
import _ from 'lodash'

@Component({
  components: {
    DropFile
  }
})
export default class ExmaraldaImporter extends Vue {

  @Prop() tree: ParsedExmaraldaXML|null
  surveys: ServerSurvey[]|null = null
  selectedSurvey: ServerSurvey|null = null
  showMissingDefaultTierError = false
  step = 1
  tiersValid = false
  basicInfoValid = false
  isAnythingOrAllSelected: boolean|null = true
  speakers = []
  transcriptName = null

  async mounted() {
    this.surveys = await getSurveys()
  }

  getSelectedDefaultTierForSpeaker(to_speaker: string): SpeakerTierImportable[] {
    if (this.tree === null) {
      return []
    } else {
      return this.tree.speakerTiers.filter(t => {
        return (
          t.to_speaker === to_speaker &&
          t.to_tier_type === 'default' &&
          t.select_for_import === true
        )
      })
    }
  }

  isDefaultTierSelectedForSpeaker(to_speaker: string): boolean {
    return this.getSelectedDefaultTierForSpeaker(to_speaker).length === 1
  }

  speakerHasDuplicateDefaultTiers(to_speaker: string): boolean {
    return this.getSelectedDefaultTierForSpeaker(to_speaker).length > 1
  }

  isDuplicateDefaultTierForSpeaker(speakerTier: SpeakerTierImportable): boolean {
    if (
      speakerTier.select_for_import === false ||
      speakerTier.to_tier_type !== 'default' ||
      speakerTier.to_speaker === null
    ) {
      return false
    } else {
      if (this.tree !== null && this.speakerHasDuplicateDefaultTiers(speakerTier.to_speaker)) {
        return true
      } else {
        return false
      }
    }
  }

  updateTierName(speakerTier: SpeakerTierImportable, to_tier_name: string|null) {
    if (this.tree !== null && to_tier_name !== null) {
      this.tree.speakerTiers = this.tree.speakerTiers.map((t) => {
        if (t.speaker_name === speakerTier.speaker_name && t.display_name === speakerTier.display_name) {
          return { ...t, to_tier_name }
        } else {
          return t
        }
      })
    }
  }

  updateAllSelections(v: boolean) {
    if (this.tree !== null) {
      this.tree.speakerTiers = this.tree.speakerTiers.map((t) => {
        return { ...t, select_for_import: v }
      })
      this.updateIsEverthingSelected()
    }
  }

  get speakersWithMissingDefaultTier(): SpeakerTierImportable[] {
    if (this.tree !== null) {
      return _(this.tree.speakerTiers)
        .filter(t => t.select_for_import === true)
        .groupBy('to_speaker')
        .filter(tiersBySpeaker => tiersBySpeaker.filter(t => t.to_tier_type === 'default').length !== 1)
        .toArray()
        .flatten()
        .value()
    } else {
      return []
    }
  }

  everySelectedSpeakerHasExactlyOneDefaultTier(): boolean {
    if (this.tree !== null) {
      return this.speakersWithMissingDefaultTier.length === 0
    } else {
      return false
    }
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
    }
  }

  updateIsEverthingSelected() {
    if (this.tree !== null) {
      const every = _(this.tree.speakerTiers).every(t => t.select_for_import)
      console.log({every})
      if (every) {
        this.isAnythingOrAllSelected = true
      } else {
        const some = _(this.tree.speakerTiers).some(t => t.select_for_import)
        if (some) {
          this.isAnythingOrAllSelected = null
        } else {
          this.isAnythingOrAllSelected = false
        }
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
