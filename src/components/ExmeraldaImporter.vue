<template>
  <v-dialog
    scrollable
    lazy
    :transition="false"
    @input="$event === false && $emit('close')"
    :value="true"
    content-class="dialog"
    max-width="1200">
    <v-card>
      <v-card-title class="display-block text-xs-center">
        <v-spacer />Import Exmaralda File<v-spacer />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-window v-model="step">
          <v-window-item :value="1">
            <v-layout class="pb-4 mt-5">
              <v-flex class="pl-3" xs1>
                <v-checkbox hide-details class="mt-0" :value="isEverythingSelected" />
              </v-flex>
              <v-flex class="grey--text caption pt-2" xs6>
                From Exmaralda File
              </v-flex>
              <v-flex class="grey--text caption pt-2" xs4>
                To Speakers and Tiers
              </v-flex>
            </v-layout>
            <v-layout class="mb-3" v-for="(speakerTier, i) in tree.speakerTiers" :key="i">
              <v-flex class="pl-3" xs1>
                <v-checkbox v-model="speakerTier.select_for_import" />
              </v-flex>
              <v-flex xs6>
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
              <v-flex xs2 class="pl-2 pr-2">
                <v-select label="Speaker" item-text="Kuerzel_anonym" dense :items="speakers">
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
              <v-flex xs2>
                <v-select
                  dense
                  label="Tier Type"
                  :items="[{ text: 'default', value: 'default' }, { text: 'tokenized', value: 'tokenized'}, { text: 'free text', value: 'freeText' }]" />
              </v-flex>
            </v-layout>
          </v-window-item>
          <v-window-item :value="2">
            add an audio file
          </v-window-item>
        </v-window>
      </v-card-text>
      <v-divider />
      <v-card-actions class="text-xs-right">
        <v-spacer />
        <v-btn flat @click="$emit('close')">Cancel</v-btn>
        <v-btn color="primary" flat @click="step++">Next</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang='ts'>
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { ParsedXML } from '@service/exmeralda-parser'
import _ from 'lodash'

@Component
export default class ExmeraldaImporter extends Vue {

  @Prop() tree: ParsedXML|null
  step = 1
  speakers = [
    {
      id : 1,
      Name : 'Eisenheld',
      Vorname : 'Leopold',
      GWPGruppe : null,
      Wohnbezirk : 1220,
      weiblich : false,
      Kuerzel_anonym : 'MF',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1970-06-16',
      Kuerzel : 'LE'
    },
    {
      id : 2,
      Name : 'Beate',
      Vorname : 'Zant',
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : true,
      Kuerzel_anonym : 'CA',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1960-11-27',
      Kuerzel : 'BZ'
    },
    {
      id : 3,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : true,
      Kuerzel_anonym : 'NF',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1952-01-24',
      Kuerzel : 'ME'
    },
    {
      id : 4,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : false,
      Kuerzel_anonym : 'NG',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1949-12-11',
      Kuerzel : 'LE2'
    },
    {
      id : 5,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1070,
      weiblich : false,
      Kuerzel_anonym : 'BI',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1986-11-01',
      Kuerzel : 'AG'
    },
    {
      id : 6,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1150,
      weiblich : false,
      Kuerzel_anonym : 'NL',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1983-09-14',
      Kuerzel : 'MK'
    },
    {
      id : 7,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : true,
      Kuerzel_anonym : 'NV',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1960-01-09',
      Kuerzel : 'MU'
    },
    {
      id : 8,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1220,
      weiblich : true,
      Kuerzel_anonym : 'FF',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1959-05-05',
      Kuerzel : 'EE'
    },
    {
      id : 9,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1120,
      weiblich : false,
      Kuerzel_anonym : 'NI',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1969-07-09',
      Kuerzel : 'MH'
    },
    {
      id : 10,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : true,
      Kuerzel_anonym : 'MG',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1978-10-23',
      Kuerzel : 'LE3'
    },
    {
      id : 11,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : false,
      Kuerzel_anonym : 'BC',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1929-11-11',
      Kuerzel : 'AB'
    },
    {
      id : 12,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : false,
      Kuerzel_anonym : 'XT',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1960-10-13',
      Kuerzel : 'WS'
    },
    {
      id : 13,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1100,
      weiblich : false,
      Kuerzel_anonym : 'NT',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1965-05-30',
      Kuerzel : 'MS'
    },
    {
      id : 14,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : false,
      Kuerzel_anonym : 'KO',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1944-11-11',
      Kuerzel : 'JN'
    },
    {
      id : 15,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1180,
      weiblich : false,
      Kuerzel_anonym : 'NO',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1953-07-24',
      Kuerzel : 'MP'
    },
    {
      id : 16,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1090,
      weiblich : false,
      Kuerzel_anonym : 'LL',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1959-05-07',
      Kuerzel : 'KK'
    },
    {
      id : 17,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1220,
      weiblich : false,
      Kuerzel_anonym : 'DS',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1986-05-29',
      Kuerzel : 'CR'
    },
    {
      id : 18,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1050,
      weiblich : true,
      Kuerzel_anonym : 'TU',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1986-02-10',
      Kuerzel : 'ST'
    },
    {
      id : 19,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : false,
      Kuerzel_anonym : 'QJ',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1992-01-06',
      Kuerzel : 'PI'
    },
    {
      id : 20,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1140,
      weiblich : false,
      Kuerzel_anonym : 'OK',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1992-12-03',
      Kuerzel : 'MH2'
    },
    {
      id : 21,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1050,
      weiblich : true,
      Kuerzel_anonym : 'TX',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1986-07-14',
      Kuerzel : 'SV'
    },
    {
      id : 22,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1130,
      weiblich : false,
      Kuerzel_anonym : 'IL',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1957-03-01',
      Kuerzel : 'HK'
    },
    {
      id : 23,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1210,
      weiblich : true,
      Kuerzel_anonym : 'LM',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1934-04-16',
      Kuerzel : 'KL'
    },
    {
      id : 24,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1050,
      weiblich : true,
      Kuerzel_anonym : 'EI',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1954-10-29',
      Kuerzel : 'DH'
    },
    {
      id : 25,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : true,
      Kuerzel_anonym : 'JL',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1976-05-25',
      Kuerzel : 'IK'
    },
    {
      id : 26,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1030,
      weiblich : false,
      Kuerzel_anonym : 'LU',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1948-05-15',
      Kuerzel : 'KT'
    },
    {
      id : 27,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1050,
      weiblich : false,
      Kuerzel_anonym : 'BR',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1987-05-20',
      Kuerzel : 'AP'
    },
    {
      id : 28,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1110,
      weiblich : false,
      Kuerzel_anonym : 'DU',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1987-04-14',
      Kuerzel : 'CT'
    },
    {
      id : 29,
      Name : '',
      Vorname : '',
      GWPGruppe : null,
      Wohnbezirk : 1170,
      weiblich : false,
      Kuerzel_anonym : 'CS',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1993-09-24',
      Kuerzel : 'AP2'
    },
    {
      id : 30,
      Name : '',
      Vorname : '',
      GWPGruppe : null,
      Wohnbezirk : 1020,
      weiblich : true,
      Kuerzel_anonym : 'ET',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1985-08-09',
      Kuerzel : 'DS'
    },
    {
      id : 31,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1200,
      weiblich : false,
      Kuerzel_anonym : 'BG',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1985-02-20',
      Kuerzel : 'AF'
    },
    {
      id : 32,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : 1160,
      weiblich : true,
      Kuerzel_anonym : 'BT',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : '1992-05-15',
      Kuerzel : 'AS'
    },
    {
      id : 33,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : null,
      weiblich : true,
      Kuerzel_anonym : 'AS_Besuch',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : null,
      Kuerzel : 'AS_Mimi'
    },
    {
      id : 34,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : null,
      weiblich : false,
      Kuerzel_anonym : 'OK_c',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : null,
      Kuerzel : 'MH2_c'
    },
    {
      id : 35,
      Name : null,
      Vorname : null,
      GWPGruppe : null,
      Wohnbezirk : null,
      weiblich : false,
      Kuerzel_anonym : 'LMB',
      DialKomp : null,
      StandKomp : null,
      ErhAlterCa : null,
      ZwischKomp : null,
      Geburtsdatum : null,
      Kuerzel : 'LMB'
    }
  ]

  get isEverythingSelected() {
    if (this.tree !== null) {
      return _(this.tree.speakerTiers).every(st => st.select_for_import)
    } else {
      return false
    }
  }

  get sortedSpeakerTiers() {
    if (this.tree !== null) {
      return _(this.tree.speakerTiers).sortBy('display_name')
    } else {
      return []
    }
  }

  mounted() {
    console.log({tree: this.tree})
  }
}
</script>
<style lang="stylus" scoped>

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

.exb-tier-props
  border-collapse collapse
  font-size 90%
  width 100%
  table-layout fixed
  white-space nowrap
  border-collapse collapse
  font-size 90%
  td
    padding 3px 7px
    &:first-child
      opacity .7
  tr:nth-child(odd)
    background rgba(255,255,255,.1)

</style>
