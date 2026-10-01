-- ===========================================================================
-- Frasevia — esquema inicial, Row Level Security y funciones seguras.
--
-- Todas las reglas de acceso viven acá, no en los componentes: la aplicación
-- usa la clave publicable (anon), así que la base de datos es la única que
-- decide qué puede ver o modificar cada persona.
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.deck_visibility as enum ('private', 'public');
create type public.card_kind as enum ('word', 'phrase', 'question', 'rule');
create type public.progress_state as enum ('new', 'learning', 'mastered');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.decks (
  id uuid primary key default gen_random_uuid(),
  -- Los mazos oficiales no tienen autor: por eso el campo admite null.
  author_id uuid references auth.users (id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null default '',
  source_language text not null default 'es',
  target_language text not null default 'en',
  level text,
  visibility public.deck_visibility not null default 'private',
  is_official boolean not null default false,
  -- Guarda de qué mazo Copió esta persona este mazo (si se copió).
  source_deck_id uuid references public.decks (id) on delete set null,
  -- Mantenido por trigger para no contar tarjetas en cada listado.
  card_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint decks_title_length check (char_length(btrim(title)) between 1 and 120),
  -- Un mazo de usuario siempre tiene dueño; uno oficial nunca lo tiene.
  constraint decks_author_required check (is_official or author_id is not null),
  -- Un mazo oficial es siempre público y de solo lectura.
  constraint decks_official_is_public check (not is_official or visibility = 'public'),
  constraint decks_card_count_valid check (card_count >= 0)
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  kind public.card_kind not null default 'word',
  term text not null,
  meaning_es text not null,
  example_en text,
  example_es text,
  usage_note text,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cards_term_length check (char_length(btrim(term)) between 1 and 200),
  constraint cards_meaning_length check (char_length(btrim(meaning_es)) between 1 and 400)
);

create table public.user_card_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  state public.progress_state not null default 'new',
  attempts integer not null default 0,
  correct_count integer not null default 0,
  last_studied_at timestamptz,
  updated_at timestamptz not null default now(),

  primary key (user_id, card_id),
  constraint progress_attempts_valid check (attempts >= 0),
  constraint progress_correct_valid check (correct_count >= 0)
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index decks_public_idx
  on public.decks (created_at desc)
  where visibility = 'public';

create index decks_author_idx on public.decks (author_id, created_at desc);
create index decks_source_idx on public.decks (source_deck_id)
  where source_deck_id is not null;

create index cards_deck_position_idx
  on public.cards (deck_id, position, created_at);

create index user_card_progress_state_idx
  on public.user_card_progress (user_id, state);

create index user_card_progress_recent_idx
  on public.user_card_progress (user_id, last_studied_at desc)
  where last_studied_at is not null;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares de visibilidad
--
-- Son SECURITY DEFINER a propósito: consultan `decks` saltándose RLS y así la
-- política de `cards` no se llama recursivamente a sí misma. Mantienen el
-- search_path vacío y usan nombres calificados para evitar inyección de
-- objetos vía search_path.
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
      and d.author_id = (select auth.uid())
      and not d.is_official
  );
$$;

create or replace function public.is_card_visible(p_card_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cards c
    where c.id = p_card_id
      and public.is_deck_visible(c.deck_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.decks enable row level security;
alter table public.cards enable row level security;
alter table public.user_card_progress enable row level security;

-- Mazos: los públicos se leen sin iniciar sesión; el resto, solo por su autor.
create policy decks_select_visible on public.decks
  for select
  using (visibility = 'public' or author_id = (select auth.uid()));

create policy decks_insert_own on public.decks
  for insert
  with check (
    (select auth.uid()) is not null
    and author_id = (select auth.uid())
    and not is_official
  );

create policy decks_update_own on public.decks
  for update
  using (author_id = (select auth.uid()) and not is_official)
  with check (author_id = (select auth.uid()) and not is_official);

create policy decks_delete_own on public.decks
  for delete
  using (author_id = (select auth.uid()) and not is_official);

-- Tarjetas: se pueden leer solo si el mazo es visible para quien consulta.
create policy cards_select_visible on public.cards
  for select
  using (public.is_deck_visible(deck_id));

create policy cards_insert_own on public.cards
  for insert
  with check (public.is_deck_editable(deck_id));

create policy cards_update_own on public.cards
  for update
  using (public.is_deck_editable(deck_id))
  with check (public.is_deck_editable(deck_id));

create policy cards_delete_own on public.cards
  for delete
  using (public.is_deck_editable(deck_id));

-- Progreso: estrictamente privado y por tarjeta.
create policy progress_select_own on public.user_card_progress
  for select
  using (user_id = (select auth.uid()));

create policy progress_insert_own on public.user_card_progress
  for insert
  with check (
    user_id = (select auth.uid())
    and public.is_card_visible(card_id)
  );

create policy progress_update_own on public.user_card_progress
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_card_visible(card_id));

create policy progress_delete_own on public.user_card_progress
  for delete
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Vistas de resumen
--
-- `security_invoker` hace que las consultas dentro de la vista respeten el RLS
-- de las tablas base, así que cada persona solo ve su propio progreso.
-- ---------------------------------------------------------------------------

create view public.my_deck_progress
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
  group by d.id;

create view public.my_progress_detail
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
  where p.user_id = (select auth.uid());

-- ---------------------------------------------------------------------------
-- Triggers de mantenimiento
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger decks_touch_updated_at
  before update on public.decks
  for each row execute function public.touch_updated_at();

create trigger cards_touch_updated_at
  before update on public.cards
  for each row execute function public.touch_updated_at();

create trigger progress_touch_updated_at
  before update on public.user_card_progress
  for each row execute function public.touch_updated_at();

-- Genera un slug legible a partir del título cuando no viene informado.
create or replace function public.assign_deck_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_base text;
  v_candidate text;
  v_try integer := 0;
begin
  if new.slug is null or btrim(new.slug) = '' then
    -- `translate` quita las vocales acentuadas y la eñe antes de convertir el
    -- resto en guiones. La lista es idéntica a la de `slugPreview` en
    -- app/features/decks/slug.ts, para que la vista previa y la dirección real
    -- coincidan siempre.
    v_base := lower(
      regexp_replace(
        translate(
          btrim(new.title),
          'áàäâãéèëêíìïîóòöôõúùüûñç',
          'aaaaaeeeeiiiiooooouuuunc'
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      )
    );
    v_base := trim(both '-' from v_base);
    if v_base = '' then
      v_base := 'mazo';
    end if;

    v_candidate := v_base;
    while v_try < 50 and exists (
      select 1
      from public.decks d
      where d.slug = v_candidate
        and d.id is distinct from new.id
    )
    loop
      v_try := v_try + 1;
      v_candidate := v_base || '-' || v_try::text;
    end loop;

    if exists (
      select 1 from public.decks d
      where d.slug = v_candidate and d.id is distinct from new.id
    ) then
      -- Red de seguridad contra la condición de carrera sobre el índice único.
      v_candidate := v_base || '-' || substr(md5(random()::text), 1, 6);
    end if;

    new.slug := v_candidate;
  end if;

  return new;
end;
$$;

create trigger decks_assign_slug
  before insert on public.decks
  for each row execute function public.assign_deck_slug();

-- Mantiene `decks.card_count` al día sin que la aplicación lo calcule.
create or replace function public.refresh_deck_card_count_for(p_deck_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.decks
  set card_count = (
    select count(*)::integer from public.cards c where c.deck_id = p_deck_id
  )
  where id = p_deck_id;
$$;

create or replace function public.refresh_deck_card_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_deck_card_count_for(new.deck_id);
    return new;

  elsif tg_op = 'DELETE' then
    perform public.refresh_deck_card_count_for(old.deck_id);
    return old;

  else
    perform public.refresh_deck_card_count_for(old.deck_id);
    if new.deck_id is distinct from old.deck_id then
      perform public.refresh_deck_card_count_for(new.deck_id);
    end if;
    return new;
  end if;
end;
$$;

create trigger cards_refresh_count
  after insert or delete or update of deck_id on public.cards
  for each row execute function public.refresh_deck_card_count();

-- ---------------------------------------------------------------------------
-- RPC: copiar un mazo público a la biblioteca de la persona
--
-- Es SECURITY DEFINER (necesita escribir filas del mazo nuevo), así que valida
-- a mano todo lo queNormally haría RLS. La copia recibe identificadores nuevos:
-- editar la copia jamás toca el mazo de origen.
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

  select * into v_source from public.decks d where d.id = p_source_deck_id;
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
    level, visibility, is_official, source_deck_id
  )
  values (
    v_uid, v_source.title || ' (copia)', '', v_source.description,
    v_source.source_language, v_source.target_language, v_source.level,
    'private', false, v_source.id
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
-- RPC: registrar el resultado de una sesión de estudio
--
-- Recibe deltas (intentos y aciertos de ESTA sesión) y los acumula en la base,
-- de modo que dos sesiones simultáneas no se pisen. El estado se decide acá con
-- la misma regla que usa el cliente para el feedback optimista.
-- ---------------------------------------------------------------------------

create or replace function public.record_practice(p_results jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_saved integer := 0;
  -- `jsonb_array_elements` devuelve una sola columna `value`, así que la
  -- variable del bucle es un jsonb y no un record: con `record`, el operador
  -- `->>` no existiría.
  r jsonb;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para guardar tu progreso'
      using errcode = '42501';
  end if;

  if p_results is null or jsonb_typeof(p_results) <> 'array' then
    raise exception 'Formato de resultados inválido' using errcode = '22023';
  end if;

  for r in
    select value from jsonb_array_elements(p_results)
  loop
    if not public.is_card_visible((r ->> 'card_id')::uuid) then
      raise exception 'Una de las tarjetas no está disponible para ti'
        using errcode = '42501';
    end if;

    insert into public.user_card_progress as p (
      user_id, card_id, state, attempts, correct_count, last_studied_at
    )
    values (
      v_uid,
      (r ->> 'card_id')::uuid,
      -- La primera vez que se practica una tarjeta ya no está "nueva". Se
      -- aplica la misma regla que en el `on conflict` de abajo: hacen falta dos
      -- aciertos para "mastered", y sin ellos queda en "learning".
      case
        when greatest((r ->> 'correct_count')::integer, 0) >= 2
          then 'mastered'::public.progress_state
        else 'learning'::public.progress_state
      end,
      greatest((r ->> 'attempts')::integer, 0),
      greatest((r ->> 'correct_count')::integer, 0),
      now()
    )
    on conflict (user_id, card_id) do update
      set attempts = p.attempts + greatest((r ->> 'attempts')::integer, 0),
          correct_count = p.correct_count + greatest((r ->> 'correct_count')::integer, 0),
          -- Misma regla que `nextProgress` en app/features/study/engine.ts:
          -- hacen falta dos aciertos para "mastered", y un intento fallido
          -- devuelve la tarjeta a "learning" aunque ya estuviera aprendida.
          state = case
            when greatest((r ->> 'correct_count')::integer, 0) > 0
              and p.correct_count + greatest((r ->> 'correct_count')::integer, 0) >= 2
              then 'mastered'::public.progress_state
            else 'learning'::public.progress_state
          end,
          last_studied_at = now();

    v_saved := v_saved + 1;
  end loop;

  return v_saved;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permisos
--
-- Las funciones quedan restringidas a `authenticated`: un visitante no
-- necesita ejecutarlas y así no puede usarlas para sondear datos.
-- ---------------------------------------------------------------------------

revoke all on function public.copy_deck(uuid) from public;
revoke all on function public.record_practice(jsonb) from public;
grant execute on function public.copy_deck(uuid) to authenticated;
grant execute on function public.record_practice(jsonb) to authenticated;

grant select on public.decks to anon, authenticated;
grant select on public.cards to anon, authenticated;
grant insert, update, delete on public.decks to authenticated;
grant insert, update, delete on public.cards to authenticated;
grant select, insert, update, delete on public.user_card_progress to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select on public.my_deck_progress to authenticated;
grant select on public.my_progress_detail to authenticated;
