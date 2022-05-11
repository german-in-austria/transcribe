import {
  ServerTranscriptInformant,
  ServerTranscriptTokenTypes
} from '../service/backend-server.service'

declare global {
  interface Window {
    AudioContext: AudioContext
    webkitAudioContext: AudioContext
  }
}

export type TranscriptIndexedToken = {
  token: TranscriptToken
  eventIndex: number
  eventId: number
  speakerId: string
}

interface TranscriptTokenTier {
  text: string
  type: number|null
}

export interface LocalTranscriptSpeaker extends ServerTranscriptInformant {
  searchInSpeaker: boolean
}

export interface LocalTranscriptSpeakers {
  [speakerId: number]: LocalTranscriptSpeaker
}

export type TranscriptTokenTypes = ServerTranscriptTokenTypes

export type TokenTierType = 'text'|'ortho'|'phon'

export interface TranscriptToken {
  id: number
  fragmentOf: number|null
  sentenceId: number|null
  order: number
  tiers: {
    [key in TokenTierType]: TranscriptTokenTier
  }
}

export interface TierFreeText {
  id: string
  type: 'freeText'
  text: string
}

export type TranscriptSpeakerEventTier = TierFreeText

export interface TranscriptSpeakerEventTiers {
  [tierId: string]: TranscriptSpeakerEventTier
}

export interface TranscriptSpeakerEvent {
  speakerEventId: number
  tokens: TranscriptToken[]
  speakerEventTiers: TranscriptSpeakerEventTiers
}

export interface TranscriptEvent {
  eventId: number
  startTime: number
  endTime: number,
  speakerEvents: {
    [speakerId: string]: TranscriptSpeakerEvent
  }
}

export interface LocalTranscriptEditEvent extends TranscriptEvent {
  editType: 'UPDATE'|'DELETE'|'ADD'
}

export interface SearchResult {
  resultId: number
  offset: number
  offsetEnd: number
  text: string
  speakerId: string
  tierId: string
  event: TranscriptEvent
}

interface TranscriptTierBasic {
  name: string
  searchInTier: boolean
  show: any
}

interface TranscriptTierToken extends TranscriptTierBasic {
  type: 'token'
  id: TokenTierType
}

interface TranscriptTierEvent extends TranscriptTierBasic {
  type: 'freeText'
  id: string
}

export type TranscriptTier = TranscriptTierEvent|TranscriptTierToken

export type LocalTranscript = TranscriptEvent[]
