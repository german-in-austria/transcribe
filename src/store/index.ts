import { ServerTranscriptListItem } from '@/service/backend-server'
import { LocalTranscriptListItem } from '@/service/disk'
import Transcript from '@/service/transcript.class'
import { history } from '@/store/history'
import settings from '@/store/settings'

export default {
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  transcript: null as Transcript|null,
  allTranscripts: null as ServerTranscriptListItem[]|LocalTranscriptListItem[]|null,
  history,
  settings
}
