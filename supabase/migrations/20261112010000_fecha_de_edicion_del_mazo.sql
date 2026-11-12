-- ---------------------------------------------------------------------------
-- La fecha de edición del mazo
--
-- La biblioteca muestra cuándo se tocó cada mazo por última vez. Para que esa
-- fecha signifique algo tiene que moverse cuando se edita una tarjeta, y hasta
-- ahora no se movía: el trigger que mantiene `decks.card_count` al día solo
-- se disparaba al añadir o quitar tarjetas. Corregir una palabra en una tarjeta
-- no tocaba el mazo, así que el mazo parecía intocado aunque lo acabaras de
-- tocar.
--
-- Se añade un trigger aparte, en vez de cambiar el del contador, porque cada
-- uno hace un trabajo distinto: este solo mueve la fecha, y no vuelve a contar
-- las tarjetas una y otra vez en cada cambio.
-- ---------------------------------------------------------------------------

begin;

create or replace function public.touch_deck_on_card_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.decks set updated_at = now() where id = new.deck_id;
    return new;

  elsif tg_op = 'DELETE' then
    update public.decks set updated_at = now() where id = old.deck_id;
    return old;

  else
    update public.decks set updated_at = now() where id = old.deck_id;
    if new.deck_id is distinct from old.deck_id then
      update public.decks set updated_at = now() where id = new.deck_id;
    end if;
    return new;
  end if;
end;
$$;

drop trigger if exists cards_touch_deck on public.cards;

create trigger cards_touch_deck
  after insert or delete or update on public.cards
  for each row execute function public.touch_deck_on_card_change();

commit;
