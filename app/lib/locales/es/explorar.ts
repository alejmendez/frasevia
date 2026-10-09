import type { Messages } from "../types";

/**
 * Explorar.
 */
export const explorar = {
  "explorar.metaTitle": "Explorar mazos — Frasevia",
  "explorar.metaDescription":
    "Mazos públicos de idiomas y repaso general. Descubre tarjetas sobre lo que quieras aprender.",
  "explorar.eyebrow": "Catálogo público",
  "explorar.title": "Explorar mazos",
  "explorar.description":
    "Mazos de otras personas y los mazos oficiales de Frasevia. Puedes copiar los que te gusten a tu propia biblioteca.",
  "explorar.searchLabel": "Buscar mazos",
  "explorar.searchPlaceholder": "Busca por título o descripción",
  "explorar.searchButton": "Buscar",
  "explorar.clear": "Limpiar",
  "explorar.noSupabaseTitle": "Sin conexión a Supabase",
  "explorar.noSupabaseBody":
    "No se pudo leer el catálogo porque falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en tu .env.",
  "explorar.loadErrorTitle": "No se pudo cargar el catálogo",
  "explorar.emptyResultsTitle": "Sin resultados",
  "explorar.emptyNoDecksTitle": "Todavía no hay mazos públicos",
  "explorar.emptyResultsBody":
    "Ningún mazo coincide con “{query}”. Prueba con otra palabra.",
  "explorar.emptyTypeBody":
    "Todavía no hay mazos públicos de este tipo. Prueba con todos los temas o crea el tuyo.",
  "explorar.emptyNoDecksBody":
    "Sé la primera persona en compartir un mazo: crea el tuyo y publícalo.",
  "explorar.seeAll": "Ver todos",
  "explorar.createFirst": "Crear mi primer mazo",
} satisfies Messages;
