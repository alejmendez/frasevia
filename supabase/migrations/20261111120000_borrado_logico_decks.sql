-- ---------------------------------------------------------------------------
-- Borrado lógico de mazos: la papelera
--
-- Antes, un mazo se borraba de verdad: se iban el mazo, sus tarjetas y todo el
-- progreso de estudio, sin vuelta atrás. La única forma de recuperar algo era
-- no haberlo borrado, y la decisión la tomaba un botón de la interfaz.
--
-- Ahora el mazo se marca con `deleted_at` y sale de la biblioteca y del
-- catálogo, pero sigue en la base para que quien lo creó pueda devolverlo. Las
-- dos operaciones —mandar a la papelera y sacar de ella— son funciones de la
-- base: el cliente pide, la base decide, y si el mazo no es tuyo lo dice con
-- su error de siempre en vez de borrarlo en silencio.
--
-- El borrado definitivo sigue existiendo, pero solo desde la papelera y solo
-- para el dueño: la política `decks_delete_own` no ha cambiado.
-- ---------------------------------------------------------------------------

begin;

alter table public.decks
  add column if not exists deleted_at timestamptz;

comment on column public.decks.deleted_at is
  'Momento en que el mazo se mandó a la papelera. Null significa que sigue vivo.';

-- La papelera se consulta siempre por dueño y por fecha de borrado, y son pocas
-- filas: un índice parcial no crece con los mazos vivos.
create index if not exists decks_trashed_idx
  on public.decks (author_id, deleted_at desc)
  where deleted_at is not null;

-- ---------------------------------------------------------------------------
-- Visibilidad: un mazo en la papelera no se ve
--
-- `is_deck_visible` decide qué tarjetas se pueden leer, así que un mazo en la
-- papelera tampoco expone las suyas. `is_deck_editable` deja de editar un mazo
-- que está en la papelera: primero se restaura, después se toca.
-- ---------------------------------------------------------------------------

create or replace function public.is_deck_visible(p_deck_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.decks d
    where d.id = p_deck_id
      and d.deleted_at is null
      and (d.visibility = 'public' or d.author_id = (select auth.uid()))
  );
$$;

create or replace function public.is_deck_editable(p_deck_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.decks d
    where d.id = p_deck_id
      and d.deleted_at is null
      and d.author_id = (select auth.uid())
      and not d.is_official
  );
$$;

-- ---------------------------------------------------------------------------
-- Políticas
--
-- Al leer, el dueño sigue viendo sus mazos aunque estén en la papelera: es lo
-- que permite(listarlos y restaurarlos). Los demás solo ven los públicos que
-- no están borrados.
-- ---------------------------------------------------------------------------

drop policy if exists decks_select_visible on public.decks;
create policy decks_select_visible on public.decks
  for select
  using (
    (visibility = 'public' and deleted_at is null)
    or author_id = (select auth.uid())
  );

-- Editar un mazo en la papelera no tiene sentido: se restaura primero. Por eso
-- el `deleted_at is null` también está en el `with check`: sin él, un update
-- podría devolver a la vida un mazo sin pasar por la función de restauración.
drop policy if exists decks_update_own on public.decks;
create policy decks_update_own on public.decks
  for update
  using (
    author_id = (select auth.uid())
    and not is_official
    and deleted_at is null
  )
  with check (
    author_id = (select auth.uid())
    and not is_official
    and deleted_at is null
  );

-- `decks_delete_own` no se toca: el borrado definitivo sigue siendo solo del
-- dueño y nunca de un mazo oficial.

-- ---------------------------------------------------------------------------
-- RPC: mandar un mazo a la papelera
--
-- Es SECURITY DEFINER porque tiene que escribir la columna que las políticas
-- ya no dejan escribir. A cambio, comprueba ella misma que el mazo es de quien
-- llama: es la regla de negocio del borrado, y por eso vive en la base y no en
-- el botón.
-- ---------------------------------------------------------------------------

create or replace function public.trash_deck(p_deck_id uuid)
returns public.decks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deck public.decks;
begin
  select d.* into v_deck
    from public.decks d
    where d.id = p_deck_id
      and d.author_id = (select auth.uid())
      and not d.is_official
    for update;

  if not found then
    raise exception 'Ese mazo no es tuyo o no existe'
      using errcode = '42501';
  end if;

  -- Mandar a la papelera dos veces no es un error: la papelera no distingue
  -- entre un mazo que se borró ahora y uno que ya estaba ahí.
  if v_deck.deleted_at is not null then
    return v_deck;
  end if;

  update public.decks
     set deleted_at = now()
   where id = p_deck_id
  returning * into v_deck;

  return v_deck;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: devolver un mazo de la papelera
--
-- El mazo vuelve tal cual estaba: las tarjetas y el progreso nunca se tocaron,
-- por eso el borrado lógico no hace falta guardar nada más.
-- ---------------------------------------------------------------------------

create or replace function public.restore_deck(p_deck_id uuid)
returns public.decks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deck public.decks;
begin
  select d.* into v_deck
    from public.decks d
    where d.id = p_deck_id
      and d.author_id = (select auth.uid())
      and not d.is_official
    for update;

  if not found then
    raise exception 'Ese mazo no es tuyo o no existe'
      using errcode = '42501';
  end if;

  update public.decks
     set deleted_at = null
   where id = p_deck_id
  returning * into v_deck;

  return v_deck;
end;
$$;

revoke all on function public.trash_deck(uuid) from public;
revoke all on function public.restore_deck(uuid) from public;
grant execute on function public.trash_deck(uuid) to authenticated;
grant execute on function public.restore_deck(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Copiar un mazo
--
-- Se reemplaza entero para cambiarle una línea: un mazo en la papelera no se
-- puede copiar. Si no, quien lo borró podría seguir sacando su contenido a la
-- biblioteca desde un identificador que ya no aparece en ninguna parte.
-- ---------------------------------------------------------------------------

create or replace function public.copy_deck(p_source_deck_id uuid)
returns public.decks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_source public.decks;
  v_copy public.decks;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para copiar un mazo'
      using errcode = '42501';
  end if;

  select * into v_source
    from public.decks d
    where d.id = p_source_deck_id and d.deleted_at is null;
  if not found then
    raise exception 'El mazo que intentas copiar no existe'
      using errcode = 'P0002';
  end if;

  if v_source.author_id = v_uid then
    raise exception 'Este mazo ya está en tu biblioteca'
      using errcode = '22023';
  end if;

  if v_source.visibility <> 'public' then
    raise exception 'Solo puedes copiar mazos públicos'
      using errcode = '42501';
  end if;

  insert into public.decks (
    author_id, title, slug, description, source_language, target_language,
    level, visibility, is_official, source_deck_id, study_mode
  )
  values (
    v_uid, v_source.title || ' (copia)', '', v_source.description,
    v_source.source_language, v_source.target_language, v_source.level,
    'private', false, v_source.id, v_source.study_mode
  )
  returning * into v_copy;

  insert into public.cards (
    deck_id, kind, term, meaning_es, example_en, example_es, usage_note,
    tags, position
  )
  select
    v_copy.id, c.kind, c.term, c.meaning_es, c.example_en, c.example_es,
    c.usage_note, c.tags, c.position
  from public.cards c
  where c.deck_id = v_source.id
  order by c.position, c.created_at;

  return v_copy;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vistas: los mazos en la papelera no cuentan
--
-- Sin esto, un mazo borrado seguiría apareciendo en el progreso, en la agenda
-- de repasos y en la cola global, con sus fichas Ancient pending de repaso.
-- ---------------------------------------------------------------------------

create or replace view public.my_deck_progress
with (security_invoker = on)
as
  select
    d.id as deck_id,
    count(*) filter (where p.state = 'new')::integer as new_count,
    count(*) filter (where p.state = 'learning')::integer as learning_count,
    count(*) filter (where p.state = 'mastered')::integer as mastered_count,
    count(p.card_id)::integer as studied_count,
    max(p.last_studied_at) as last_studied_at
  from public.user_card_progress p
  join public.cards c on c.id = p.card_id
  join public.decks d on d.id = c.deck_id
  where p.user_id = (select auth.uid())
    and d.deleted_at is null
  group by d.id;

create or replace view public.my_progress_detail
with (security_invoker = on)
as
  select
    p.card_id,
    p.state,
    p.attempts,
    p.correct_count,
    p.last_studied_at,
    p.updated_at,
    c.term,
    c.meaning_es,
    c.deck_id,
    d.title as deck_title,
    d.slug as deck_slug
  from public.user_card_progress p
  join public.cards c on c.id = p.card_id
  join public.decks d on d.id = c.deck_id
  where p.user_id = (select auth.uid())
    and d.deleted_at is null;

create or replace view public.my_deck_review_summary
with (security_invoker = on)
as
  select
    d.id as deck_id,
    count(c.id) filter (where s.card_id is null)::integer as new_count,
    count(c.id) filter (
      where s.card_id is not null and not s.retired
        and s.next_review_at <= statement_timestamp()
    )::integer as due_count,
    count(c.id) filter (
      where s.card_id is not null and not s.retired
        and s.next_review_at > statement_timestamp()
    )::integer as scheduled_count,
    count(c.id) filter (where s.card_id is not null and s.retired)::integer as retired_count,
    min(s.next_review_at) filter (where s.card_id is not null and not s.retired) as next_review_at,
    max(s.last_reviewed_at) as last_reviewed_at
  from public.decks d
  left join public.cards c on c.deck_id = d.id
  left join public.user_card_review_state s
    on s.card_id = c.id
    and s.user_id = (select auth.uid())
    and s.direction = d.source_language || '-' || d.target_language
  where d.author_id = (select auth.uid())
    and d.deleted_at is null
  group by d.id;

create or replace view public.my_review_queue
with (security_invoker = on)
as
  select
    s.card_id,
    s.direction,
    s.next_review_at,
    s.review_count,
    s.last_level_id,
    c.deck_id,
    c.kind,
    c.term,
    c.meaning_es,
    c.example_en,
    c.example_es,
    c.usage_note,
    d.title as deck_title,
    d.source_language,
    d.target_language
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and not s.retired
    and s.next_review_at <= statement_timestamp()
    and d.deleted_at is null
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
  order by s.next_review_at asc;

create or replace view public.my_retired_review_cards
with (security_invoker = on)
as
  select
    s.card_id,
    s.direction,
    s.last_reviewed_at,
    s.review_count,
    c.term,
    c.meaning_es,
    d.id as deck_id,
    d.title as deck_title,
    d.slug as deck_slug,
    d.visibility as deck_visibility
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and s.retired
    and d.deleted_at is null
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
  order by s.last_reviewed_at desc;

create or replace view public.my_review_schedule
with (security_invoker = on)
as
  select
    s.card_id,
    s.direction,
    s.next_review_at,
    c.deck_id,
    d.title as deck_title
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and not s.retired
    and s.next_review_at is not null
    and s.next_review_at > statement_timestamp()
    and d.deleted_at is null
    and (d.visibility = 'public' or d.author_id = (select auth.uid()));

commit;
