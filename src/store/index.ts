import { ServerTranscriptListItem } from '@/service/backend-server.service'
import { LocalTranscriptListItem } from '@/service/disk.service'
import Transcript from '@/classes/transcript.class'
import { WarningEvent } from '@/service/warnings.service'

const store = {
  status: 'empty' as 'empty'|'loading'|'finished'|'new',
  transcript: null as Transcript|null,
  allTranscripts: null as ServerTranscriptListItem[]|LocalTranscriptListItem[]|null,
  warnings: [] as WarningEvent[]
}

export default store
