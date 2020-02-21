# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

```SQL
WITH parsed_tags as (
  -- TODO: DOES THIS OUTER QUERY MAKE IT TOO SLOW?
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY tag_set_index ORDER BY i) as tag_order
  FROM (
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
  --    tagebene."id_TagEbene_id" as first_tag_tag_ebene,
  --    tagebene2."Name" as parsed_tag_ebene,
  --    tagebene2.id as parsed_tag_ebene_id,
      tier_id_id,
      inf_id,
      ROW_NUMBER() OVER () as i,
      -- delete the tier event once we have resolved the tags, otherwise leave it.
      tier_event_id,
      text,
      --  first and last token of event
      (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung ASC LIMIT 1) as first_token,
      (SELECT token.id FROM token WHERE event_id_id = t.event_id_id ORDER BY token_reihung DESC LIMIT 1) as last_token,
      (SELECT id FROM "KorpusDB_tbl_tagebene" WHERE LOWER("Name") = LOWER(substring(text, E'\\[?(\\w+)\\]?'))) as tag_ebene,
      substring(text, E'\\[?(\\w+)\\]?') as parsed_tag_ebene,
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
  ) as s
)
-- HERE COME THE INSERTS:
--,
--tokensets as (
--  INSERT INTO tokenset(id_von_token_id, id_bis_token_id) (
--    SELECT DISTINCT ON (tag_set_index)
--      first_token,
--      last_token
--    FROM parsed_tags
--    WHERE first_token != last_token
--  )
--  returning  id, id_von_token_id, id_bis_token_id
--)
--,
--antworten as (
--  INSERT INTO "KorpusDB_tbl_antworten"(
--    "von_Inf_id",
--    "Kommentar",
--    "Reihung",
--    ist_gewaehlt,
--    ist_nat,
--    ist_bfl,
--    kontrolliert,
--    veroeffentlichung,
--    ist_token_id,
--    ist_tokenset_id
--   ) (
--    SELECT DISTINCT ON (tag_set_index)
--      inf_id,
--      '[IMPORTED]',
--      answer_order,
--      false,
--      true,
--      false,
--      false,
--      false,
--      CASE WHEN first_token = last_token THEN first_token ELSE NULL END,
--      CASE WHEN first_token != last_token THEN (
--        SELECT id
--          FROM tokenset
--          WHERE id_von_token_id = first_token
--          AND id_bis_token_id = last_token
--          LIMIT 1
--      ) ELSE NULL END
--    FROM parsed_tags
--  )
--  RETURNING 1
--)
,
antworttags as (
  INSERT INTO "KorpusDB_tbl_antwortentags"(
    "Reihung",
    "id_Antwort_id",
    "id_Tag_id",
    "id_TagEbene_id"
  ) (
    SELECT * FROM (
      SELECT
        tag_order,
        (
          SELECT id
           FROM "KorpusDB_tbl_antworten"
           WHERE (
             ist_token_id = first_token
             OR (select id from tokenset where id_von_token_id = first_token and id_bis_token_id = last_token LIMIT 1) = ist_tokenset_id
           ) AND "Reihung" = answer_order
          LIMIT 1
        ) as answer_id,
        tag_id,
        tag_ebene
      FROM parsed_tags
      WHERE tag_id IS NOT NULL
      AND tag_ebene is not null
    ) ins
    WHERE answer_id IS NOT NULl
  ) returning *
)
-- END:
SELECT 1;
```
