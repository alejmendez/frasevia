-- Tipos de estudio. Los mazos existentes siguen siendo de idiomas.
-- Conservamos las columnas y el historial de tarjetas para evitar perder datos.
-- En repaso general, term es la pregunta, meaning_es la respuesta y example_en
-- el contexto. Los idiomas describen el contenido, no una traducción.

begin;

alter table public.decks
  add column study_mode text not null default 'language'
  constraint decks_study_mode_valid check (study_mode in ('language', 'general'));

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

create or replace function public.record_card_review(
  p_card_id uuid,
  p_direction text,
  p_level_id uuid,
  p_idempotency_key uuid,
  p_timezone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_level public.review_levels%rowtype;
  v_existing public.review_events%rowtype;
  v_state public.user_card_review_state%rowtype;
  v_now timestamptz := clock_timestamp();
  v_next timestamptz;
  v_inserted uuid;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Debes iniciar sesión para guardar el repaso' using errcode = '42501';
  end if;
  if p_idempotency_key is null or p_card_id is null or p_level_id is null
     or p_direction is null or char_length(p_direction) not between 3 and 24 then
    raise exception 'Datos del repaso inválidos' using errcode = '22023';
  end if;

  select * into v_existing
  from public.review_events
  where user_id = v_uid and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object(
      'event_id', v_existing.idempotency_key,
      'card_id', v_existing.card_id,
      'next_review_at', v_existing.next_review_at,
      'retired', v_existing.retired,
      'level_name', v_existing.level_name
    );
  end if;

  if not exists (
    select 1 from public.review_levels l
    where l.id = p_level_id and l.user_id = v_uid and l.active
  ) then
    raise exception 'El nivel de repaso no está disponible' using errcode = '42501';
  end if;
  if not public.is_card_visible(p_card_id) or not exists (
    select 1
    from public.cards c
    join public.decks d on d.id = c.deck_id
    where c.id = p_card_id
      and (
        (d.study_mode = 'general' and p_direction = 'general')
        or (d.study_mode = 'language' and p_direction in (
          d.source_language || '-' || d.target_language,
          d.target_language || '-' || d.source_language
        ))
      )
  ) then
    raise exception 'La ficha no está disponible para ti' using errcode = '42501';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'La zona horaria no es válida' using errcode = '22023';
  end if;

  select * into v_level
  from public.review_levels l
  where l.id = p_level_id and l.user_id = v_uid and l.active;

  if v_level.action = 'retire' then
    v_next := null;
  elsif v_level.interval_unit = 'days' then
    v_next := (
      (v_now at time zone p_timezone)
      + make_interval(days => v_level.interval_amount)
    ) at time zone p_timezone;
  elsif v_level.interval_unit = 'hours' then
    v_next := v_now + make_interval(hours => v_level.interval_amount);
  else
    v_next := v_now + make_interval(mins => v_level.interval_amount);
  end if;

  select * into v_state
  from public.user_card_review_state s
  where s.user_id = v_uid and s.card_id = p_card_id and s.direction = p_direction
  for update;

  insert into public.review_events (
    user_id, idempotency_key, card_id, direction, happened_at, level_id,
    level_name, action, interval_amount, interval_unit,
    previous_next_review_at, next_review_at, retired
  ) values (
    v_uid, p_idempotency_key, p_card_id, p_direction, v_now, v_level.id,
    v_level.name, v_level.action, v_level.interval_amount, v_level.interval_unit,
    v_state.next_review_at, v_next, v_level.action = 'retire'
  )
  on conflict (user_id, idempotency_key) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    select * into v_existing
    from public.review_events
    where user_id = v_uid and idempotency_key = p_idempotency_key;
    return jsonb_build_object(
      'event_id', v_existing.idempotency_key,
      'card_id', v_existing.card_id,
      'next_review_at', v_existing.next_review_at,
      'retired', v_existing.retired,
      'level_name', v_existing.level_name
    );
  end if;

  insert into public.user_card_review_state as s (
    user_id, card_id, direction, last_reviewed_at, next_review_at,
    retired, last_level_id, review_count
  ) values (
    v_uid, p_card_id, p_direction, v_now, v_next,
    v_level.action = 'retire', v_level.id, 1
  )
  on conflict (user_id, card_id, direction) do update
    set last_reviewed_at = excluded.last_reviewed_at,
        next_review_at = excluded.next_review_at,
        retired = excluded.retired,
        last_level_id = excluded.last_level_id,
        review_count = s.review_count + 1;

  update public.user_review_preferences
  set timezone_name = p_timezone
  where user_id = v_uid;

  select s.review_count into v_count
  from public.user_card_review_state s
  where s.user_id = v_uid and s.card_id = p_card_id and s.direction = p_direction;

  return jsonb_build_object(
    'event_id', p_idempotency_key,
    'card_id', p_card_id,
    'next_review_at', v_next,
    'retired', v_level.action = 'retire',
    'review_count', v_count,
    'level_name', v_level.name
  );
end;
$$;

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
    and s.direction = case when d.study_mode = 'general' then 'general'
      else d.source_language || '-' || d.target_language end
  where d.author_id = (select auth.uid())
  group by d.id;

create or replace view public.my_review_queue
with (security_invoker = on)
as
  select
    s.card_id,
    s.direction,
    s.last_reviewed_at,
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
    d.target_language,
    d.study_mode
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and not s.retired
    and s.next_review_at <= statement_timestamp()
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
    and (
      (d.study_mode = 'general' and s.direction = 'general')
      or (d.study_mode = 'language' and s.direction in (
        d.source_language || '-' || d.target_language,
        d.target_language || '-' || d.source_language
      ))
    )
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
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
    and (
      (d.study_mode = 'general' and s.direction = 'general')
      or (d.study_mode = 'language' and s.direction in (
        d.source_language || '-' || d.target_language,
        d.target_language || '-' || d.source_language
      ))
    )
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
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
    and (
      (d.study_mode = 'general' and s.direction = 'general')
      or (d.study_mode = 'language' and s.direction in (
        d.source_language || '-' || d.target_language,
        d.target_language || '-' || d.source_language
      ))
    );

grant select on public.my_review_queue to authenticated;
grant select on public.my_retired_review_cards to authenticated;
grant select on public.my_review_schedule to authenticated;

commit;
