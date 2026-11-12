-- El tipo de tarjeta se guardaba como texto.
--
-- Motivo: `cards.kind` es un enum (`public.card_kind`) y la función declaraba
-- la columna del registro como `text`. Postgres no hace esa conversion solo:
-- al asignar, se quejaba con "column \"kind\" is of type public.card_kind but
-- expression is of type text". O sea, guardar las tarjetas de un mazo fallaba
-- siempre, tanto desde el boton de "Guardar los cambios" del editor como desde
-- la edicion masiva con JSON.
--
-- Aqui el tipo se convierte de forma explicita, y antes de escribir nada se
-- comprueba que los tipos que llegan existan: un tipo desconocido es un error
-- de quien escribio el JSON, no de la base, y merece su propio codigo.

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
  end;

  -- `is_deck_editable` es la misma comprobación que hacía RLS en cada UPDATE
  -- suelto. Aquí se hace una vez, antes de tocar nada: además de ser más barata
  -- que repetirse por tarjeta, garantiza que no se escriban unas sí y otras no.
  if not public.is_deck_editable(p_deck_id) then
    raise exception 'Ese mazo no se puede editar'
      using errcode = '42501';
  end;

  if p_cards is null or jsonb_typeof(p_cards) <> 'array' then
    raise exception 'La lista de tarjetas no tiene un formato válido'
      using errcode = '22023';
  end;

  -- El tipo de tarjeta tiene que existir. Se comprueba con el texto que llega,
  -- antes de escribir, para que el error sea el de la regla y no el que suelta
  -- el conversion del enum.
  if exists (
    select 1
    from jsonb_to_recordset(p_cards) as r (card_id uuid, kind text)
    where r.kind is not null
      and not (
        r.kind = any (pg_catalog.enum_range(null::public.card_kind)::text[])
      )
  ) then
    raise exception 'Ese tipo de tarjeta no existe'
      using errcode = '22023';
  end;

  -- `card_id` se compara con el mazo en la misma sentencia: aunque el id venga
  -- manipulado desde el navegador, no alcanza para tocar una tarjeta ajena.
  update public.cards c
  set
    -- `kind` y `tags` no admiten nulo en la tabla, y en el JSON pueden
    -- faltar: se dejan con los mismos valores por defecto que tiene la
    -- columna, para que un dato que no viene no sea un fallo entero.
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
