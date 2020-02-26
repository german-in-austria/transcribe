# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

TODO: delete tags that have been converted.

```SQL

-- CONVERT idiosyncratic phonetic annotations to standard textual
-- e.g. "ei.1.D.P#_P" => "[eiVar, eiReal, ae-Diph, eiDiph, LautVor, P, MG, LautNach, P]"
UPDATE event_tier
SET text = tags
FROM (
  SELECT
    STRING_AGG(g.newtagset, ', ') as tags,
    tier_event_id
  FROM (
    SELECT * FROM (
      SELECT
        --  split rows into definitons
        TRIM((regexp_split_to_table(text, E'\,\\s?'))) as text,
        event_id_id,
        tier_id_id,
        event_tier.id AS tier_event_id,
        "ID_Inf_id" as inf_id
      FROM event_tier
      JOIN tier
        ON tier.id = event_tier.tier_id_id
      WHERE tier.tier_name = 'phon.anno'
         OR tier.tier_name = 'phon_anno'
        AND TRIM(text) != ''
    ) t
    JOIN import.tag_translation
      ON text = oldtag
    WHERE TRIM(text) != ''
    AND newtagset != text
  ) g
  GROUP BY tier_event_id
) f
WHERE event_tier.id = f.tier_event_id;


SELECT *
FROM event_tier
JOIN tier
  ON tier.id = event_tier.tier_id_id
WHERE (tier.tier_name = 'phon.anno'
   OR tier.tier_name = 'phon_anno')
  AND text not like '[%'
  AND TRIM(text) != '';


WITH parsed_tags as (
  SELECT * FROM (
    SELECT *,
      COALESCE(
        -- get "tag_ebene" by first tag_id
        (
          SELECT "id_TagEbene_id"
          FROM "KorpusDB_tbl_tagebenezutag"
          WHERE "id_Tag_id" = (parsed_tag)[1]
        ),
        -- if not found, get "tag_ebene" by lowercase first tag name
        (
          SELECT id
          FROM "KorpusDB_tbl_tagebene"
          WHERE LOWER("Name") = LOWER(substring(text, E'\\[?(\\w+)\\]?'))
        )
      ) as tag_ebene
    FROM (
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY event_id_id) as tag_set_index,
        ROW_NUMBER() OVER (partition by event_id_id) as answer_order,
        -- get first and last token ids
        (SELECT token.id FROM token WHERE event_id_id = innerSelectTag.event_id_id ORDER BY token_reihung ASC LIMIT 1) as first_token,
        (SELECT token.id FROM token WHERE event_id_id = innerSelectTag.event_id_id ORDER BY token_reihung DESC LIMIT 1) as last_token,
        -- split tag name string into tag id array => "parsed_tag"
        -- e.g. "[a, b, c]" => {1,2,3}
        (
          -- get as array
          SELECT ARRAY(
            -- get tag ids from tag names
            SELECT (SELECT id FROM "KorpusDB_tbl_tags" WHERE LOWER(tag_name) = LOWER("Tag") LIMIT 1) as tag_id FROM (
              -- get tag names as rows from the comma-separated list (string)
              SELECT regexp_split_to_table(REPLACE(REPLACE(text, '[', ''), ']', ''), E'\, ') as tag_name
            ) as o
          )
        ) as parsed_tag
      FROM (
        SELECT
          -- split list of tag lists (string) into tag list rows (string)
          -- e.g. "[a, b, c] [e, f, g]" => "[a, b, c]" and "[e, f, g]"
          TRIM((regexp_split_to_table(text, E'\\]\,?\\s+\\['))) as text,
          event_id_id,
          tier_id_id,
          event_tier.id AS tier_event_id,
          "ID_Inf_id" as inf_id
        FROM event_tier
        JOIN tier
          ON tier.id = event_tier.tier_id_id
        WHERE
          (
--            tier.tier_name = 'phon.anno'
--            OR tier.tier_name = 'phon_anno'
            tier.tier_name = 'msyn'
          )
          AND text != ''
      ) AS innerSelectTag
    ) AS f
  ) AS b
  -- get only the ones that have no NULLs in the array.
--  WHERE array_length(array_remove(parsed_tag, NULL), 1) = array_length(parsed_tag, 1)
  -- and the ones where we could identify a "tag_ebene"
--    AND tag_ebene is not null
)
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
--,
--antworttags as (
--  INSERT INTO "KorpusDB_tbl_antwortentags"(
--    "Reihung",
--    "id_Antwort_id",
--    "id_Tag_id",
--    "id_TagEbene_id"
--  ) (
--    SELECT
--      ROW_NUMBER() OVER (PARTITION BY answer_id ORDER BY i) as tag_order,
--      answer_id,
--      tag_id,
--      tag_ebene
--    FROM (
--      SELECT
--        ROW_NUMBER() OVER () as i,
--        (
--          SELECT id
--            FROM "KorpusDB_tbl_antworten"
--           WHERE (
--             ist_token_id = first_token
--             OR (SELECT id FROM tokenset WHERE id_von_token_id = first_token AND id_bis_token_id = last_token LIMIT 1) = ist_tokenset_id
--           ) AND "Reihung" = answer_order
--          LIMIT 1
--        ) as answer_id,
--        tag_id,
--        tag_ebene
--      FROM (select *, unnest(parsed_tag) as tag_id from parsed_tags) w
--    ) ins
--    WHERE answer_id IS NOT NULl
--  )
--)
--,
--deleted as (
--  DELETE FROM event_tier
--  WHERE event_tier.id IN (
--    SELECT tier_event_id FROM parsed_tags
--  )
--)
--SELECT 1
SELECT
  transcript.name as transkript,
  "PersonenDB_tbl_informanten".inf_sigle,
  parsed_tags.text,
  parsed_tags.parsed_tag,
  event.start_time,
  "KorpusDB_tbl_tagebene"."Name" as tag_ebene
  FROM parsed_tags
  LEFT JOIN "KorpusDB_tbl_tagebene"
    on "KorpusDB_tbl_tagebene".id = parsed_tags.tag_ebene
  LEFT JOIN token
    on token.id = parsed_tags.first_token
  join transcript
    on token.transcript_id_id = transcript.id
  LEFT join event
    on event.id = parsed_tags.event_id_id
  LEFT join "PersonenDB_tbl_informanten"
    on parsed_tags.inf_id = "PersonenDB_tbl_informanten".id
;
```
