WITH transcriptsToDelete as (
	select * from transcript where name in(
		'4003_GRAG_alt_m_AI',
		'4103_GRAW_jung_m_AI',
		'4066_WIENW_alt_m_AI_Teil1'
	)
)
,
events AS (
	SELECT DISTINCT
		token.event_id_id
	FROM
		transcript tr
		JOIN token ON token.transcript_id_id = tr.id
	WHERE
		tr.id in (select id from transcriptsToDelete)
)
,
deletedTokens as (
	delete FROM token WHERE event_id_id in (select event_id_id from events) RETURNING *
),
deletedEvents as (
	delete from "event" WHERE id in (select event_id_id from events)
),
deletedTranscripts as (
	delete FROM transcript where id in (select id from transcriptsToDelete)
)
SELECT * from deletedTokens
;