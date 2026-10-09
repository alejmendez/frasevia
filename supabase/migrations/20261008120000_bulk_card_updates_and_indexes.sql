-- Guardado de tarjetas en una sola llamada, e índices para las consultas que se
-- repetían sin apoyo.
--
-- Motivo: el editor de mazos mandaba un UPDATE por tarjeta modificada, todas en
-- paralelo desde el navegador. Un mazo de 300 tarjetas eram 300 viajes de red, y
-- como cada uno va por su cuenta, un fallo a mitad dejaba el mazo guardado a
-- medias sin que nadie lo dijera. Aquí se resuelve en una sola sentencia: o se
-- guarda todo o no se guarda nada.
--
-- Los índices que se añaden corresponden a vistas que se piden enteras en cada
-- carga y que hasta ahora ordenaban la tabla del usuario en memoria.

begin;

-- ---------------------------------------------------------------------------
-- Guardado masivo de tarjetas de un mazo propio
-- ---------------------------------------------------------------------------

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

  -- `is_deck_editable` es la misma comprobación que hacía RLS en cada UPDATE
  -- suelto. Aquí se hace una vez, antes de tocar nada: además de ser más barata
  -- que repetirse por tarjeta, garantiza que no se escriban unas sí y otras no.
  if not public.is_deck_editable(p_deck_id) then
    raise exception 'Ese mazo no se puede editar'
      using errcode = '42501';
  end if;

  if p_cards is null or jsonb_typeof(p_cards) <> 'array' then
    raise exception 'La lista de tarjetas no tiene un formato válido'
      using errcode = '22023';
  end if;

  -- `card_id` se compara con el mazo en la misma sentencia: aunque el id venga
  -- manipulado desde el navegador, no alcanza para tocar una tarjeta ajena.
  update public.cards c
  set
    kind = r.kind,
    term = r.term,
    meaning_es = r.meaning_es,
    example_en = r.example_en,
    example_es = r.example_es,
    usage_note = r.usage_note,
    tags = r.tags
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

-- ---------------------------------------------------------------------------
-- Índices que faltaban
-- ---------------------------------------------------------------------------

-- `my_retired_review_cards` filtra por `retired = true` y ordena por
-- `last_reviewed_at desc`. El índice que existía era parcial con `not retired`,
-- así que no servía, y cada carga de /ajustes/repaso ordenaba la tabla entera
-- del usuario en memoria.
create index if not exists review_state_retired_idx
  on public.user_card_review_state (user_id, last_reviewed_at desc)
  where retired;

-- La búsqueda del catálogo filtra con `ilike '%texto%'` sobre título y
-- descripción, que es un comodín al principio: sin trigram no hay forma de que
-- un índice la ayude y Postgres lee todas las filas del catálogo.
create extension if not exists pg_trgm;

create index if not exists decks_title_trgm_idx
  on public.decks using gin (title gin_trgm_ops);

create index if not exists decks_description_trgm_idx
  on public.decks using gin (description gin_trgm_ops);

-- El catálogo ordena por `is_official desc, created_at desc` dentro de los mazos
-- públicos, y ninguna de las dos columnas estaba en ningún índice.
create index if not exists decks_public_catalog_idx
  on public.decks (is_official desc, created_at desc)
  where visibility = 'public';

commit;