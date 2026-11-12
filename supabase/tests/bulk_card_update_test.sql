-- ===========================================================================
-- Frasevia — el guardado masivo de tarjetas
--
-- El editor guarda todas las tarjetas de un mazo en una sola llamada, con la
-- función `update_deck_cards`. Estas pruebas comprueban que el tipo de
-- tarjeta (que en la base es un enum) sobrevive al viaje en JSON, que las
-- tarjetas que no vienen en la lista no se tocan, y que un tipo que no existe
-- se rechaza antes de escribir nada.
--
-- Se ejecutan con la CLI de Supabase:
--
--     supabase start
--     supabase db reset
--     supabase test db
--
-- Cada cambio de identidad son DOS sentencias, y el orden importa:
--
--     select set_config('request.jwt.claims', …, true);
--     set local role authenticated;
--
-- Sin el `set local role` la sesión sigue siendo superusuario: la RLS no se
-- aplica y `auth.uid()` devuelve `null`.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Preparación: una persona, su mazo y sus tarjetas
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_app_meta_data)
values ('10000000-0000-4000-8000-000000000001', 'one@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.decks (id, author_id, title, slug, visibility)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mazo de uno', 'mazo-de-uno', 'private')
on conflict (id) do nothing;

insert into public.cards (id, deck_id, kind, term, meaning_es)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'word', 'private term one', 'término privado uno'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'word', 'another private term', 'otro término privado')
on conflict (id) do nothing;

select plan(6);

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"10000000-0000-4000-8000-000000000001"}', true);
set local role authenticated;

-- ---------------------------------------------------------------------------
-- Guardar una tarjeta
-- ---------------------------------------------------------------------------

select is(
  public.update_deck_cards(
    '20000000-0000-4000-8000-000000000001',
    '[{"card_id":"30000000-0000-4000-8000-000000000001","kind":"question","term":"término corregido","meaning_es":"significado corregido","example_en":null,"example_es":null,"usage_note":null,"tags":["entrevista"]}]'::jsonb
  ),
  1,
  'guarda una tarjeta y cuenta cuántas tocó'
);

select is(
  (select kind::text from public.cards where id = '30000000-0000-4000-8000-000000000001'),
  'question',
  'el tipo de tarjeta se guarda como el enum, no como texto'
);

select is(
  (select term from public.cards where id = '30000000-0000-4000-8000-000000000001'),
  'término corregido',
  'el término corregido se guarda'
);

select is(
  (select tags from public.cards where id = '30000000-0000-4000-8000-000000000001'),
  array['entrevista']::text[],
  'las etiquetas se guardan'
);

-- ---------------------------------------------------------------------------
-- Lo que no está en la lista
-- ---------------------------------------------------------------------------

select is(
  (select term from public.cards where id = '30000000-0000-4000-8000-000000000002'),
  'another private term',
  'una tarjeta que no viene en la lista se queda como estaba'
);

-- ---------------------------------------------------------------------------
-- Un tipo que no existe
-- ---------------------------------------------------------------------------

select throws_ok(
  $$select public.update_deck_cards('20000000-0000-4000-8000-000000000001', '[{"card_id":"30000000-0000-4000-8000-000000000001","kind":"inventado","term":"t","meaning_es":"m"}]'::jsonb)$$,
  '22023',
  'Ese tipo de tarjeta no existe',
  'un tipo de tarjeta que no existe se rechaza con su propio código'
);

select is(
  (select term from public.cards where id = '30000000-0000-4000-8000-000000000001'),
  'término corregido',
  'el rechazo no deja la tarjeta a medias'
);

select * from finish();
rollback;
