import type { Messages } from "../types";

/**
 * Mazos: públicos, crear, editar y con IA.
 */
export const mazos = {
  "mazoPublico.metaTitle": "Mazo — Frasevia",
  "mazoPublico.metaDescription": "Vista previa de un mazo de Frasevia.",
  "mazoPublico.badRequest": "Solicitud no reconocida.",
  "mazoPublico.copyAlreadyYours":
    "Este mazo ya es tuyo. Ábrelo desde tu biblioteca.",
  "mazoPublico.copyNotPublic":
    "Ese mazo no es público, así que no se puede copiar.",
  "mazoPublico.copyGone": "El mazo ya no está disponible.",
  "mazoPublico.copyFailed": "No se pudo copiar el mazo. Inténtalo de nuevo.",
  "mazoPublico.loadErrorTitle": "No se pudo cargar el mazo",
  "mazoPublico.notFoundTitle": "Mazo no encontrado",
  "mazoPublico.notFoundBody":
    "Puede que el mazo sea privado o que la dirección esté mal escrita.",
  "mazoPublico.backToCatalog": "Volver al catálogo",
  "mazoPublico.backToExplore": "← Explorar",
  "mazoPublico.needsSupabase":
    "Necesitas configurar Supabase para copiar o estudiar este mazo.",
  "mazoPublico.checkingSession": "Comprobando tu sesión…",
  "mazoPublico.createPrompt":
    "Crea una cuenta para copiar este mazo a tu biblioteca y registrar tu progreso.",
  "mazoPublico.createAccount": "Crear una cuenta",
  "mazoPublico.alreadyAccount": "Ya tengo cuenta",
  "mazoPublico.copying": "Copiando…",
  "mazoPublico.copyToLibrary": "Copiar a mi biblioteca",
  "mazoPublico.studyNow": "Estudiar ahora",
  "mazoPublico.copyNote":
    "La copia es independiente: puedes editarla sin cambiar este mazo.",
  "mazoPublico.previewTitle": "Vista previa",
  "mazoPublico.noCards": "Este mazo todavía no tiene tarjetas.",
  "mazoPublico.note": "Nota: ",
  "mazoPublico.hiddenCards": [
    "Y {count} tarjeta más. Crea una cuenta o inicia sesión para verlas todas y estudiarlas.",
    "Y {count} tarjetas más. Crea una cuenta o inicia sesión para verlas todas y estudiarlas.",
  ],

  "mazoNuevo.metaTitle": "Crear un mazo — Frasevia",
  "mazoNuevo.eyebrow": "Biblioteca",
  "mazoNuevo.title": "Crear un mazo",
  "mazoNuevo.description":
    "Un mazo reúne tarjetas de un tema: palabras, frases o reglas. Puedes editarlo y publicarlo cuando quieras.",
  "mazoNuevo.titleRequired": "Ponle un título al mazo.",
  "mazoNuevo.sessionExpired": "Tu sesión expiró. Vuelve a iniciar sesión.",
  "mazoNuevo.createFailed": "No se pudo crear el mazo.",
  "mazoNuevo.seedFailed":
    "No se pudieron crear las tarjetas iniciales ({message}). El mazo no se guardó, así que puedes corregir el texto e intentarlo de nuevo.",
  "mazoNuevo.url": "Dirección: /mazos/{slug}",
  "mazoNuevo.titlePlaceholder": "Inglés para reuniones de trabajo",
  "mazoNuevo.levelPlaceholder": "Principiante",
  "mazoNuevo.creating": "Creando…",
  "mazoNuevo.submit": "Crear el mazo",
  "mazoNuevo.orCreateWithAi": "O créalo con IA a partir de un concepto",

  "mazoIa.metaTitle": "Crear un mazo con IA — Frasevia",
  "mazoIa.reviewTitle": "Revisa las tarjetas",
  "mazoIa.reviewDescription":
    "Quedan {kept} de {total}. Quita las que no te sirvan y guárdalas: después podrás editar cada una en el editor del mazo.",
  "mazoIa.modelsLoadFailed": "No se pudo cargar el catálogo de modelos.",
  "mazoIa.generateFailed":
    "Algo falló al generar el mazo. Prueba con otro modelo.",
  "mazoIa.importFailed": "No se pudo leer lo que pegaste.",
  "mazoIa.cardsSaveFailed":
    "No se pudieron guardar las tarjetas ({message}). El mazo no se creó, así que puedes intentarlo de nuevo.",
  "mazoIa.clipboardFailed":
    "El navegador no dejó copiar. Selecciona el texto del recuadro y cópialo a mano.",
  "mazoIa.title": "Crear un mazo con IA",
  "mazoIa.description":
    "Describe un concepto y te devuelve las tarjetas. Puedes generar aquí con una clave de OpenRouter, o copiar un prompt a tu propio asistente y pegar el resultado. Los dos caminos terminan igual.",
  "mazoIa.errorTitle": "No se pudo continuar",
  "mazoIa.tabsLabel": "Cómo obtener las tarjetas",
  "mazoIa.tabGenerate": "Generar aquí",
  "mazoIa.tabImport": "Importar desde mi asistente",
  "mazoIa.stepConcept": "1. El concepto",
  "mazoIa.stepConceptBody":
    "Cuanto más concreto, mejor. «Verbos para negociar plazos» da mejores tarjetas que «inglés de negocios».",
  "mazoIa.fieldConcept": "¿Sobre qué quieres un mazo?",
  "mazoIa.conceptHint":
    "Una frase basta. Puedes pegar un texto más largo si quieres.",
  "mazoIa.conceptPlaceholder":
    "Frases para pedir un aplazamiento en una reunión de trabajo",
  "mazoIa.fieldCardCount": "Cuántas tarjetas",
  "mazoIa.cardCountHint": "Entre {min} y {max}.",
  "mazoIa.fieldLevel": "Nivel",
  "mazoIa.levelHint": "Opcional.",
  "mazoIa.levelUnspecified": "Sin especificar",
  "mazoIa.extrasLabel": "Pedir ejemplo y nota de uso en cada tarjeta",
  "mazoIa.extrasHint":
    "Cuesta más tokens y tarda algo más, pero las tarjetas sirven mucho mejor para practicar.",
  "mazoIa.stepModel": "2. El modelo",
  "mazoIa.stepModelBody":
    "El catálogo se pide a OpenRouter al abrir, así que no hay una lista escrita en el código que se quede vieja. También incluye los modelos de Google, Anthropic y MiniMax, sin claves de esos servicios.",
  "mazoIa.fieldModel": "Modelo",
  "mazoIa.modelHint":
    "Si el catálogo no carga, escribe el identificador a mano: se acepta cualquier texto.",
  "mazoIa.modelsErrorTitle": "No se pudo cargar el catálogo",
  "mazoIa.retry": "Intentar otra vez",
  "mazoIa.showModels": "Ver los {count} modelos disponibles",
  "mazoIa.filterModelsPlaceholder": "Filtrar: gemini, claude, minimax, gpt…",
  "mazoIa.filterModelsLabel": "Filtrar modelos",
  "mazoIa.noJsonTitle":
    "No admite salida en JSON. La respuesta llega con texto alrededor y se lee igual.",
  "mazoIa.noJson": "sin JSON",
  "mazoIa.noModelMatch": "Ningún modelo coincide con «{query}».",
  "mazoIa.loadingModels": "Cargando el catálogo de modelos…",
  "mazoIa.missingKeyTitle": "Falta la clave de OpenRouter",
  "mazoIa.missingKeyBody":
    "Sin clave no se puede generar desde aquí. Se guarda en este navegador y no pasa por ningún servidor nuestro.",
  "mazoIa.addKey": "Añadir la clave",
  "mazoIa.orGetIt": "o consíguela en",
  "mazoIa.openRouterPanel": "el panel de OpenRouter",
  "mazoIa.importModeNote":
    "Si prefieres no dar de alta nada, el modo de importar funciona sin clave.",
  "mazoIa.generating": "Generando…",
  "mazoIa.generateCards": "Generar tarjetas",
  "mazoIa.hintAddKey": "Añade una clave, o cambia al modo de importar.",
  "mazoIa.busyNote":
    "Pidiendo tarjetas a OpenRouter. Puede tardar unos segundos, y unos pocos más si el modelo está pensando.",
  "mazoIa.stepImport": "2. Copia el prompt y pega la respuesta",
  "mazoIa.stepImportBody":
    "Aquí no hace falta ninguna clave ni cuenta: genera el JSON con la IA que ya tengas abierta —Claude, Gemini, ChatGPT, MiniMax o la que sea— y pégalo abajo.",
  "mazoIa.importStep1": "Copia el prompt.",
  "mazoIa.importStep2": "Pégalo en tu asistente y espera a que responda.",
  "mazoIa.importStep3Lead": "Copia",
  "mazoIa.importStep3Strong": "solo el JSON",
  "mazoIa.importStep3Tail":
    "que te devuelva, con o sin bloque de código, y pégalo en el recuadro de abajo.",
  "mazoIa.promptLabel": "Prompt para copiar",
  "mazoIa.copied": "Copiado",
  "mazoIa.copyPrompt": "Copiar el prompt",
  "mazoIa.conceptNeeded":
    "Escribe el concepto arriba para que el prompt esté completo.",
  "mazoIa.fieldAssistant": "La respuesta de tu asistente",
  "mazoIa.fieldAssistantHint":
    "Vale con el JSON solo o con el texto que lo rodea.",
  "mazoIa.readCards": "Leer las tarjetas",

  "review.title": "Tarjetas",
  "review.keptOf": "{kept} de {total}",
  "review.restore": "Recuperar",
  "review.remove": "Quitar",
  "review.saving": "Guardando…",
  "review.saveCards": "Guardar {count} tarjetas",
  "review.discard": "Descartar y empezar de nuevo",
  "review.askMore": "Pedir otras tarjetas",

  "mazoEditar.metaTitle": "Editar mazo",
  "mazoEditar.metaDeck": "Editar {deck}",
  "mazoEditar.noSupabaseShort": "Falta configurar Supabase.",
  "mazoEditar.titleRequired": "El título no puede quedar vacío.",
  "mazoEditar.deckSaved": "Mazo guardado.",
  "mazoEditar.cardNeedsFields": "Completa las dos caras de la tarjeta.",
  "mazoEditar.cardAdded": "Tarjeta agregada.",
  "mazoEditar.cardDeleted": "Tarjeta eliminada.",
  "mazoEditar.unknownAction": "Acción no reconocida.",
  "mazoEditar.nothingToSave": "No había cambios que guardar.",
  "mazoEditar.cardsNeedFields":
    "Cada tarjeta necesita contenido en las dos caras.",
  "mazoEditar.cardsSaved": "Tarjetas guardadas.",
  "mazoEditar.copyTag": "Copia",
  "mazoEditar.publicPage": "Ver página pública",
  "mazoEditar.officialTitle": "Mazo oficial de solo lectura",
  "mazoEditar.officialBody":
    "El contenido oficial lo mantiene el equipo de Frasevia. Si quieres cambiarlo,",
  "mazoEditar.makeCopy": "haz una copia",
  "mazoEditar.officialTail": "y edítala en tu biblioteca.",
  "mazoEditar.deckData": "Datos del mazo",
  "mazoEditar.publicNotice":
    "Mientras sea público, cualquiera con el enlace puede leerlo y copiarlo a su biblioteca.",
  "mazoEditar.saveDeck": "Guardar mazo",
  "mazoEditar.cardsHeading": "Tarjetas ({count})",
  "mazoEditar.noCardsYet":
    "Este mazo todavía no tiene tarjetas. Agrega la primera con el formulario de arriba.",
  "mazoEditar.saveCards": "Guardar tarjetas",
  "mazoEditar.deleteDeckTitle": "¿Eliminar «{title}»?",
  "mazoEditar.deleteDeckBody":
    "Se borra el mazo, sus tarjetas y el progreso que registraste en ellas. No se puede deshacer.",
  "mazoEditar.deleteDeckConfirm": "Eliminar el mazo",
  "mazoEditar.deleteDeckTrigger": "Eliminar este mazo",
  "mazoEditar.deleteCardTitle": "¿Eliminar esta tarjeta?",
  "mazoEditar.deleteCardBody":
    "Se borra la tarjeta y el progreso que registraste en ella.",
  "mazoEditar.deleteCardTrigger": "Eliminar esta tarjeta",
  "mazoEditar.addCardTitle": "Agregar una tarjeta",
  "mazoEditar.fieldTerm": "Término en inglés",
  "mazoEditar.fieldMeaning": "Significado en español",
  "mazoEditar.fieldKind": "Tipo",
  "mazoEditar.fieldTags": "Etiquetas",
  "mazoEditar.tagsHint": "Separadas por comas.",
  "mazoEditar.fieldExampleEn": "Ejemplo en inglés",
  "mazoEditar.fieldExampleEs": "Traducción del ejemplo",
  "mazoEditar.fieldUsageNote": "Nota de uso",
  "mazoEditar.addCardSubmit": "Agregar tarjeta",
  "mazoEditar.createdOn": "Tarjeta creada el {date}",

  "deckField.title": "Título",
  "deckField.description": "Descripción",
  "deckField.descriptionHint":
    "Cuenta de qué trata el mazo. Aparece en el catálogo.",
  "deckField.descriptionHintPublic":
    "Aparece en el catálogo cuando el mazo es público.",
  "deckField.descriptionHintReview": "Aparece en el catálogo si lo publicas.",
  "deckField.sourceLanguage": "Idioma de origen",
  "deckField.targetLanguage": "Idioma que se aprende",
  "deckField.cardLanguage": "Idioma de la tarjeta",
  "deckField.translationLanguage": "Idioma de la traducción",
  "deckField.level": "Nivel aproximado",
  "deckField.levelHint": "Una idea orientativa, no una certificación.",
  "deckField.visibility": "Visibilidad",
  "visibility.option.private": "Privado, solo yo",
  "visibility.option.public": "Público, aparece en explorar",
  "deckField.seed": "Primera tanda de tarjetas (opcional)",
  "deckField.seedHint":
    "Una tarjeta por línea, con el formato: término | significado en español | ejemplo en inglés | traducción del ejemplo",

  "language.es": "Español",
  "language.en": "Inglés",
  "language.pt": "Portugués",
  "language.fr": "Francés",
  "language.de": "Alemán",
  "level.beginner": "Principiante",
  "level.intermediate": "Intermedio",
  "level.advanced": "Avanzado",
  "level.unspecified": "Sin nivel concreto",
} satisfies Messages;
