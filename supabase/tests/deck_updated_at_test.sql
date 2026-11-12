-- ===========================================================================
-- Frasevia — la fecha de edición del mazo
--
-- La biblioteca muestra cuándo se tocó cada mazo por última vez. Estas
-- pruebas comprueban que esa fecha se mueve cuando se toca una tarjeta, que es
-- lo que la hace útil.
--
-- Dentro de una transacción `now()` no cambia: es la hora en que empezó. Por
-- eso aquí no se comparan marcas de tiempo, sino si la fila del mazo se
-- reescribió (`ctid`), que es justamente lo que hace que su `updated_at` se
-- mueva.
--
-- Se ejecutan con la CLI de Supabase:
--
--     supabase start
--     supabase db reset
--     supabase test db
-- ===========================================================================

begin;

insert into auth.users (id, email, aud, role, raw_app_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'one@frasevia.test', 'authenticated', 'authenticated', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.decks (id, author_id, title, slug, visibility)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mazo de uno', 'mazo-de-uno', 'private')
on conflict (id) do nothing;

insert into public.cards (id, deck_id, term, meaning_es)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'un término', 'un término')
on conflict (id) do nothing;

select plan(4);

-- ---------------------------------------------------------------------------
-- Añadir una tarjeta
-- ---------------------------------------------------------------------------

-- La columna de la tabla temporal no puede llamarse `ctid`: es el nombre de
-- una columna del sistema y Postgres no deja crear la tabla.
create temporary table deck_ctid_before as
  select ctid::text as fila from public.decks where id = '20000000-0000-4000-8000-000000000001';

insert into public.cards (id, deck_id, term, meaning_es)
values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'otro término', 'otro término');

select isnt(
  (select d.ctid::text from public.decks d where d.id = '20000000-0000-4000-8000-000000000001'),
  (select b.fila from deck_ctid_before b),
  'añadir una tarjeta toca el mazo'
);

-- ---------------------------------------------------------------------------
-- Editar una tarjeta
-- ---------------------------------------------------------------------------

create temporary table deck_ctid_after_insert as
  select ctid::text as fila from public.decks where id = '20000000-0000-4000-8000-000000000001';

update public.cards
   set term = 'término corregido'
 where id = '30000000-0000-4000-8000-000000000001';

select isnt(
  (select d.ctid::text from public.decks d where d.id = '20000000-0000-4000-8000-000000000001'),
  (select b.fila from deck_ctid_after_insert b),
  'editar una tarjeta toca el mazo y con ella su fecha de edición'
);

-- ---------------------------------------------------------------------------
-- Lo de siempre: el contador y las fechas
-- ---------------------------------------------------------------------------

select is(
  (select card_count from public.decks where id = '20000000-0000-4000-8000-000000000001'),
  2,
  'el contador de tarjetas sigue al día'
);

select ok(
  (select d.updated_at >= c.updated_at
     from public.decks d
     join public.cards c on c.deck_id = d.id
    where d.id = '20000000-0000-4000-8000-000000000001'
      and c.id = '30000000-0000-4000-8000-000000000001'),
  'la fecha del mazo no es anterior a la de su tarjeta'
);

select * from finish();
