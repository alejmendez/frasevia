-- El tipo de tarjeta se guardaba como texto y la base lo rechazaba.
--
-- Motivo: cards.kind es un enum y la funcion declaraba la columna del registro
-- como text, asi que Postgres no la podia asignar. Guardar las tarjetas de un
-- mazo fallaba siempre: con el boton de guardar del editor y con la edicion
-- masiva con JSON.
--
-- Aqui el tipo se convierte de forma explicita y, antes de escribir nada, se
-- comprueba que los tipos que llegan existan: un tipo desconocido es un error
-- de quien escribio el JSON, no de la base, y tiene su propio codigo.

begin;

create or replace function public.update_deck_cards(
  p_deck_id uuid,
  p_cards jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para guardar tarjetas'
      using errcode = '42501';
  end if;

  if not public.is_deck_editable(p_deck_id) then
    raise exception 'Ese mazo no se puede editar'
      using errcode = '42501';
  end if;

  if p_cards is null or jsonb_typeof(p_cards) <> 'array' then
    raise exception 'La lista de tarjetas no tiene un formato válido'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_cards) as r (card_id uuid, kind text)
    where r.kind is not null
      and r.kind not in (
        select e::text
        from pg_catalog.unnest(pg_catalog.enum_range(null::public.card_kind)) e
      )
  ) then
    raise exception 'Ese tipo de tarjeta no existe'
      using errcode = '22023';
  end if;

  update public.cards c
  set
    kind = coalesce(r.kind::public.card_kind, 'word'),
    term = r.term,
    meaning_es = r.meaning_es,
    example_en = r.example_en,
    example_es = r.example_es,
    usage_note = r.usage_note,
    tags = coalesce(r.tags, '{}'::text[])
  from jsonb_to_recordset(p_cards) as r (
    card_id uuid,
    kind text,
    term text,
    meaning_es text,
    example_en text,
    example_es text,
    usage_note text,
    tags text[]
  )
  where c.id = r.card_id
    and c.deck_id = p_deck_id;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.update_deck_cards(uuid, jsonb) from public;
grant execute on function public.update_deck_cards(uuid, jsonb) to authenticated;

commit;
