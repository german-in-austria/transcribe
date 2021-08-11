<template>
  <div>
    <v-text-field
      style="font-size: 13px"
      class="mt-0 pt-0 mb-2 elevation-0"
      solo
      flat
      v-for="(tier, i) in eventTiers"
      :key="i"
      hide-details
      v-model="tier.name">
      <template v-slot:append>
        <v-btn
          @click="removeEventTier(tier.id)"
          icon
          class="elevation-0">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-text-field>
    <v-text-field
      style="font-size: 13px"
      solo
      flat
      background-color="rgba(255,255,255,.04)"
      hide-details
      :rules="[ !isUniqueTierName(enteringTierName) && 'tier already exists' ]"
      class="elevation-0"
      @keyup.enter="addTier"
      v-model="enteringTierName"
      placeholder="Enter name for event tier (e. g. MSYN, Comment, etc.)">
      <template v-slot:append>
        <v-btn
          @click="addTier"
          :disabled="!isValidTierName(enteringTierName)"
          small
          class="elevation-0">
          add
        </v-btn>
      </template>
    </v-text-field>
    <v-subheader class="px-0">Speakers ({{ speakersLength }})</v-subheader>
    <div v-if="settings.backEndUrl === null">
      <v-text-field
        style="font-size: 13px"
        class="mt-0 pt-0 mb-2 elevation-0"
        solo
        flat
        v-for="(speaker, key) in speakers"
        :key="key"
        hide-details
        v-model="speaker.ka">
        <template v-slot:append>
          <v-btn @click="removeSpeaker(key)" icon class="elevation-0"><v-icon>close</v-icon></v-btn>
        </template>
      </v-text-field>
      <v-text-field
        style="font-size: 13px"
        solo
        flat
        background-color="rgba(255,255,255,.04)"
        hide-details
        :rules="[ !isUniqueSpeakerName(enteringSpeakerName) && 'Speaker already exists' ]"
        class="elevation-0"
        @keyup.enter="addSpeaker"
        v-model="enteringSpeakerName"
        placeholder="Enter name for Speaker">
        <template v-slot:append>
          <v-btn @click="addSpeaker" :disabled="!isValidSpeakerName(enteringSpeakerName)" small class="elevation-0">add</v-btn>
        </template>
      </v-text-field>
    </div>
    <div v-else>
      <v-chip :key="speaker.k" v-for="speaker in speakers">
        <v-avatar class="mr-0">
          <v-icon>account_circle</v-icon>
        </v-avatar>
        {{ speaker.ka }}
      </v-chip>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { TranscriptTier, LocalTranscriptSpeakers, LocalTranscriptSpeaker } from '@/types/transcript'
import store from '@/store'
import _ from 'lodash'
import Transcript from '@/classes/transcript.class'
import settings from '@/store/settings.store'

@Component
export default class SpeakerTierEditor extends Vue {

  @Prop({ default: {} }) speakers!: LocalTranscriptSpeakers
  @Prop({ default: [] }) tiers!: TranscriptTier[]

  settings = settings
  enteringTierName = ''
  enteringSpeakerName = ''

  get speakersLength() {
    return _(this.speakers).size()
  }

  isUniqueSpeakerName(name: string) {
    return _(this.speakers).find(s => s.ka === name) === undefined
  }

  isUniqueTierName(name: string) {
    return this.tiers.find(t => t.name === name) === undefined
  }

  isValidTierName(name: string) {
    return name.trim() !== '' && this.isUniqueTierName(name)
  }

  isValidSpeakerName(name: string) {
    return name.trim() !== '' && this.isUniqueSpeakerName(name)
  }

  speakerFromName(name: string): LocalTranscriptSpeaker {
    return {
      ka: name,
      k: name,
      searchInSpeaker: true
    }
  }

  tierFromName(name: string): TranscriptTier {
    return {
      name,
      id: String(Transcript.makeEventTierId()),
      type: 'freeText',
      show: true,
      searchInTier: true
    }
  }

  addSpeaker() {
    if (this.isValidTierName(this.enteringSpeakerName)) {
      this.$emit('update:speakers', {
        ...this.speakers,
        [ Transcript.makeSpeakerId() ]: this.speakerFromName(this.enteringSpeakerName)
      })
      this.enteringSpeakerName = ''
    }
  }

  addTier() {
    if (this.isValidTierName(this.enteringTierName)) {
      this.$emit('update:tiers', [ ...this.tiers, this.tierFromName(this.enteringTierName) ])
      this.enteringTierName = ''
    }
  }

  async removeEventTier(id: string) {
    this.$emit('update:tiers', this.tiers.filter(t => !(t.type === 'freeText' && t.id === id)))
  }

  async removeSpeaker(key: string) {
    await this.$nextTick()
    this.$emit('update:speakers', _.omit(this.speakers, key))
  }

  get eventTiers(): TranscriptTier[] {
    return this.tiers.filter(t => t.type === 'freeText')
  }

}
</script>
<style lang="scss" scoped>
</style>
