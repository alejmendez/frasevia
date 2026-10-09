-- Repaso programado: preferencias, calendario, idempotencia, RLS y mazos públicos.
-- Se ejecuta junto con las demás pruebas pgTAP mediante `supabase test db`.
--
-- Cada `set_config` va seguido de `set local role`: el primero dice quién es la
-- persona y el segundo enciende la RLS. Sin el segundo, la conexión sigue siendo
-- de `postgres`, que tiene `BYPASSRLS`, y las políticas no se evalúan. La regla
-- completa está explicada en `frasevia_policies_test.sql`.

begin;

insert into auth.users (id, email, aud, role, raw_app_meta_data)
values
  ('11000000-0000-4000-8000-000000000003', 'reviewer@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb),
  ('11000000-0000-4000-8000-000000000004', 'publisher@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.decks (id, author_id, title, slug, visibility)
values
  ('22000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000003', 'Private review deck', 'private-review-deck', 'private'),
  ('22000000-0000-4000-8000-000000000004', '11000000-0000-4000-8000-000000000004', 'Public review deck', 'public-review-deck', 'public'),
  ('22000000-0000-4000-8000-000000000005', '11000000-0000-4000-8000-000000000004', 'Private deck owned by publisher', 'publisher-private-deck', 'private')
on conflict (id) do nothing;

insert into public.cards (id, deck_id, term, meaning_es)
values
  ('33000000-0000-4000-8000-000000000003', '22000000-0000-4000-8000-000000000003', 'private review term', 'término privado'),
  ('33000000-0000-4000-8000-000000000004', '22000000-0000-4000-8000-000000000004', 'public review term', 'término público'),
  ('33000000-0000-4000-8000-000000000005', '22000000-0000-4000-8000-000000000005', 'publisher private term', 'término privado del editor')
on conflict (id) do nothing;

select plan(30);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"11000000-0000-4000-8000-000000000003","email":"reviewer@frasevia.test"}',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.review_levels),
  4,
  'una cuenta nueva recibe cuatro niveles personales'
);

select is(
  (select interval_amount || ' ' || interval_unit
     from public.review_levels where system_key = 'difficult'),
  '2 hours',
  'Difícil comienza con dos horas'
);

select is(
  (select interval_amount || ' ' || interval_unit
     from public.review_levels where system_key = 'normal'),
  '1 days',
  'Normal comienza con un día calendario'
);

select is(
  (select timezone_name from public.user_review_preferences),
  'UTC',
  'la preferencia de zona horaria se crea con la cuenta'
);

select is(
  (select public.record_card_review(
     '33000000-0000-4000-8000-000000000003',
     'es-en',
     (select id from public.review_levels where system_key = 'difficult'),
     '44000000-0000-4000-8000-000000000001',
     'America/Santiago'
   ) ->> 'retired'),
  'false',
  'una calificación difícil deja la tarjeta activa'
);

select ok(
  (select next_review_at > happened_at
      and next_review_at <= happened_at + interval '2 hours'
     from public.review_events
    where idempotency_key = '44000000-0000-4000-8000-000000000001'),
  'Difícil programa la tarjeta dentro de dos horas según el reloj del servidor'
);

select is(
  (select review_count from public.user_card_review_state
    where card_id = '33000000-0000-4000-8000-000000000003'
      and direction = 'es-en'),
  1,
  'la primera calificación crea un estado personal'
);

select is(
  (select count(*)::integer from public.review_events
    where idempotency_key = '44000000-0000-4000-8000-000000000001'),
  1,
  'el primer guardado crea un solo evento'
);

select is(
  (select (public.record_card_review(
     '33000000-0000-4000-8000-000000000003',
     'es-en',
     (select id from public.review_levels where system_key = 'difficult'),
     '44000000-0000-4000-8000-000000000001',
     'America/Santiago'
   ) ->> 'next_review_at')::timestamptz),
  (select next_review_at from public.review_events
    where idempotency_key = '44000000-0000-4000-8000-000000000001'),
  'el reintento devuelve la fecha original'
);

select is(
  (select count(*)::integer from public.review_events
    where idempotency_key = '44000000-0000-4000-8000-000000000001'),
  1,
  'reintentar la misma clave no duplica el evento'
);

select is(
  (select (public.record_card_review(
     '33000000-0000-4000-8000-000000000003',
     'es-en',
     (select id from public.review_levels where system_key = 'normal'),
     '44000000-0000-4000-8000-000000000002',
     'America/Santiago'
   ) ->> 'retired'),
  'false',
  'una calificación normal deja la tarjeta activa'
);

select ok(
  (select next_review_at = (
      ((happened_at at time zone 'America/Santiago') + make_interval(days => 1))
      at time zone 'America/Santiago'
    )
     from public.review_events
    where idempotency_key = '44000000-0000-4000-8000-000000000002'),
  'Normal conserva la hora local al avanzar un día de calendario'
);

select is(
  (select public.record_card_review(
     '33000000-0000-4000-8000-000000000003',
     'es-en',
     (select id from public.review_levels where system_key = 'very_easy'),
     '44000000-0000-4000-8000-000000000003',
     'America/Santiago'
   ) ->> 'retired'),
  'true',
  'Súper fácil retira la tarjeta del repaso automático'
);

select ok(
  (select retired and next_review_at is null
     from public.user_card_review_state
    where card_id = '33000000-0000-4000-8000-000000000003'
      and direction = 'es-en'),
  'la tarjeta retirada conserva su estado sin una próxima fecha'
);

select is(
  (select count(*)::integer from public.my_review_queue),
  0,
  'la cola no incluye tarjetas retiradas'
);

select is(
  (select count(*)::integer from public.my_retired_review_cards),
  1,
  'las tarjetas retiradas siguen disponibles para reactivarlas'
);

select lives_ok(
  $$select public.reactivate_card_review('33000000-0000-4000-8000-000000000003', 'es-en')$$,
  'reactivar devuelve la tarjeta a la cola'
);

select is(
  (select count(*)::integer from public.my_review_queue),
  1,
  'la tarjeta reactivada queda pendiente'
);

select ok(
  (select not retired and next_review_at <= now()
     from public.user_card_review_state
    where card_id = '33000000-0000-4000-8000-000000000003'
      and direction = 'es-en'),
  'reactivar la marca como pendiente ahora'
);

select lives_ok(
  $$select public.record_card_review(
      '33000000-0000-4000-8000-000000000003',
      'en-es',
      (select id from public.review_levels where system_key = 'normal'),
      '44000000-0000-4000-8000-000000000007',
      'America/Santiago'
    )$$,
  'la misma ficha puede recibir una calificación en la dirección inversa'
);

select is(
  (select count(*)::integer from public.user_card_review_state
    where card_id = '33000000-0000-4000-8000-000000000003'),
  2,
  'cada dirección conserva un estado de repaso independiente'
);

select lives_ok(
  $$select public.record_card_review(
      '33000000-0000-4000-8000-000000000004',
      'es-en',
      (select id from public.review_levels where system_key = 'normal'),
      '44000000-0000-4000-8000-000000000004',
      'America/Santiago'
    )$$,
  'cada usuario puede programar su repaso personal de un mazo público'
);

select is(
  (select count(*)::integer from public.my_review_schedule
    where card_id = '33000000-0000-4000-8000-000000000004'),
  1,
  'la agenda incluye las tarjetas públicas estudiadas sin copiarlas'
);

select lives_ok(
  $$select public.record_card_review(
      '33000000-0000-4000-8000-000000000004',
      'es-en',
      (select id from public.review_levels where system_key = 'very_easy'),
      '44000000-0000-4000-8000-000000000006',
      'America/Santiago'
    )$$,
  'una ficha pública también se puede retirar de la cola personal'
);

select is(
  (select count(*)::integer from public.my_retired_review_cards
    where deck_visibility = 'public' and deck_slug = 'public-review-deck'),
  1,
  'las fichas retiradas de un mazo público se pueden consultar y reactivar'
);

select lives_ok(
  $$select public.reactivate_card_review('33000000-0000-4000-8000-000000000004', 'es-en')$$,
  'el repaso público retirado también se puede reactivar'
);

select is(
  (select count(*)::integer from public.my_review_queue),
  2,
  'la cola contiene los repasos propios y públicos que volvieron a activarse'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"11000000-0000-4000-8000-000000000004","email":"publisher@frasevia.test"}',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.user_card_review_state
    where card_id = '33000000-0000-4000-8000-000000000004'),
  0,
  'el propietario del mazo público no puede leer el estado de otra persona'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"11000000-0000-4000-8000-000000000003","email":"reviewer@frasevia.test"}',
  true
);
set local role authenticated;

select throws_ok(
  $$select public.record_card_review(
      '33000000-0000-4000-8000-000000000005',
      'es-en',
      (select id from public.review_levels where system_key = 'normal'),
      '44000000-0000-4000-8000-000000000005',
      'America/Santiago'
    )$$,
  '42501',
  null,
  'no se pueden programar tarjetas de mazos privados ajenos'
);

select throws_ok(
  $$update public.review_levels set interval_amount = 0
      where system_key = 'difficult'$$,
  '23514',
  null,
  'la base rechaza intervalos inválidos aunque no se use la interfaz'
);

select * from finish();
rollback;
