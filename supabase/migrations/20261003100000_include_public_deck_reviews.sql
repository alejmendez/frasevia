-- Las personas pueden iniciar una sesión desde un mazo público sin copiarlo.
-- Sus estados siguen siendo personales y deben aparecer en la cola, la agenda
-- y la lista de fichas retiradas aunque el mazo pertenezca a otra persona.

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
    d.target_language
  from public.user_card_review_state s
  join public.cards c on c.id = s.card_id
  join public.decks d on d.id = c.deck_id
  where s.user_id = (select auth.uid())
    and not s.retired
    and s.next_review_at <= statement_timestamp()
    and (d.visibility = 'public' or d.author_id = (select auth.uid()))
  order by s.next_review_at asc;

create view public.my_retired_review_cards
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
  order by s.last_reviewed_at desc;

create view public.my_review_schedule
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
    and (d.visibility = 'public' or d.author_id = (select auth.uid()));

grant select on public.my_review_queue to authenticated;
grant select on public.my_retired_review_cards to authenticated;
grant select on public.my_review_schedule to authenticated;
