-- La ampliación conserva los mazos de idiomas y la privacidad del repaso.
begin;

insert into auth.users (id, email, aud, role, raw_app_meta_data) values
  ('11000000-0000-4000-8000-000000000011', 'general-reader@frasevia.test', 'authenticated', 'authenticated', '{}'),
  ('11000000-0000-4000-8000-000000000012', 'general-author@frasevia.test', 'authenticated', 'authenticated', '{}');

insert into public.decks (id, author_id, title, slug, study_mode, visibility) values
  ('22000000-0000-4000-8000-000000000011', '11000000-0000-4000-8000-000000000012', 'General public', 'general-public', 'general', 'public'),
  ('22000000-0000-4000-8000-000000000013', '11000000-0000-4000-8000-000000000012', 'General private', 'general-private', 'general', 'private');
insert into public.decks (id, author_id, title, slug) values
  ('22000000-0000-4000-8000-000000000012', '11000000-0000-4000-8000-000000000011', 'Language unchanged', 'language-unchanged');
insert into public.cards (id, deck_id, term, meaning_es) values
  ('33000000-0000-4000-8000-000000000011', '22000000-0000-4000-8000-000000000011', 'LIFO?', 'Una pila'),
  ('33000000-0000-4000-8000-000000000012', '22000000-0000-4000-8000-000000000012', 'salary', 'sueldo'),
  ('33000000-0000-4000-8000-000000000013', '22000000-0000-4000-8000-000000000013', 'Privada?', 'Privada');

select plan(14);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11000000-0000-4000-8000-000000000011"}', true);
set local role authenticated;

select is((select study_mode from public.decks where id = '22000000-0000-4000-8000-000000000012'), 'language', 'los mazos existentes mantienen el modo de idiomas');
select is((select count(*)::integer from public.decks where id = '22000000-0000-4000-8000-000000000013'), 0, 'RLS oculta el repaso general privado de otra persona');
select is((select (public.copy_deck('22000000-0000-4000-8000-000000000011')).study_mode), 'general', 'copiar conserva el tipo de estudio');
select is((select term from public.cards where deck_id in (select id from public.decks where source_deck_id = '22000000-0000-4000-8000-000000000011')), 'LIFO?', 'copiar conserva la pregunta');

select is((select public.record_card_review('33000000-0000-4000-8000-000000000011', 'general', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000011', 'America/Santiago') ->> 'retired'), 'false', 'se programa una tarjeta pública general');
select public.record_card_review('33000000-0000-4000-8000-000000000011', 'general', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000011', 'America/Santiago');
select is((select review_count from public.user_card_review_state where card_id = '33000000-0000-4000-8000-000000000011'), 1, 'reintentar un evento general es idempotente');
select throws_ok($$select public.record_card_review('33000000-0000-4000-8000-000000000011', 'es-en', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000012', 'UTC')$$, '42501', 'La ficha no está disponible para ti', 'una tarjeta general no admite dirección de traducción');
select throws_ok($$select public.record_card_review('33000000-0000-4000-8000-000000000013', 'general', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000013', 'UTC')$$, '42501', 'La ficha no está disponible para ti', 'no se puede repasar contenido privado ajeno');
select lives_ok($$select public.record_card_review('33000000-0000-4000-8000-000000000012', 'es-en', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000014', 'UTC')$$, 'los repasos de idiomas siguen funcionando');
select throws_ok($$select public.record_card_review('33000000-0000-4000-8000-000000000012', 'general', (select id from public.review_levels where system_key = 'difficult'), '44000000-0000-4000-8000-000000000015', 'UTC')$$, '42501', 'La ficha no está disponible para ti', 'un mazo de idiomas no admite dirección general');
select is((select count(*)::integer from public.my_review_schedule), 2, 'la agenda combina idiomas y repaso general');

reset role;
update public.user_card_review_state set next_review_at = statement_timestamp() - interval '1 minute'
where user_id = '11000000-0000-4000-8000-000000000011';
set local role authenticated;
select is((select count(*)::integer from public.my_review_queue), 2, 'la cola combina los dos tipos de estudio');
select is((select study_mode from public.my_review_queue where card_id = '33000000-0000-4000-8000-000000000011'), 'general', 'la cola informa el tipo para orientar la pregunta');
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"11000000-0000-4000-8000-000000000012"}', true);
select is((select count(*)::integer from public.my_review_queue), 0, 'los repasos siguen siendo personales');

select * from finish();
rollback;
