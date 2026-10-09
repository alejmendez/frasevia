-- ===========================================================================
-- Frasevia — pruebas de permisos, copia de mazos y progreso
--
-- Estas pruebas necesitan la base de datos real, no el navegador.
-- Se ejecutan con la CLI de Supabase:
--
--     supabase start
--     supabase db reset          # aplica migraciones + seed
--     supabase test db
--
-- Simulan tres sesiones distintas: `anon` (visitante), `user_one` y
-- `user_two`. Verifican que las reglas viven en la base de datos y no en la
-- interfaz: aunque alguien manipule la aplicación, la base no lo permite.
--
-- Cada cambio de identidad son DOS sentencias, y el orden importa:
--
--     select set_config('request.jwt.claims', …, true);
--     set local role anon;              -- o `authenticated`
--
-- `set_config` solo escribe el JWT en la sesión: dice QUIÉN es la persona, pero
-- no cambia el rol con el que PostgreSQL evalúa las políticas. Sin el
-- `set local role`, estas pruebas siguen conectando como `postgres`, que es
-- superusuario y tiene `BYPASSRLS`: las políticas no se aplican, `auth.uid()`
-- devuelve `null` y las comprobaciones de permisos pasarían por el motivo
-- equivocado, o directamente no pasarían. El `set local role` es lo que
-- enciende la RLS.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Preparación: dos personas y sus mazos
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_app_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'one@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'two@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.decks (id, author_id, title, slug, visibility)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mazo privado de uno', 'mazo-privado-uno', 'private'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Mazo privado de dos', 'mazo-privado-dos', 'private'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Mazo público de dos', 'mazo-publico-dos', 'public')
on conflict (id) do nothing;

insert into public.cards (id, deck_id, term, meaning_es)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'private term one', 'término privado uno'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'another private term', 'otro término privado'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'two private term', 'término privado de dos'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', 'a public phrase', 'una frase pública'),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', 'a public word', 'una palabra pública')
on conflict (id) do nothing;

select plan(24);

-- ---------------------------------------------------------------------------
-- Visitante (rol anon)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"role":"anon","sub":null}', true);
set local role anon;

-- Los mazos oficiales del seed también cuentan como públicos.
select is(
  (select count(*)::integer from public.decks where visibility = 'public'),
  3,
  'anon ve los mazos públicos y los oficiales'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000003'),
  2,
  'anon ve las tarjetas de un mazo público'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  0,
  'anon no puede ver las tarjetas de un mazo privado ajeno'
);

select is(
  (select count(*)::integer
     from public.decks
    where author_id is null and visibility <> 'public'),
  0,
  'no existe ningún mazo oficial privado'
);

select throws_ok(
  $$insert into public.decks (author_id, title) values (null, 'Deck anon')$$,
  '42501',
  null,
  'anon no puede crear mazos'
);

-- ---------------------------------------------------------------------------
-- Persona autenticada: aislamiento entre cuentas
-- ---------------------------------------------------------------------------

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"10000000-0000-4000-8000-000000000001","email":"one@frasevia.test"}',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer
     from public.decks
    where author_id = '10000000-0000-4000-8000-000000000001'),
  1,
  've su propio mazo privado'
);

select is(
  (select count(*)::integer from public.decks where slug = 'mazo-privado-dos'),
  0,
  'no ve el mazo privado de otra persona'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000002'),
  0,
  'no ve las tarjetas del mazo privado de otra persona'
);

select is(
  (select count(*)::integer from public.decks where visibility = 'public'),
  3,
  'sigue viendo los mazos públicos y oficiales'
);

-- No puede tocar nada ajeno.
--
-- Ojo con la diferencia: RLS filtra en silencio las filas que la sesión no puede
-- ver, así que un `update` o `delete` sobre un mazo ajeno NO da error, simplemente
-- afecta 0 filas. El 42501 aparece solo cuando la fila sí es visible pero la
-- operación es inválida (el `with check` de la política). Por eso unas
-- comprobaciones usan `is_empty` y otras `throws_ok`.
select is_empty(
  $$update public.decks set title = 'secuestrado'
     where slug = 'mazo-privado-dos' returning id$$,
  'no puede modificar el mazo de otra persona'
);

select is_empty(
  $$delete from public.decks where title = 'Mazo privado de dos' returning id$$,
  'no puede borrar el mazo de otra persona'
);

select is_empty(
  $$update public.cards set term = 'secuestrado'
     where id = '30000000-0000-4000-8000-000000000004' returning id$$,
  'no puede modificar tarjetas de un mazo ajeno'
);

select throws_ok(
  $$update public.decks set is_official = true where slug = 'mazo-privado-uno'$$,
  '42501',
  null,
  'no puede convertir su propio mazo en oficial'
);

-- Los mazos oficiales son públicos y visibles, pero de solo lectura: el
-- `using` de la política de update los deja fuera, así que afecta 0 filas.
select is_empty(
  $$update public.decks set title = 'editado' where is_official returning id$$,
  'los mazos oficiales no se pueden editar'
);

-- ---------------------------------------------------------------------------
-- Copia de mazos
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::integer
     from public.copy_deck('20000000-0000-4000-8000-000000000003')),
  1,
  'copy_deck devuelve una fila'
);

select is(
  (select count(*)::integer
     from public.decks
    where author_id = '10000000-0000-4000-8000-000000000001'
      and source_deck_id = '20000000-0000-4000-8000-000000000003'),
  1,
  'la copia queda en su propia biblioteca'
);

select is(
  (select count(*)::integer
     from public.cards c
    where c.deck_id = (select d.id
                         from public.decks d
                        where d.author_id = '10000000-0000-4000-8000-000000000001'
                          and d.source_deck_id = '20000000-0000-4000-8000-000000000003')),
  2,
  'la copia incluye todas las tarjetas del original'
);

select is(
  (select count(*)::integer
     from public.cards c
    join public.decks d on d.id = c.deck_id
   where d.source_deck_id = '20000000-0000-4000-8000-000000000003'
     and c.id in ('30000000-0000-4000-8000-000000000004',
                  '30000000-0000-4000-8000-000000000005')),
  0,
  'la copia usa identificadores nuevos y no toca las tarjetas originales'
);

select throws_ok(
  $$select public.copy_deck('20000000-0000-4000-8000-000000000002')$$,
  '42501',
  null,
  'no se puede copiar un mazo privado ajeno'
);

-- ---------------------------------------------------------------------------
-- Progreso
-- ---------------------------------------------------------------------------

select throws_ok(
  $$insert into public.user_card_progress (user_id, card_id, attempts)
     values ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 1)$$,
  '42501',
  null,
  'no puede registrar progreso sobre una tarjeta que no puede ver'
);

select throws_ok(
  $$insert into public.user_card_progress (user_id, card_id, attempts)
     values ('10000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 1)$$,
  '42501',
  null,
  'no puede escribir en el progreso de otra persona'
);

select is(
  (select public.record_practice(
    '[{"card_id":"30000000-0000-4000-8000-000000000001","attempts":1,"correct_count":1}]'::jsonb
  )),
  1,
  'record_practice guarda el resultado de una tarjeta'
);

select is(
  (select p.state::text
     from public.user_card_progress p
    where p.user_id = '10000000-0000-4000-8000-000000000001'
      and p.card_id = '30000000-0000-4000-8000-000000000001'),
  'learning',
  'un acierto deja la tarjeta en "practicando"'
);

select is(
  (select p.state::text
     from (select public.record_practice(
             '[{"card_id":"30000000-0000-4000-8000-000000000001","attempts":1,"correct_count":1}]'::jsonb
           ) as saved) r
     join public.user_card_progress p
       on p.user_id = '10000000-0000-4000-8000-000000000001'
      and p.card_id = '30000000-0000-4000-8000-000000000001'
     where r.saved = 1),
  'mastered',
  'el segundo acierto marca la tarjeta como aprendida'
);

select * from finish();
rollback;
