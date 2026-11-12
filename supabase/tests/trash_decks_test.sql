-- ===========================================================================
-- Frasevia — pruebas de la papelera
--
-- Estas pruebas necesitan la base de datos real, no el navegador. Se ejecutan
-- con la CLI de Supabase:
--
--     supabase start
--     supabase db reset          # aplica migraciones + seed
--     supabase test db
--
-- Comprueban lo que la aplicación no puede decidir por sí sola: que un mazo
-- en la papelera desaparece de la vista de los demás, que solo su dueño puede
-- mandarlo a la papelera y devolverlo, y que sus tarjetas y su progreso siguen
-- ahí, intactos, por si alguien cambia de idea.
--
-- Cada cambio de identidad son DOS sentencias, y el orden importa:
--
--     select set_config('request.jwt.claims', …, true);
--     set local role anon;              -- o `authenticated`
--
-- Sin el `set local role` las pruebas siguen conectando como `postgres`, que
-- tiene `BYPASSRLS`: las políticas no se aplican y las comprobaciones pasarían
-- por el motivo equivocado.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- Preparación: dos personas, un mazo privado y uno público
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role, raw_app_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'one@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'two@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.decks (id, author_id, title, slug, visibility)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mazo privado de uno', 'mazo-privado-uno', 'private'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Mazo público de dos', 'mazo-publico-dos', 'public')
on conflict (id) do nothing;

insert into public.cards (id, deck_id, term, meaning_es)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'private term one', 'término privado uno'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'another private term', 'otro término privado'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', 'a public phrase', 'una frase pública')
on conflict (id) do nothing;

-- Un repaso general pendiente detecta si las vistas vuelven a tratar todos los
-- mazos como traducciones. Las fechas fijas evitan depender del reloj del test.
update public.decks set study_mode = 'general'
where id = '20000000-0000-4000-8000-000000000001';

insert into public.user_card_review_state (
  user_id, card_id, direction, last_reviewed_at, next_review_at, review_count
) values (
  '10000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'general', '2020-01-01 00:00:00+00', '2020-01-02 00:00:00+00', 1
);

select plan(25);

-- ---------------------------------------------------------------------------
-- Ladueña del mazo privado
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"10000000-0000-4000-8000-000000000001"}', true);
set local role authenticated;

select is(
  (select due_count from public.my_deck_review_summary
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  1,
  'el resumen cuenta los repasos generales pendientes'
);

select is(
  (select study_mode from public.my_review_queue
    where card_id = '30000000-0000-4000-8000-000000000001'
      and last_reviewed_at = '2020-01-01 00:00:00+00'),
  'general',
  'la cola conserva el modo y la fecha del último repaso'
);

-- El progreso se registra antes de mandar el mazo a la papelera: después, sus
-- tarjetas dejan de ser visibles y no se puede escribir en ellas.
select lives_ok(
  $$insert into public.user_card_progress (user_id, card_id, attempts)
     values ('10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1)$$,
  'se puede registrar progreso en una tarjeta propia'
);

select is(
  (select count(*)::integer from public.trash_deck('20000000-0000-4000-8000-000000000001')),
  1,
  'trash_deck devuelve una fila'
);

select is(
  (select (deleted_at is not null)::integer
     from public.decks
    where id = '20000000-0000-4000-8000-000000000001'),
  1,
  'el mazo queda marcado como borrado'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  0,
  'RLS oculta las tarjetas de la papelera incluso al dueño'
);

select is(
  (select count(*)::integer from public.my_review_queue
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  0,
  'la cola no incluye los repasos de un mazo en la papelera'
);

select is(
  (select count(*)::integer
     from public.decks
    where id = '20000000-0000-4000-8000-000000000001'),
  1,
  'el dueño sigue viendo su mazo en la papelera'
);

select is_empty(
  $$update public.decks
     set title = 'editado'
   where id = '20000000-0000-4000-8000-000000000001'
   returning id$$,
  'un mazo en la papelera no se puede editar'
);

select throws_ok(
  $$select public.trash_deck('20000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'no se puede mandar a la papelera el mazo de otra persona'
);

select throws_ok(
  $$select public.trash_deck('20000000-0000-4000-8000-000000000099')$$,
  '42501',
  null,
  'no se puede mandar a la papelera un mazo que no existe'
);

select is(
  (select count(*)::integer from public.restore_deck('20000000-0000-4000-8000-000000000001')),
  1,
  'restore_deck devuelve una fila'
);

select is(
  (select (deleted_at is null)::integer
     from public.decks
    where id = '20000000-0000-4000-8000-000000000001'),
  1,
  'el mazo vuelve a estar vivo'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  2,
  'las tarjetas siguen ahí después de devolver el mazo'
);

select is(
  (select due_count from public.my_deck_review_summary
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  1,
  'el resumen vuelve a contar los repasos al restaurar el mazo'
);

-- Se vuelve a mandar a la papelera para comprobar que el progreso tampoco
-- aparece mientras el mazo está allí.
select is(
  (select count(*)::integer from public.trash_deck('20000000-0000-4000-8000-000000000001')),
  1,
  'el mazo se puede volver a mandar a la papelera'
);

select is(
  (select count(*)::integer
     from public.my_progress_detail
    where deck_id = '20000000-0000-4000-8000-000000000001'),
  0,
  'un mazo en la papelera no aparece en el progreso'
);

select throws_ok(
  $$select public.restore_deck('20000000-0000-4000-8000-000000000003')$$,
  '42501',
  null,
  'no se puede devolver el mazo de otra persona'
);

select is_empty(
  $$delete from public.decks
    where id = '20000000-0000-4000-8000-000000000003'
    returning id$$,
  'no se puede borrar para siempre el mazo de otra persona'
);

-- ---------------------------------------------------------------------------
-- La dueña del mazo público
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"10000000-0000-4000-8000-000000000002"}', true);

select is(
  (select count(*)::integer from public.trash_deck('20000000-0000-4000-8000-000000000003')),
  1,
  'cada quien puede mandar a la papelera sus propios mazos'
);

-- ---------------------------------------------------------------------------
-- Visitante (rol anon)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"role":"anon","sub":null}', true);
set local role anon;

select is(
  (select count(*)::integer
     from public.decks
    where id = '20000000-0000-4000-8000-000000000003'),
  0,
  'un mazo en la papelera no se ve desde fuera'
);

select is(
  (select count(*)::integer
     from public.cards
    where deck_id = '20000000-0000-4000-8000-000000000003'),
  0,
  'las tarjetas de un mazo en la papelera tampoco se ven'
);

-- ---------------------------------------------------------------------------
-- Volviendo a la primera persona
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"role":"authenticated","sub":"10000000-0000-4000-8000-000000000001"}', true);
set local role authenticated;

select throws_ok(
  $$select public.copy_deck('20000000-0000-4000-8000-000000000003')$$,
  'P0002',
  null,
  'un mazo en la papelera no se puede copiar'
);

with deleted as (
  delete from public.decks
    where id = '20000000-0000-4000-8000-000000000001'
    returning id
)
select is(
  (select count(*)::integer from deleted),
  1,
  'el dueño sí puede borrar para siempre su mazo en la papelera'
);

select is(
  (select count(*)::integer
     from public.decks
    where id = '20000000-0000-4000-8000-000000000001'),
  0,
  'el mazo ya no está en la base'
);

select * from finish();
rollback;
