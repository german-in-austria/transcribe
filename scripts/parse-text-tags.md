# Parsing textual tokens, and inserting them into the database

if we can find all the required information, we can convert textual tags to database annotations.

TODO: delete tags that have been converted.

```SQL
-- Table Definition ----------------------------------------------

CREATE TABLE event_tier (
    id SERIAL PRIMARY KEY,
    text character varying(511),
    "ID_Inf_id" integer REFERENCES "PersonenDB_tbl_informanten"(id) DEFERRABLE INITIALLY DEFERRED,
    event_id_id integer,
    tier_id_id integer REFERENCES tier(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    imported integer
);

CREATE TABLE import.tag_translation_phon (
    id SERIAL PRIMARY KEY,
    oldtag character varying(511),
    newtagset character varying(511)
);

CREATE TABLE import.tag_translation_msyn (
    id SERIAL PRIMARY KEY,
    oldtag character varying(511),
    newtagset character varying(511)
);

-- find the duplicates through event_tier? answer: nope
--SELECT *
--FROM (
--  SELECT
--    array_agg(DISTINCT event.id) as events,
--    array_agg(event_tier.text),
--    array_agg(event_tier."ID_Inf_id"),
--    array_agg(DISTINCT transcript.name),
--    start_time,
--    tier.transcript_id_id
--  FROM event
--  JOIN event_tier
--    ON event_id_id = event.id
--  JOIN tier
--    ON tier.id = event_tier.tier_id_id
--  JOIN transcript
--    ON tier.transcript_id_id = transcript.id
--  GROUP BY (start_time, end_time, tier.transcript_id_id)
--) f
--WHERE array_length(f.events, 1) > 1
--;

-- merge old event_tier into current event_tier
CREATE UNIQUE INDEX "tier_constraint" ON "public"."event_tier"("ID_Inf_id","event_id_id","tier_id_id");
INSERT INTO event_tier (
  id,
  text,
  "ID_Inf_id",
  event_id_id,
  tier_id_id
) (
  SELECT id, text, "ID_Inf_id", event_id_id, tier_id_id FROM event_tier
) ON CONFLICT DO NOTHING;
DROP INDEX "public"."tier_constraint";

-- to double-check:
select id
from event_tier
except
select id
from event_tier;

-- to fix the duplicate event (speaker_event) situation by combining them
WITH overlapping_events as (
  SELECT
    unnest(events) as event_id,
    *
  FROM (
    SELECT
      array_agg(DISTINCT event.id) as events,
      array_agg(DISTINCT token."ID_Inf_id") as token_infs,
      start_time,
      end_time,
      transcript_id_id
    FROM event
    JOIN token
      ON token.event_id_id = event.id
    GROUP BY (start_time, end_time, token.transcript_id_id)
  ) f
  WHERE array_length(f.events, 1) > 1
),
updated_tokens as (
  UPDATE token
  SET event_id_id = s.correct_event_id
  FROM (
    SELECT
      event_id as old_event_id,
      (events)[1] as correct_event_id
    FROM overlapping_events
    WHERE event_id != (events)[1]
  ) s
  WHERE token.event_id_id = old_event_id
  RETURNING *
),
updated_event_tiers as (
  UPDATE event_tier
  SET event_id_id = a.correct_event_id
  FROM (
    SELECT
      event_id as old_event_id,
      (events)[1] as correct_event_id
    FROM overlapping_events
    WHERE event_id != (events)[1]
  ) a
  WHERE event_tier.event_id_id = old_event_id
)
select * from updated_tokens;


-- delete old imported answers and answer tags and tokensets
WITH imported_answers AS (
  SELECT *
    FROM "KorpusDB_tbl_antworten"
   WHERE "Kommentar" = '[IMPORTED]'
),
deleted_tokensets as (
  DELETE FROM tokenset
  WHERE id IN (SELECT ist_tokenset_id FROM imported_answers WHERE ist_tokenset_id IS NOT NULL)
),
deleted_tags as (
  DELETE FROM "KorpusDB_tbl_antwortentags"
  WHERE "id_Antwort_id" IN (SELECT id FROM imported_answers)
),
deleted_answers as (
  DELETE FROM "KorpusDB_tbl_antworten"
  WHERE id IN (SELECT id FROM imported_answers)
)
SELECT 1;

-- translate the msyn tags in-place (in event_tiers)
UPDATE event_tier
SET text = tags
FROM (
  SELECT
    newtagset as tags,
    oldtag,
    tier_event_id,
    g.inf_id
  FROM (
    SELECT * FROM (
      SELECT
        text,
        event_id_id,
        tier_id_id,
        event_tier.id AS tier_event_id,
        "ID_Inf_id" as inf_id
      FROM event_tier
      JOIN tier ti
        ON ti.id = event_tier.tier_id_id
      WHERE ti.tier_name = 'msyn'
        AND TRIM(text) != ''
    ) t
    JOIN import.tag_translation_msyn
      ON LOWER(TRIM(text)) = LOWER(TRIM(oldtag))
    WHERE TRIM(text) != ''
    AND newtagset != text
  ) g
) f
WHERE event_tier.id = f.tier_event_id
  AND event_tier."ID_Inf_id" = f.inf_id
RETURNING *;

-- translate the phon.anno tags in-place (in event_tiers)
UPDATE event_tier
SET text = tags
FROM (
  SELECT
    STRING_AGG(g.newtagset, ', ') as tags,
    tier_event_id,
    g.inf_id
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
    JOIN import.tag_translation_phon
      ON LOWER(TRIM(text)) = LOWER(TRIM(oldtag))
    WHERE TRIM(text) != ''
    AND newtagset != text
  ) g
  GROUP BY (tier_event_id, g.inf_id)
) f
WHERE event_tier.id = f.tier_event_id
  AND event_tier."ID_Inf_id" = f.inf_id;

-- find event tiers that don’t start with "[",
-- i. e. they could not be converted
SELECT *
FROM event_tier
JOIN tier
  ON tier.id = event_tier.tier_id_id
WHERE (tier.tier_name = 'phon.anno'
   OR tier.tier_name = 'phon_anno'
   OR tier.tier_name = 'msyn'
   )
  AND text not like '[%'
  AND TRIM(text) != '';

-- find duplicate tokensets
select id_bis_token_id, id_von_token_id, count(*), string_agg("KorpusDB_tbl_antworten"."Kommentar", '')
from tokenset
join "KorpusDB_tbl_antworten"
  on tokenset.id = ist_tokenset_id
group by id_bis_token_id, id_von_token_id
HAVING count(*) > 1;

-- find orphaned tokensets
SELECT *
FROM tokenset
WHERE (id IN (SELECT ist_tokenset_id from "KorpusDB_tbl_antworten") IS NULL );

-- do the actual work
WITH parsed_tags as (
  SELECT * FROM (
    SELECT *,
      COALESCE(
        -- get "tag_ebene" by first tag_id
        (
          SELECT "id_TagEbene_id"
          FROM "KorpusDB_tbl_tagebenezutag"
          -- postgres arrays start at 1 instead of 0
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
        -- get first token id
        (
          SELECT token.id
            FROM token
           WHERE event_id_id = innerSelectTag.event_id_id
             AND token."ID_Inf_id" = innerSelectTag.inf_id
             AND token.token_type_id_id != 2
             AND token.token_type_id_id != 3
        ORDER BY token_reihung ASC
           LIMIT 1
        ) as first_token,
        -- get last token id
        (
          SELECT token.id
            FROM token
           WHERE event_id_id = innerSelectTag.event_id_id
             AND token."ID_Inf_id" = innerSelectTag.inf_id
             AND token.token_type_id_id != 2
             AND token.token_type_id_id != 3
        ORDER BY token_reihung DESC
           LIMIT 1
        ) as last_token,
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
              tier.tier_name = 'phon.anno' OR tier.tier_name = 'phon_anno'
            OR
              tier.tier_name = 'msyn'
          )
          AND text != ''
      ) AS innerSelectTag
    ) AS f
  ) AS b
  -- get only the tagsets that have no NULLs (no unparsable tags) in the array.
  WHERE array_length(array_remove(parsed_tag, NULL), 1) = array_length(parsed_tag, 1)
--  WHERE array_length(array_remove(parsed_tag, NULL), 1) != array_length(parsed_tag, 1)
--  OR tag_ebene IS NULL
  -- and the ones where we could identify a "tag_ebene"
    AND tag_ebene is not null
)
-- HERE COME THE UPSERTS AND INSERTS:
--,
--tokensets as (
--  INSERT INTO tokenset(id_von_token_id, id_bis_token_id) (
--    SELECT DISTINCT ON (first_token, last_token)
--      first_token,
--      last_token
--    FROM parsed_tags
--    WHERE first_token != last_token
--      AND NOT EXISTS (
--        SELECT id
--        FROM tokenset
--        WHERE id_von_token_id = first_token
--          AND id_bis_token_id = last_token
--      )
--  )
--  returning  id, id_von_token_id, id_bis_token_id
--)
,
antworten as (
  INSERT INTO "KorpusDB_tbl_antworten"(
    "von_Inf_id",
    "Kommentar",
    "Reihung",
    ist_gewaehlt,
    ist_nat,
    ist_bfl,
    kontrolliert,
    veroeffentlichung,
    ist_token_id,
    ist_tokenset_id
   ) (
    SELECT DISTINCT ON (tag_set_index)
      inf_id,
      '[IMPORTED]',
      answer_order,
      false,
      true,
      false,
      false,
      false,
      CASE WHEN first_token = last_token THEN first_token ELSE NULL END,
      CASE WHEN first_token != last_token THEN (
        SELECT id
          FROM tokenset
          WHERE id_von_token_id = first_token
          AND id_bis_token_id = last_token
          LIMIT 1
      ) ELSE NULL END
    FROM parsed_tags
  )
  RETURNING 1
)
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
--marked_imported as (
--  UPDATE event_tier
--  SET imported = 1
--  WHERE event_tier.id IN (
--    SELECT tier_event_id FROM parsed_tags
--  )
--)
SELECT 1
--SELECT
--  transcript.name as transkript,
--  token.ortho as ortho_token,
--  event.start_time,
--  "PersonenDB_tbl_informanten".inf_sigle,
--  parsed_tags.text,
--  parsed_tags.parsed_tag,
--  "KorpusDB_tbl_tagebene"."Name" as tag_ebene
--  FROM parsed_tags
--  LEFT JOIN "KorpusDB_tbl_tagebene"
--    on "KorpusDB_tbl_tagebene".id = parsed_tags.tag_ebene
--  LEFT JOIN token
--    on token.id = parsed_tags.first_token
--  join transcript
--    on token.transcript_id_id = transcript.id
--  LEFT join event
--    on event.id = parsed_tags.event_id_id
--  LEFT join "PersonenDB_tbl_informanten"
--    on parsed_tags.inf_id = "PersonenDB_tbl_informanten".id
--  ORDER BY (transcript.name, event.start_time)
;

```
