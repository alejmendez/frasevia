/**
 * Versión en TypeScript de la generación de slugs.
 *
 * La base de datos también genera el slug (`assign_deck_slug` en
 * `supabase/migrations`), pero solo cuando el mazo se guarda. Aquí se replica la
 * misma regla para poder mostrar la dirección mientras se escribe el título.
 *
 * La lista de caracteres acentuados es la misma que usa `translate()` en el
 * trigger de Postgres, a propósito: si las dos se desincronizan, la vista previa
 * promete una dirección que el servidor nunca va a generar.
 */
const ACCENTED = "áàäâãéèëêíìïîóòöôõúùüûñç";
const WITHOUT_ACCENT = "aaaaaeeeeiiiiooooouuuunc";

const FOLDED: Record<string, string> = Object.fromEntries(
  [...ACCENTED].map((char, index) => [char, WITHOUT_ACCENT[index] ?? char]),
);

export function slugPreview(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[áàäâãéèëêíìïîóòöôõúùüûñç]/g, (char) => FOLDED[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "mazo";
}
