# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

```SQL
--
--
--delete from event where event.id in (
--  Select distinct token.event_id_id from transcript tr
--  join token
--  on token.transcript_id_id = tr.id
--  where name in ('0024_NECK_jungII_m_INT_Vers2', '0025_NECK_jungII_m_BDE_INT_Vers7', '0025_NECK_jungII_m_INT_Vers24', '0026_0027_NECK_GFG_Vers41', '0026_NECK_jungII_f_INT_Vers30', '0027_NECK_jungII_f_BDE_INT_Vers4', '0027_NECK_jungII_f_INT_Vers5', '0056_WEIS_alt_m_INT_Vers22', '0057_WEIS_alt_f_INT_Vers28', '0067_0307_WEIS_GFG_Vers35', '0067_WEIS_jungII_m_INT_Vers29', '0204_NMYB_jungII_m_INT_Vers25', '0209_0211_NMYB_GFG_Vers34', '0209_NMYB_alt_f_INT_Vers31', '0210_0218_NMYB_GFG_Vers29', '0210_NMYB_alt_m_INT_Vers21', '0215_NECK_alt_f_BDE_INT_Vers3', '0215_NECK_alt_f_INT_Vers21', '0219_0204_NMYB_GFG_Vers20', '0230_0244_TARR_GFG_Vers13', '0234_TARR_alt_f_BDE_INT_Vers4', '0234_TARR_alt_f_INT_Vers5', '0308_0301_WEIS_GFG2_Vers23', '0024_0025_NECK_GFG_Vers35', '0056_0057_WEIS_GFG_Vers71', '0215_0213_NECK_GFG_Vers49')
--);
--
--delete from transcript where name in ('0024_NECK_jungII_m_INT_Vers2', '0025_NECK_jungII_m_BDE_INT_Vers7', '0025_NECK_jungII_m_INT_Vers24', '0026_0027_NECK_GFG_Vers41', '0026_NECK_jungII_f_INT_Vers30', '0027_NECK_jungII_f_BDE_INT_Vers4', '0027_NECK_jungII_f_INT_Vers5', '0056_WEIS_alt_m_INT_Vers22', '0057_WEIS_alt_f_INT_Vers28', '0067_0307_WEIS_GFG_Vers35', '0067_WEIS_jungII_m_INT_Vers29', '0204_NMYB_jungII_m_INT_Vers25', '0209_0211_NMYB_GFG_Vers34', '0209_NMYB_alt_f_INT_Vers31', '0210_0218_NMYB_GFG_Vers29', '0210_NMYB_alt_m_INT_Vers21', '0215_NECK_alt_f_BDE_INT_Vers3', '0215_NECK_alt_f_INT_Vers21', '0219_0204_NMYB_GFG_Vers20', '0230_0244_TARR_GFG_Vers13', '0234_TARR_alt_f_BDE_INT_Vers4', '0234_TARR_alt_f_INT_Vers5', '0308_0301_WEIS_GFG2_Vers23', '0024_0025_NECK_GFG_Vers35', '0056_0057_WEIS_GFG_Vers71', '0215_0213_NECK_GFG_Vers49') returning *;



WITH parsed_tags as (
  SELECT
    --  the result of the parsing operation (below)
    parsed_tag,
    --  if available, use the tag name from the join, otherwise try a case-insensitive search
    COALESCE(tags."Tag", (SELECT "Tag" FROM "KorpusDB_tbl_tags" WHERE LOWER(parsed_tag) = LOWER("Tag"))) as tag,
    --  same as above, but with tag ids.
    COALESCE(tags.id, (SELECT id FROM "KorpusDB_tbl_tags" WHERE LOWER(parsed_tag) = LOWER("Tag"))) as tag_id,
    --  which event?
    event_id_id,
    tags."Generation" as generation,
    tier_id_id,
    inf_id,
    ROW_NUMBER() OVER (PARTITION BY tag_set_index) as tag_order,
    -- delete the tier event once we have resolved the tags, otherwise leave it.
    tier_event_id,
    text,
    --  first and last token of event
    (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung ASC LIMIT 1) as first_token,
    (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung DESC LIMIT 1) as last_token,
    -- show tag ebene parsing result
    substring(text, E'\\[?(\\w+)\\]?') as parsed_tag_ebene,
    -- match the tag ebene
    (SELECT id FROM "KorpusDB_tbl_tagebene" WHERE LOWER("Name") = LOWER(substring(text, E'\\[?(\\w+)\\]?'))) as tag_ebene,
    tag_set_index,
    answer_order,
    --  amount of tokens in the event
    (SELECT count(*) FROM token WHERE event_id_id = t.event_id_id) as count_tokens
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (ORDER BY event_id_id) as tag_set_index,
      ROW_NUMBER() OVER (partition by event_id_id) as answer_order,
      --  split definitions into tags
      TRIM((regexp_split_to_table(REPLACE(REPLACE(text, '[', ''), ']', ''), E'\, '))) AS parsed_tag
    FROM (
      SELECT
        --  split rows into definitons
        TRIM((regexp_split_to_table(text, E'\\]\,? \\['))) as text,
        event_id_id,
        tier_id_id,
        event_tier.id AS tier_event_id,
        "ID_Inf_id" as inf_id
      FROM event_tier
      JOIN tier
        ON tier.id = event_tier.tier_id_id
      WHERE tier.tier_name = 'msyn'
        AND text != ''
    ) AS innerSelectTag
  ) as t
  LEFT OUTER JOIN "KorpusDB_tbl_tags" AS tags
    ON "Tag" = parsed_tag
)
-- ANTWORTEN:

-- SELECT
--  DISTINCT ON (event_id_id)
--  inf_id as "von_Inf_id",
--  '[IMPORTED]' as "Kommentar",
--  CASE WHEN count_tokens = 1
--    THEN 0
--    ELSE 1
--    END as is_tokenset
--  FROM parsed_tags

-- TOKENSETS:
-- SELECT
--   DISTINCT ON (tag_set_index)
--   first_token,
--   last_token
-- FROM parsed_tags
-- WHERE first_token != last_token

--  ANTWORTTAGS:
--  SELECT
--    tag_id as "id_Tag_id",
--    COALESCE(first_tag_tag_ebene, parsed_tag_ebene_id) as "id_TagEbene_id",
--    tag_order as "Reihung"
--  FROM parsed_tags

--TODO :https://stackoverflow.com/questions/41595018/postgresql-insert-data-into-multiple-tables-simultaneously
```
