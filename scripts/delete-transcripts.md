
# Delete Transcripts

```sql
--- first delete events (because they are not associated to transcripts)
delete from event where event.id in (
  Select distinct token.event_id_id from transcript tr
  join token
  on token.transcript_id_id = tr.id
  where name in ('0213_NECK_alt_f_INT_Vers32', '0230_TARR_jungII_m_BDE_INT_Vers9', '0230_TARR_jungII_m_INT_Vers12')
);
--- then delete the transcripts and its associated data
delete from transcript where name in ('0213_NECK_alt_f_INT_Vers32', '0230_TARR_jungII_m_BDE_INT_Vers9', '0230_TARR_jungII_m_INT_Vers12') returning *;
```
