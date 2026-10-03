-- ---------------------------------------------------------------------------
-- Repaso programado personal
--
-- El progreso histórico de elección múltiple sigue intacto en
-- `user_card_progress`. La cola nueva registra únicamente autoevaluaciones de
-- memoria, por usuario y dirección. Una ficha sin fila de estado es nueva.
-- ---------------------------------------------------------------------------

create table public.review_levels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  system_key text,
  name text not null,
  action text not null default 'review'
    check (action in ('review', 'retire')),
  interval_amount integer,
  interval_unit text,
  position integer not null default 0,
  color text not null default 'sage',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_levels_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint review_levels_interval_valid check (
    (action = 'retire' and interval_amount is null and interval_unit is null)
    or (
      action = 'review'
      and interval_amount is not null
      and interval_unit is not null
      and interval_amount between 1 and 525600
      and interval_unit in ('minutes', 'hours', 'days')
      and (interval_unit <> 'hours' or interval_amount <= 8760)
      and (interval_unit <> 'days' or interval_amount <= 3650)
    )
  ),
  constraint review_levels_color_valid check (
    color in ('coral', 'sand', 'sage', 'lime', 'forest', 'blue')
  )
);

create unique index review_levels_system_key_idx
  on public.review_levels (user_id, system_key)
  where system_key is not null;
create index review_levels_order_idx
  on public.review_levels (user_id, position, created_at);

create table public.user_review_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone_name text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_card_review_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete cascade,
  direction text not null,
  last_reviewed_at timestamptz not null,
  next_review_at timestamptz,
  retired boolean not null default false,
  last_level_id uuid references public.review_levels (id) on delete set null,
  review_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id, direction),
  constraint review_state_direction_length check (char_length(direction) between 3 and 24),
  constraint review_state_count_valid check (review_count >= 0),
  constraint review_state_date_matches_retired check (
    (retired and next_review_at is null)
    or (not retired and next_review_at is not null)
  )
);

create index review_state_due_idx
  on public.user_card_review_state (user_id, next_review_at)
  where not retired;
create index review_state_card_idx
  on public.user_card_review_state (card_id, direction);

create table public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key uuid not null,
  card_id uuid not null references public.cards (id) on delete cascade,
  direction text not null,
  happened_at timestamptz not null,
  level_id uuid references public.review_levels (id) on delete set null,
  level_name text not null,
  action text not null check (action in ('review', 'retire')),
  interval_amount integer,
  interval_unit text,
  previous_next_review_at timestamptz,
  next_review_at timestamptz,
  retired boolean not null,
  constraint review_event_idempotency unique (user_id, idempotency_key),
  constraint review_event_snapshot_valid check (
    (action = 'retire' and interval_amount is null and interval_unit is null and retired and next_review_at is null)
    or (
      action = 'review'
      and interval_amount is not null
      and interval_unit is not null
      and interval_amount > 0
      and interval_unit in ('minutes', 'hours', 'days')
      and not retired
      and next_review_at is not null
    )
  )
);

create index review_events_history_idx
  on public.review_events (user_id, happened_at desc);

alter table public.review_levels enable row level security;
alter table public.user_review_preferences enable row level security;
alter table public.user_card_review_state enable row level security;
alter table public.review_events enable row level security;

create policy review_levels_select_own on public.review_levels
  for select using (user_id = (select auth.uid()));
create policy review_levels_insert_own on public.review_levels
  for insert with check (user_id = (select auth.uid()));
create policy review_levels_update_own on public.review_levels
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy review_levels_delete_own on public.review_levels
  for delete using (user_id = (select auth.uid()));

create policy review_preferences_select_own on public.user_review_preferences
  for select using (user_id = (select auth.uid()));
create policy review_preferences_update_own on public.user_review_preferences
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy review_state_select_own on public.user_card_review_state
  for select using (user_id = (select auth.uid()));
create policy review_events_select_own on public.review_events
  for select using (user_id = (select auth.uid()));

create trigger review_levels_touch_updated_at
  before update on public.review_levels
  for each row execute function public.touch_updated_at();
create trigger review_preferences_touch_updated_at
  before update on public.user_review_preferences
  for each row execute function public.touch_updated_at();
create trigger review_state_touch_updated_at
  before update on public.user_card_review_state
  for each row execute function public.touch_updated_at();

create or replace function public.create_review_defaults(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.review_levels (
    user_id, system_key, name, action, interval_amount, interval_unit, position, color
  )
  values
    (p_user_id, 'difficult', 'Difícil', 'review', 2, 'hours', 1, 'coral'),
    (p_user_id, 'normal', 'Normal', 'review', 1, 'days', 2, 'sand'),
    (p_user_id, 'easy', 'Fácil', 'review', 5, 'days', 3, 'sage'),
    (p_user_id, 'very_easy', 'Súper fácil', 'retire', null, null, 4, 'lime')
  on conflict (user_id, system_key) where system_key is not null do nothing;

  insert into public.user_review_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.on_auth_user_created_review_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_review_defaults(new.id);
  return new;
end;
$$;

create trigger auth_user_review_defaults
  after insert on auth.users
  for each row execute function public.on_auth_user_created_review_defaults();

insert into public.review_levels (
  user_id, system_key, name, action, interval_amount, interval_unit, position, color
)
select u.id, defaults.system_key, defaults.name, defaults.action,
  defaults.interval_amount, defaults.interval_unit, defaults.position, defaults.color
from auth.users u
cross join (values
  ('difficult', 'Difícil', 'review', 2, 'hours', 1, 'coral'),
  ('normal', 'Normal', 'review', 1, 'days', 2, 'sand'),
  ('easy', 'Fácil', 'review', 5, 'days', 3, 'sage'),
  ('very_easy', 'Súper fácil', 'retire', null, null, 4, 'lime')
) as defaults(system_key, name, action, interval_amount, interval_unit, position, color)
on conflict (user_id, system_key) where system_key is not null do nothing;

insert into public.user_review_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create view public.my_deck_review_summary
with (security_invoker = on)
as
  select
    d.id as deck_id,
    count(c.id) filter (where s.card_id is null)::integer as new_count,
    count(c.id) filter (
      where s.card_id is not null and not s.retired and s.next_review_at <= now()
    )::integer as due_count,
    count(c.id) filter (
      where s.card_id is not null and not s.retired and s.next_review_at > now()
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
  group by d.id;

create view public.my_review_queue
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
    d.target_language
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and not s.retired
    and s.next_review_at <= now()
    and d.author_id = (select auth.uid())
  order by s.next_review_at asc;

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
      and p_direction in (
        d.source_language || '-' || d.target_language,
        d.target_language || '-' || d.source_language
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

create or replace function public.reactivate_card_review(
  p_card_id uuid,
  p_direction text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_now timestamptz := clock_timestamp();
begin
  if v_uid is null or not public.is_card_visible(p_card_id) then
    raise exception 'La ficha no está disponible para ti' using errcode = '42501';
  end if;

  update public.user_card_review_state
  set retired = false, next_review_at = v_now
  where user_id = v_uid and card_id = p_card_id
    and direction = p_direction and retired;

  if not found then
    raise exception 'La ficha ya estaba activa' using errcode = '22023';
  end if;
  return v_now;
end;
$$;

revoke all on function public.create_review_defaults(uuid) from public;
revoke all on function public.on_auth_user_created_review_defaults() from public;
revoke all on function public.record_card_review(uuid, text, uuid, uuid, text) from public;
revoke all on function public.reactivate_card_review(uuid, text) from public;
grant execute on function public.record_card_review(uuid, text, uuid, uuid, text) to authenticated;
grant execute on function public.reactivate_card_review(uuid, text) to authenticated;

grant select, insert, update, delete on public.review_levels to authenticated;
grant select, update on public.user_review_preferences to authenticated;
grant select on public.user_card_review_state to authenticated;
grant select on public.review_events to authenticated;
grant select on public.my_deck_review_summary to authenticated;
grant select on public.my_review_queue to authenticated;

