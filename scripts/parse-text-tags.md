# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

TODO: delete tags that have been converted.

```SQL
WITH parsed_tags as (
  SELECT * FROM (
    SELECT
      *,
      ROW_NUMBER() OVER (ORDER BY event_id_id) as tag_set_index,
      ROW_NUMBER() OVER (partition by event_id_id) as answer_order,
      (SELECT token.id FROM token WHERE event_id_id = innerSelectTag.event_id_id ORDER BY token_reihung ASC LIMIT 1) as first_token,
      (SELECT token.id FROM token WHERE event_id_id = innerSelectTag.event_id_id ORDER BY token_reihung DESC LIMIT 1) as last_token,
      (SELECT id FROM "KorpusDB_tbl_tagebene" WHERE LOWER("Name") = LOWER(substring(text, E'\\[?(\\w+)\\]?'))) as tag_ebene,
      --  split definitions into tags
      (
        SELECT ARRAY(
          SELECT (SELECT id FROM "KorpusDB_tbl_tags" WHERE LOWER(tag_name) = LOWER("Tag") LIMIT 1) as tag_id FROM (
            SELECT regexp_split_to_table(REPLACE(REPLACE(text, '[', ''), ']', ''), E'\, ') as tag_name
          ) as o
        )
      ) as parsed_tag
    FROM (
      SELECT
        --  split rows into definitons
        TRIM((regexp_split_to_table(text, E'\\]\,?\\s+\\['))) as text,
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
  ) as f
  WHERE array_length(array_remove(parsed_tag, NULL), 1) = array_length(parsed_tag, 1)
    AND tag_ebene is not null
)
--select *, unnest(parsed_tag) as tag_id from parsed_tags
-- HERE COME THE INSERTS:
--,
--tokensets as (
--  INSERT INTO tokenset(id_von_token_id, id_bis_token_id) (
--    SELECT DISTINCT ON (first_token, last_token)
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
    SELECT
      ROW_NUMBER() OVER (PARTITION BY answer_id ORDER BY i) as tag_order,
      answer_id,
      tag_id,
      tag_ebene
    FROM (
      SELECT
        ROW_NUMBER() OVER () as i,
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
      FROM (select *, unnest(parsed_tag) as tag_id from parsed_tags) w
    ) ins
    WHERE answer_id IS NOT NULl
  )
)

SELECT 1;
```
