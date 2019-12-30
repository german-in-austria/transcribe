
# Produce Explorators as Informers

```SQL
-- create informanten
insert into "PersonenDB_tbl_informanten" (inf_sigle, id_person_id, pretest)
select 'EXP'||id, id_person_id, false from "PersonenDB_tbl_mitarbeiter";


-- add explorators to erhabung as informanten
insert into "KorpusDB_tbl_inf_zu_erhebung" ("ID_Inf_id", id_inferhebung_id)
  select
--    i."Explorator_id" as mitarbeiter_person_id,
    inf.id as "ID_Inf_id",
--    inf.inf_sigle as informant_sigle,
    i.id as id_inferhebung_id
  from "KorpusDB_tbl_inferhebung" i
  join "PersonenDB_tbl_mitarbeiter" m
    on m.id = i."Explorator_id"
  join "PersonenDB_tbl_informanten" inf
    on inf.id_person_id = m.id_person_id;
--;

select id, "Explorator_id" from "KorpusDB_tbl_inferhebung"
```
