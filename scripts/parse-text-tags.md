# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

```SQL
  ( SELECT
    --  the result of the parsing operation (below)
    parsed_tag,
    --  if available, use the tag name from the join, otherwise try a case-insensitive search
    COALESCE(tags."Tag", (SELECT "Tag" FROM "KorpusDB_tbl_tags" WHERE LOWER(parsed_tag) = LOWER("Tag"))) as tag,
    --  same as above, but with tag ids.
    COALESCE(tags.id, (SELECT id FROM "KorpusDB_tbl_tags" WHERE LOWER(parsed_tag) = LOWER("Tag"))) as tag_id,
    --  which event?
    event_id_id,
    tags."Generation" as generation,
    tagebene."id_TagEbene_id" as first_tag_tag_ebene,
    tagebene2."Name" as parsed_tag_ebene,
    tagebene2.id as parsed_tag_ebene_id,
    tier_id_id,
    -- delete the tier event once we have resolved the tags, otherwise leave it.
    tier_event_id,
    text,
    --  first and last token of event
    (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung ASC LIMIT 1) as first_token,
    (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung DESC LIMIT 1) as last_token,
    tag_set_index,
    --  amount of tokens in the event
    (SELECT count(*) FROM token WHERE event_id_id = t.event_id_id) as count_tokens
  FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (ORDER BY event_id_id) as tag_set_index,
      --  split definitions into tags
      TRIM((regexp_split_to_table(REPLACE(REPLACE(text, '[', ''), ']', ''), E'\, '))) AS parsed_tag
    FROM (
      SELECT
        --  split rows into definitons
        TRIM((regexp_split_to_table(text, E'\\]\,? \\['))) as text,
        event_id_id,
        tier_id_id,
        event_tier.id AS tier_event_id
      FROM event_tier
      JOIN tier
        ON tier.id = event_tier.tier_id_id
      WHERE tier.tier_name = 'msyn'
        AND text != ''
    ) AS innerSelectTag
  ) as t
  LEFT OUTER JOIN "KorpusDB_tbl_tags" AS tags
    ON "Tag" = parsed_tag
  LEFT JOIN "KorpusDB_tbl_tagebenezutag" AS tagebene
    ON "id_Tag_id" = tags.id
  LEFT JOIN "KorpusDB_tbl_tagebene" AS tagebene2
    ON tagebene2."Name" = parsed_tag
  )
--TODO :https://stackoverflow.com/questions/41595018/postgresql-insert-data-into-multiple-tables-simultaneously
```
