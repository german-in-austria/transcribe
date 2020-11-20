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
        <v-btn @click="removeTier(i)" icon class="elevation-0"><v-icon>close</v-icon></v-btn>
      </template>
    </v-text-field>
    <v-text-field
      style="font-size: 13px"
      solo
      flat
      background-color="rgba(255,255,255,.04)"
      hide-details
      :rules="[ !isUniqueName(enteringTierName) && 'tier already exists' ]"
      class="elevation-0"
      @keyup.enter="addTier"
      v-model="enteringTierName"
      placeholder="Enter name for event tier (e. g. MSYN, Comment, etc.)">
      <template v-slot:append>
        <v-btn :disabled="!isValidTierName(enteringTierName)" small class="elevation-0">add</v-btn>
      </template>
    </v-text-field>
    <v-subheader class="px-0">Speakers ({{ speakersLength }})</v-subheader>
    <v-chip :key="speaker.k" v-for="speaker in speakers">
      <v-avatar class="mr-0">
        <v-icon>account_circle</v-icon>
      </v-avatar>
      {{ speaker.ka }}
    </v-chip>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { LocalTranscriptTier, LocalTranscriptSpeakers } from '../store/transcript'
import { ServerSurvey, getSurveys } from '../service/backend-server'
import _ from 'lodash'

@Component
export default class SpeakerTierEditor extends Vue {

  @Prop({ default: {} }) speakers!: LocalTranscriptSpeakers
  @Prop({ default: [] }) tiers!: LocalTranscriptTier[]

  enteringTierName = ''
  surveys: ServerSurvey[]|null = null

  get speakersLength() {
    return _(this.speakers).size()
  }

  isUniqueName(name: string) {
    return this.tiers.find(t => t.name === name) === undefined
  }

  isValidTierName(name: string) {
    return name.trim() !== '' && this.isUniqueName(name)
  }

  tierFromName(name: string): LocalTranscriptTier {
    return {
      name,
      id: 'text',
      type: 'freeText',
      show: true,
      searchInTier: true
    }
  }

  addTier() {
    if (this.isValidTierName(this.enteringTierName)) {
      this.$emit('update:tiers', [ ...this.tiers, this.tierFromName(this.enteringTierName) ])
      this.enteringTierName = ''
    }
  }

  async removeTier(index: number) {
    await this.$nextTick()
    this.$emit('update:tiers', this.tiers.filter((t, i) => i !== index))
  }

  async mounted() {
    this.surveys = await getSurveys()
  }

  get eventTiers(): LocalTranscriptTier[] {
    return this.tiers.filter(t => t.type === 'freeText')
  }

}
</script>
<style lang="scss" scoped>
</style>
