import type { Messages, MessageValue } from "./types";

/**
 * Catálogo en español, y la lista de claves de la aplicación.
 *
 * Este archivo es la fuente de verdad: `en.ts` está tipado contra
 * `SpanishKey`, así que si aquí aparece una clave que allí no, el error sale al
 * compilar y no como un «undefined» pintado en pantalla.
 *
 * Las claves van por pantallilla (`inicio.title`, `estudiar.continue`) y no por
 * texto, para que cambiar una redacción no toque el código que la usa.
 *
 * ## Lo que no se traduce
 *
 * El contenido de los mazos: términos, significados, ejemplos y notas de uso
 * vienen de la base de datos y los pone quien los escribió. El idioma de la
 * interfaz no es el idioma del contenido, igual que en un libro en español las
 * citas en inglés siguen en inglés. Los ejemplos de muestra de la portada
 * (`inicio.*.term` y compañía) se quedan igual por lo mismo.
 */
export const es = {
  "studyMode.label": "¿Qué quieres estudiar?",
  "studyMode.language": "Idiomas",
  "studyMode.general": "Repaso general",
  "studyMode.languageHint":
    "Palabras, frases y traducciones para practicar un idioma.",
  "studyMode.generalHint":
    "Preguntas y respuestas sobre cualquier tema que quieras recordar.",
  "studyMode.filterLabel": "Tipo de estudio",
  "studyMode.all": "Todos los temas",
  "general.contentLanguage": "Idioma del contenido",
  "general.titlePlaceholder": "Ej. Conceptos de programación",
  "general.levelHint": "Opcional. Indica la dificultad o el curso.",
  "general.levelPlaceholder": "Ej. Introductorio, segundo semestre…",
  "general.seedHint":
    "Una tarjeta por línea: pregunta | respuesta | ejemplo o contexto (opcional)",
  "general.seedPlaceholder":
    "¿Qué estructura sigue el orden LIFO? | Una pila. | El último elemento en entrar es el primero en salir.",
  "general.front": "Pregunta o concepto",
  "general.back": "Respuesta o explicación",
  "general.concept": "Concepto",
  "general.example": "Ejemplo o contexto",
  "general.note": "Nota o aclaración",
  "general.notePrefix": "Nota: ",
  "general.aiConceptHint":
    "Indica la materia y lo que quieres recordar. Puedes pegar tus apuntes como referencia.",
  "general.aiConceptPlaceholder":
    "Conceptos de estructuras de datos: pilas, colas, listas y árboles",
  "general.aiExtras": "Pedir ejemplo y explicación en cada tarjeta",
  "general.recallHint": "Piensa en la respuesta antes de girar.",
  "general.reviewHint": "Intenta recordar la respuesta antes de revelarla.",
  "general.otherPractices":
    "Explorar las tarjetas, elegir una respuesta o repasar a tu ritmo.",
  "general.choiceMode": "Elegir la respuesta",
  "general.chooseAnswer": "Elige la respuesta correcta.",
  "general.modeDescription.elegir":
    "Elige la respuesta correcta entre cuatro opciones.",
  "general.modeDescription.explorar":
    "Lee las preguntas, respuestas y su contexto.",
  "general.modeDescription.revisar":
    "Recuerda la respuesta y compruébala al revelarla.",
  "general.modeDescription.completar": "Repasa la pregunta y su respuesta.",
  "inicio.demoGeneralFront": "¿Qué estructura sigue el orden LIFO?",
  "inicio.demoGeneralBack": "Una pila",
  "inicio.demoGeneralContext":
    "El último elemento en entrar es el primero en salir.",
  // -------------------------------------------------------------------------
  // Común
  // -------------------------------------------------------------------------
  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.done": "Listo",
  "common.delete": "Eliminar",
  "common.deleting": "Eliminando…",
  "common.noSupabaseEnv":
    "Falta configurar Supabase en tus variables de entorno.",

  // -------------------------------------------------------------------------
  // Tema claro / noche
  // -------------------------------------------------------------------------
  "theme.toDark": "Activar el modo noche",
  "theme.toLight": "Activar el modo luz",

  // -------------------------------------------------------------------------
  // Errores de página
  // -------------------------------------------------------------------------
  "error.title": "Algo salió mal",
  "error.message": "Ocurrió un error inesperado.",
  "error.notFoundTitle": "No encontramos esta página",
  "error.notFoundMessage":
    "Puede que la dirección esté mal escrita o que el contenido ya no esté disponible.",
  "error.backHome": "Volver al inicio",
  "error.shortTitle": "Error",

  // -------------------------------------------------------------------------
  // Aviso de Supabase sin configurar
  // -------------------------------------------------------------------------
  "configNotice.title": "Falta configurar Supabase",
  "configNotice.body":
    "Frasevia necesita conexión a Supabase para leer mazos, guardar tu biblioteca y registrar tu progreso. Todavía no puede hacerlo.",
  "configNotice.lead": "Copia",
  "configNotice.middle":
    "a y completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Después reinicia el servidor de desarrollo.",
  "configNotice.note":
    "Mientras tanto puedes navegar la interfaz, pero nada se guarda.",

  // -------------------------------------------------------------------------
  // Barra y pie (root)
  // -------------------------------------------------------------------------
  "app.opening": "Abriendo Frasevia…",
  "app.navigating": "Navegando",
  "nav.primary": "Principal",
  "nav.explore": "Explorar",
  "nav.progress": "Mi progreso",
  "nav.library": "Mi biblioteca",
  "nav.reviewSettings": "Ajustes de repaso",
  "account.unconfigured": "Sin configurar",
  "account.signIn": "Iniciar sesión",
  "account.signUp": "Crear cuenta",
  "account.yourAccount": "Tu cuenta",
  "account.signOut": "Salir",
  "footer.tagline": "Frasevia. Aprende idiomas y recuerda lo que te importa.",
  "footer.exploreDecks": "Explorar mazos",

  // -------------------------------------------------------------------------
  // Acceso con Google
  // -------------------------------------------------------------------------
  "google.disabled":
    "El acceso con Google no está disponible por ahora. Puedes entrar con tu correo y contraseña.",
  "google.divider": "o",
  "google.opening": "Abriendo Google…",
  "google.privacy":
    "Google comparte solo tu correo y tu nombre. Frasevia no accede a tus correos ni a tus contactos.",
  "google.labelContinue": "Continuar con Google",
  "google.labelSignUp": "Registrarse con Google",
  "google.errorParseUrl":
    "No se pudo preparar el acceso con Google. Revisa VITE_SUPABASE_URL.",
  "google.errorNetwork":
    "No se pudo contactar con Supabase. Revisa tu conexión.",

  // -------------------------------------------------------------------------
  // Portada
  // -------------------------------------------------------------------------
  "inicio.metaTitle": "Frasevia · aprende y repasa con tarjetas",
  "inicio.metaDescription":
    "Tarjetas para aprender idiomas o repasar cualquier tema. Explora, crea tus mazos y programa tus próximos repasos.",
  "inicio.eyebrow": "Un poco cada día",
  "inicio.titleLead": "Piensa. Gira.",
  "inicio.titleAccent": " Recuerda",
  "inicio.body":
    "Idiomas, apuntes y nuevas ideas. Recuerda la respuesta y elige cuándo volver a repasarla.",
  "inicio.ctaExplore": "Explorar mazos",
  "inicio.ctaSignUp": "Crear una cuenta",
  "inicio.cardsTitle": "Recuerda antes de mirar",
  "inicio.cardsBody":
    "Lee la pregunta, piensa tu respuesta y gira la ficha cuando estés listo.",
  "inicio.pillar1.title": "Tarjetas con contexto",
  "inicio.pillar1.body":
    "Palabras, preguntas y conceptos con ejemplos y notas que te ayudan a recordarlos.",
  "inicio.pillar2.title": "Una pregunta, una respuesta",
  "inicio.pillar2.body":
    "La práctica mental es directa: intenta recordar, compara y decide cuándo volver.",
  "inicio.pillar3.title": "A tu ritmo",
  "inicio.pillar3.body":
    "Sin cronómetro ni rachas obligatorias. Tú decides cuándo volver a cada ficha.",
  "inicio.startTitle": "Un mazo para lo que quieras aprender",
  "inicio.startBody":
    "Crea tus tarjetas sobre cualquier tema o empieza con nuestros mazos de inglés.",
  "inicio.tagBasics": "Inglés desde las bases",
  "inicio.tagDevs": "Inglés para desarrolladores",
  "inicio.seeCatalog": "Ver el catálogo",
  "inicio.ctaTry": "Probar una ficha",
  "inicio.ctaTurn": "Ver respuesta",
  "inicio.ctaFront": "Volver al frente",
  "inicio.ctaLibrary": "Ir a mi biblioteca",
  "inicio.noStreaks": "A tu ritmo, sin rachas obligatorias.",
  "inicio.demoDirection": "ESPAÑOL → INGLÉS",
  "inicio.demoHint": "Piensa la respuesta antes de girar.",
  "inicio.demoAnswerLabel": "RESPUESTA",
  "inicio.demoMeaning": "¿Cuál es el sueldo base para este cargo?",
  "inicio.stepRemember": "Recuerda",
  "inicio.stepRememberBody": "Lee la tarjeta y piensa en la respuesta.",
  "inicio.stepFlip": "Gira la ficha",
  "inicio.stepFlipBody": "Revela la respuesta cuando estés listo.",
  "inicio.stepSchedule": "Elige el próximo repaso",
  "inicio.stepScheduleBody": "Frasevia te ayuda a volver en el momento justo.",
  "inicio.deckBasicsLabel": "Para empezar",
  "inicio.deckBasicsBody":
    "Saludos, presentaciones y frases útiles del día a día.",
  "inicio.deckDevsLabel": "Para el trabajo",
  "inicio.deckDevsBody":
    "Vocabulario y frases de reuniones, proyectos y entrevistas.",
  "inicio.openDeck": "Ver mazo",

  // -------------------------------------------------------------------------
  // Iniciar sesión
  // -------------------------------------------------------------------------
  "signIn.metaTitle": "Iniciar sesión — Frasevia",
  "signIn.title": "Iniciar sesión",
  "signIn.description":
    "Entra para practicar, guardar tu biblioteca y copiar mazos.",
  "signIn.oauthTitle": "No se completó el acceso con Google",
  "signIn.oauthBody":
    "Puede que se haya cancelado el permiso, o que el acceso con Google no esté habilitado en el proyecto. Inténtalo otra vez o entra con tu correo y contraseña.",
  "signIn.fieldEmail": "Correo electrónico",
  "signIn.fieldPassword": "Contraseña",
  "signIn.invalidCredentials": "El correo o la contraseña no son correctos.",
  "signIn.signingIn": "Entrando…",
  "signIn.forgot": "¿Olvidaste tu contraseña?",
  "signIn.noAccountYet": "¿Todavía no tienes cuenta?",
  "signIn.createOne": "Crear una",

  // -------------------------------------------------------------------------
  // Crear una cuenta
  // -------------------------------------------------------------------------
  "signUp.metaTitle": "Crear una cuenta — Frasevia",
  "signUp.title": "Crear una cuenta",
  "signUp.description":
    "Tu cuenta guarda la biblioteca, el progreso de cada tarjeta y las copias de los mazos que copies.",
  "signUp.passwordTooShort": "La contraseña necesita al menos 8 caracteres.",
  "signUp.passwordHint": "Mínimo 8 caracteres.",
  "signUp.checkEmail":
    "Revisa tu correo: te enviamos un enlace para confirmar la cuenta. Cuando lo abras podrás entrar.",
  "signUp.creating": "Creando la cuenta…",
  "signUp.submit": "Crear la cuenta",
  "signUp.haveAccount": "¿Ya tienes cuenta?",
  "signUp.signInLink": "Inicia sesión",

  // -------------------------------------------------------------------------
  // Recuperar contraseña
  // -------------------------------------------------------------------------
  "reset.metaTitle": "Recuperar contraseña — Frasevia",
  "reset.title": "Recuperar contraseña",
  "reset.newTitle": "Elige una contraseña nueva",
  "reset.body":
    "Escribe tu correo y te enviamos un enlace para cambiar la contraseña.",
  "reset.newBody": "Estás usando el enlace que te enviamos por correo.",
  "reset.linkWorked":
    "Listo, el enlace funcionó. Escribe una contraseña nueva para tu cuenta.",
  "reset.emailSent":
    "Si ese correo tiene una cuenta, te enviamos un enlace para cambiar la contraseña.",
  "reset.updated": "Contraseña actualizada. Ya puedes iniciar sesión.",
  "reset.fieldNewPassword": "Contraseña nueva",
  "reset.saving": "Guardando…",
  "reset.savePassword": "Guardar contraseña",
  "reset.sending": "Enviando…",
  "reset.sendLink": "Enviar enlace",
  "reset.backToSignIn": "Volver a iniciar sesión",

  // -------------------------------------------------------------------------
  // Explorar
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Biblioteca
  // -------------------------------------------------------------------------
  "biblioteca.metaTitle": "Mi biblioteca — Frasevia",
  "biblioteca.eyebrow": "Un poco cada día",
  "biblioteca.title": "Lo que aprendes, ficha a ficha",
  "biblioteca.description": "Un pequeño repaso para seguir avanzando.",
  "biblioteca.createWithAi": "Crear con IA",
  "biblioteca.createDeck": "Crear un mazo",
  "biblioteca.createWithAiLong": "Crear un mazo con IA",
  "biblioteca.createManual": "Crear un mazo a mano",
  "biblioteca.loadErrorTitle": "No se pudo cargar tu biblioteca",
  "biblioteca.emptyTitle": "Tu biblioteca está vacía",
  "biblioteca.emptyDescription":
    "Crea un mazo de idiomas o de repaso general, o copia un mazo público para adaptarlo a ti.",
  "biblioteca.noCards": "Sin tarjetas todavía",
  "biblioteca.notPracticed": "Sin practicar todavía",
  "biblioteca.progressAria":
    "{learned} de {total} tarjetas aprendidas en {deck}",
  "biblioteca.progressLine": [
    "{learned} aprendida · {learning} practicando",
    "{learned} aprendidas · {learning} practicando",
  ],
  "biblioteca.official": "Oficial",
  "biblioteca.published": "Publicado",
  "biblioteca.private": "Privado",
  "biblioteca.copied": "Copiado",
  "biblioteca.edit": "Editar",
  "biblioteca.study": "Estudiar",
  "biblioteca.todayReview": "Tu repaso de hoy",
  "biblioteca.pendingHeadline": [
    "{count} ficha lista para repasar",
    "{count} fichas listas para repasar",
  ],
  "biblioteca.noPendingHeadline": "Hoy puedes avanzar a tu ritmo",
  "biblioteca.pendingDescription":
    "Empieza por las fichas que necesitan un poco más de práctica.",
  "biblioteca.nextReviewSummary": "Tu próximo repaso es {date}.",
  "biblioteca.noPendingDescription": [
    "Tienes {count} ficha nueva por descubrir.",
    "Tienes {count} fichas nuevas por descubrir.",
  ],
  "biblioteca.reviewPending": "Repasar pendientes",
  "biblioteca.reviewSettings": "Ajustes de repaso",
  "biblioteca.upcomingReviews": "Próximos repasos",
  "biblioteca.noUpcoming": "Todavía no hay repasos programados.",
  "biblioteca.today": "Hoy",
  "biblioteca.tomorrow": "Mañana",
  "biblioteca.cardCount": ["{count} ficha", "{count} fichas"],
  "biblioteca.myDecks": "Mis mazos",
  "biblioteca.deckCount": ["{count} mazo", "{count} mazos"],
  "biblioteca.searchLabel": "Buscar mazos",
  "biblioteca.searchPlaceholder": "Buscar un mazo…",
  "biblioteca.filtersLabel": "Filtrar mazos",
  "biblioteca.filter.all": "Todos",
  "biblioteca.filter.private": "Privados",
  "biblioteca.filter.public": "Públicos",
  "biblioteca.noSearchResults": "No encontramos esos mazos",
  "biblioteca.noSearchResultsHint":
    "Prueba otra búsqueda o crea un mazo para empezar.",
  "biblioteca.completeDescription": "Completar descripción",
  "biblioteca.exploreCommunity": "Explorar mazos de la comunidad",
  "biblioteca.reviewStatsUnavailable": "No se pudieron cargar los repasos.",
  "biblioteca.reviewStatsUnavailableBody":
    "Revisa en README.md las migraciones de repaso y aplícalas en Supabase para cargar las estadísticas y la cola.",
  "biblioteca.upcomingUnavailable":
    "No se pudo cargar el calendario de repasos.",
  "biblioteca.dueCount": ["{count} pendiente", "{count} pendientes"],
  "biblioteca.newCount": ["{count} nueva", "{count} nuevas"],
  "biblioteca.scheduledCount": ["{count} programada", "{count} programadas"],
  "biblioteca.reviewDeck": ["Repasar {count}", "Repasar {count}"],
  "biblioteca.learnNew": [
    "Aprender {count} ficha nueva",
    "Aprender {count} fichas nuevas",
  ],
  "biblioteca.addCards": "Añadir fichas",
  "biblioteca.viewDeck": "Ver mazo",
  "biblioteca.lastReview": "Último repaso: {date}",
  "biblioteca.lastPractice": "Última práctica: {date}",

  // -------------------------------------------------------------------------
  // Tarjeta de mazo
  // -------------------------------------------------------------------------
  "deck.noDescription": "Sin descripción.",
  "deck.by": "Por {author}",

  // -------------------------------------------------------------------------
  // Etiquetas de datos
  // -------------------------------------------------------------------------
  "label.visibility.private": "Privado",
  "label.visibility.public": "Público",
  "label.cardKind.word": "Palabra",
  "label.cardKind.phrase": "Frase",
  "label.cardKind.question": "Pregunta",
  "label.cardKind.rule": "Regla",
  "label.progress.new": "Nueva",
  "label.progress.learning": "Practicando",
  "label.progress.mastered": "Aprendida",
  "format.cardCount": ["{count} tarjeta", "{count} tarjetas"],
  "format.percent": "{value}%",
  "time.noRecord": "sin registro",
  "time.justNow": "recién",

  // -------------------------------------------------------------------------
  // Progreso
  // -------------------------------------------------------------------------
  "progreso.metaTitle": "Mi progreso — Frasevia",
  "progreso.eyebrow": "Tu avance",
  "progreso.title": "Mi progreso",
  "progreso.description":
    "Lo que has practicado hasta ahora. No hay rachas ni plazos: la idea es ver qué ya se te queda y qué conviene repasar.",
  "progreso.goLibrary": "Ir a la biblioteca",
  "progreso.loadErrorTitle": "No se pudo cargar tu progreso",
  "progreso.emptyTitle": "Todavía no hay progreso registrado",
  "progreso.emptyDescription":
    "Cuando practiques un mazo, aquí verás cuántas tarjetas tienes aprendidas, cuáles sigues practicando y cuándo fue la última sesión.",
  "progreso.chooseDeck": "Elegir un mazo",
  "progreso.statPracticed": "Practicadas",
  "progreso.statLearned": "Aprendidas",
  "progreso.statLearning": "Practicando",
  "progreso.statLastSession": "Última sesión",
  "progreso.totalAria": "{learned} tarjetas aprendidas de {total}",
  "progreso.keepPracticing": "Seguir practicando",
  "progreso.deckLine": [
    "{learned} aprendida de {total} practicada",
    "{learned} aprendidas de {total} practicadas",
  ],
  "progreso.score": "{correct}/{attempts} aciertos",

  // -------------------------------------------------------------------------
  // Estudiar
  // -------------------------------------------------------------------------
  "estudiar.metaTitle": "Estudiar",
  "estudiar.metaDeck": "Estudiar {deck}",
  "estudiar.deckNotFound": "Mazo no encontrado",
  "estudiar.sessionExpired": "Tu sesión expiró.",
  "estudiar.badResults": "No se pudo interpretar la sesión.",
  "estudiar.badReview": "Faltan datos para guardar este repaso.",
  "estudiar.nothingToSave": "No había nada que guardar.",
  "estudiar.saved": "Progreso guardado.",
  "estudiar.backLibrary": "← Mi biblioteca",
  "estudiar.pendingTitle": "Repaso pendiente",
  "estudiar.recallTitle": "Recuerda antes de mirar",
  "estudiar.recallSubtitle": "Piensa en la respuesta. Después gira la ficha.",
  "estudiar.otherPractices": "Otras prácticas",
  "estudiar.otherPracticesHint":
    "Explorar, elegir una respuesta o completar una frase.",
  "estudiar.pendingLabel": "Pendiente",
  "estudiar.newLabel": "Nueva",
  "estudiar.direction": "{source} → {target}",
  "estudiar.recallHint": "Recuerda la expresión completa.",
  "estudiar.responseLabel": "RESPUESTA",
  "estudiar.toFlip": "para girar la ficha",
  "estudiar.ratingQuestion": "¿Qué tan fácil fue recordarla?",
  "estudiar.ratingTimingHint":
    "Puedes elegir un nivel ahora o revelar la respuesta primero. La siguiente ficha aparece de inmediato mientras se guarda tu valoración.",
  "estudiar.queueTitle": "Tarjetas de esta sesión",
  "estudiar.queueHint": "Elige una tarjeta pendiente para ir a ella.",
  "estudiar.deckQueueTitle": "Tarjetas del mazo",
  "estudiar.deckQueueHint":
    "Puedes saltar a las pendientes; las programadas y retiradas aparecen al final.",
  "estudiar.queueProgress": "{done}/{total} repasadas",
  "estudiar.queueCurrent": "Ahora",
  "estudiar.queueSaving": "Guardando",
  "estudiar.queueReviewed": "Repasada",
  "estudiar.queueScheduled": "Programada",
  "estudiar.queueRetired": "Retirada",
  "estudiar.jumpToCard": "Ir a la tarjeta {index}: {term}. {status}.",
  "estudiar.audioControls": "Opciones de pronunciación",
  "estudiar.audioNormal": "Normal",
  "estudiar.audioSlow": "Lenta",
  "estudiar.audioNormalLabel": "Escuchar {text} a velocidad normal",
  "estudiar.audioSlowLabel": "Escuchar {text} más despacio",
  "estudiar.audioUnavailable": "El audio no está disponible en este navegador.",
  "estudiar.audioVoiceUnavailable":
    "No hay una voz instalada para este idioma en tu dispositivo.",
  "estudiar.ratingShortcutHint":
    "Usa las teclas 1–{count} para elegir un nivel.",
  "estudiar.noActiveLevels":
    "Activa al menos un nivel para programar el repaso.",
  "estudiar.intervalMinutes": "En {amount} min",
  "estudiar.intervalHours": "En {amount} horas",
  "estudiar.intervalDays": "En {amount} días",
  "estudiar.tomorrow": "Mañana",
  "estudiar.noFurtherReviews": "No volver a repasar",
  "estudiar.retiredCanReturn": "Puedes reactivar las fichas retiradas después.",
  "estudiar.retiredConfirmation": "Ficha retirada del repaso automático.",
  "estudiar.saveFailedGeneric": "No se pudo guardar el repaso.",
  "estudiar.retrySameCard": "La ficha sigue aquí. Puedes volver a intentarlo.",
  "estudiar.nextReview": "Próximo repaso: {date}",
  "estudiar.nothingDue": "No hay fichas pendientes",
  "estudiar.nothingToPractice": "No hay fichas para repasar ahora",
  "estudiar.changeIntervals": "Cambiar intervalos",
  "estudiar.reviewedCount": [
    "Repasaste {count} ficha.",
    "Repasaste {count} fichas.",
  ],
  "estudiar.reviewedBefore": "Repasada {count} veces.",
  "estudiar.level.difficult": "Difícil",
  "estudiar.level.normal": "Normal",
  "estudiar.level.easy": "Fácil",
  "estudiar.level.veryEasy": "Súper fácil",
  "estudiar.emptyDeckTitle": "Este mazo no tiene tarjetas",
  "estudiar.emptyDeckLead": "No hay nada que practicar todavía.",
  "estudiar.addCards": "Agrega tarjetas",
  "estudiar.emptyDeckTail": "y vuelve a intentarlo.",
  "estudiar.adjustedTitle": "Ajustamos la práctica",
  "estudiar.counter": "{index} de {total}",
  "estudiar.sessionAria": "Progreso de la sesión: {index} de {total}",
  "estudiar.modeLegend": "Cómo quieres practicar",
  "estudiar.stateMastered": "Aprendida",
  "estudiar.stateLearning": "Practicando",
  "estudiar.stateNew": "Nueva",
  "estudiar.score": "{correct} de {attempts} aciertos",
  "estudiar.usageNote": "Nota de uso: ",
  "estudiar.continue": "Seguir",
  "estudiar.reviewHint": "Intenta recordar la traducción antes de revelarla.",
  "estudiar.didYouKnow": "¿La sabías?",
  "estudiar.knewIt": "Sí, la sabía",
  "estudiar.almost": "Casi",
  "estudiar.didNotKnow": "No la sabía",
  "estudiar.reveal": "Revelar respuesta",
  "estudiar.whatMeaning": "¿Cómo se dice en el otro idioma?",
  "estudiar.correctAnswer": "Correcto: {meaning}",
  "estudiar.wasAnswer": "La respuesta era «{meaning}».",
  "estudiar.fillInstruction":
    "Completa la frase con la palabra o expresión que falta.",
  "estudiar.answerLabel": "Tu respuesta",
  "estudiar.answerPlaceholder": "Escribe la respuesta en inglés",
  "estudiar.answerPlaceholderSpanish": "Escribe la respuesta en español",
  "estudiar.correctTyped":
    "¡Correcto! No importa si escribiste con mayúsculas o sin punto.",
  "estudiar.wasTerm": "Era «{term}».",
  "estudiar.check": "Comprobar",
  "estudiar.sessionDone": "Sesión terminada",
  "estudiar.statPracticed": "Practicados",
  "estudiar.statCorrect": "Aciertos",
  "estudiar.statAccuracy": "Precisión",
  "estudiar.keepPracticingTitle": "Para seguir practicando",
  "estudiar.repeat": "Repetir la sesión",
  "estudiar.seeProgress": "Ver mi progreso",
  "estudiar.backToLibrary": "Volver a la biblioteca",
  "estudiar.savingProgress": "Guardando tu progreso…",
  "estudiar.saveFailed": "No se pudo guardar: {message}",

  // Avisos del motor de estudio
  "engine.notice.empty": "Este mazo todavía no tiene tarjetas.",
  "engine.notice.tooFewForChoice":
    "Con tan pocas tarjetas no hay suficientes alternativas para elegir entre varias, así que hacemos un repaso.",
  "engine.notice.noFillInTheBlank":
    "Ninguna tarjeta tiene el término dentro de su ejemplo, así que hacemos un repaso.",
  "engine.mode.elegir": "Elegir el significado",
  "engine.mode.completar": "Completar la frase",
  "engine.mode.revisar": "Repaso",
  "engine.mode.explorar": "Explorar",
  "engine.modeDescription.elegir":
    "Elige la traducción correcta entre cuatro opciones.",
  "engine.modeDescription.completar":
    "Escribe la palabra o frase que falta en la oración.",
  "engine.modeDescription.revisar":
    "Mira la tarjeta, revela la respuesta y di si la sabías.",
  "engine.modeDescription.explorar":
    "Lee el contenido con su ejemplo y su nota de uso.",

  // -------------------------------------------------------------------------
  // Mazo público
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Crear mazo a mano
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Crear mazo con IA
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Revisión de tarjetas generadas
  // -------------------------------------------------------------------------
  "review.title": "Tarjetas",
  "review.keptOf": "{kept} de {total}",
  "review.restore": "Recuperar",
  "review.remove": "Quitar",
  "review.saving": "Guardando…",
  "review.saveCards": "Guardar {count} tarjetas",
  "review.discard": "Descartar y empezar de nuevo",
  "review.askMore": "Pedir otras tarjetas",

  // -------------------------------------------------------------------------
  // Editar mazo
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Campos de mazo (compartidos por crear, editar y revisar)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Idiomas y niveles que se ofrecen al crear un mazo
  // -------------------------------------------------------------------------
  "language.es": "Español",
  "language.en": "Inglés",
  "language.pt": "Portugués",
  "language.fr": "Francés",
  "language.de": "Alemán",
  "level.beginner": "Principiante",
  "level.intermediate": "Intermedio",
  "level.advanced": "Avanzado",
  "level.unspecified": "Sin nivel concreto",

  // -------------------------------------------------------------------------
  // Ajustes de repaso
  // -------------------------------------------------------------------------
  "ajustesRepaso.metaTitle": "Ajustes de repaso — Frasevia",
  "ajustesRepaso.eyebrow": "Mi biblioteca · Ajustes de repaso",
  "ajustesRepaso.title": "Repasa a tu ritmo",
  "ajustesRepaso.description":
    "Tú decides cuándo vuelve cada ficha. Los cambios se aplican a tus próximos repasos.",
  "ajustesRepaso.backLibrary": "Volver a mi biblioteca",
  "ajustesRepaso.levelsTitle": "Niveles de dificultad",
  "ajustesRepaso.levelsHint":
    "Elige el nombre, el intervalo y el orden de cada calificación.",
  "ajustesRepaso.name": "Nombre",
  "ajustesRepaso.action": "Acción",
  "ajustesRepaso.actionReview": "Volver a repasar",
  "ajustesRepaso.actionRetire": "Retirar del repaso",
  "ajustesRepaso.amount": "Cantidad",
  "ajustesRepaso.unit": "Intervalo",
  "ajustesRepaso.minutes": "Minutos",
  "ajustesRepaso.hours": "Horas",
  "ajustesRepaso.days": "Días",
  "ajustesRepaso.color": "Color",
  "ajustesRepaso.retireHint":
    "La ficha se conserva y puedes reactivarla después.",
  "ajustesRepaso.deactivate": "Desactivar",
  "ajustesRepaso.activate": "Activar",
  "ajustesRepaso.addLevel": "Añadir un nivel",
  "ajustesRepaso.customLevel": "Mi nivel",
  "ajustesRepaso.timezone": "Zona horaria: {timezone}",
  "ajustesRepaso.save": "Guardar cambios",
  "ajustesRepaso.saving": "Guardando…",
  "ajustesRepaso.reset": "Restablecer valores",
  "ajustesRepaso.saved": "Cambios guardados para los próximos repasos.",
  "ajustesRepaso.resetDone":
    "Se restablecieron los cuatro niveles predeterminados.",
  "ajustesRepaso.previewTitle": "Así se verá al estudiar",
  "ajustesRepaso.noActivePreview":
    "Activa un nivel para que aparezca durante el repaso.",
  "ajustesRepaso.moveUp": "Subir {name}",
  "ajustesRepaso.moveDown": "Bajar {name}",
  "ajustesRepaso.level.difficult": "Difícil",
  "ajustesRepaso.level.normal": "Normal",
  "ajustesRepaso.level.easy": "Fácil",
  "ajustesRepaso.level.veryEasy": "Súper fácil",
  "ajustesRepaso.color.coral": "Coral",
  "ajustesRepaso.color.sand": "Arena",
  "ajustesRepaso.color.sage": "Salvia",
  "ajustesRepaso.color.lime": "Lima",
  "ajustesRepaso.color.forest": "Bosque",
  "ajustesRepaso.color.blue": "Azul",
  "ajustesRepaso.retiredTitle": "Fichas retiradas",
  "ajustesRepaso.retiredDescription":
    "Puedes abrirlas para consultarlas y volver a incluirlas en el repaso automático.",
  "ajustesRepaso.noRetired": "Todavía no retiraste fichas del repaso.",
  "ajustesRepaso.openDeck": "Abrir mazo",
  "ajustesRepaso.reactivate": "Reactivar",
  "ajustesRepaso.reactivating": "Reactivando…",
  "ajustesRepaso.reactivated": "La ficha volvió a la cola como pendiente.",
  "ajustesRepaso.sessionExpired": "Tu sesión expiró. Vuelve a iniciar sesión.",
  "ajustesRepaso.invalidCard": "La ficha o la dirección no son válidas.",
  "ajustesRepaso.invalidAction": "No se reconoce esta acción.",
  "ajustesRepaso.invalidLevels":
    "Revisa los nombres e intervalos antes de guardar.",

  // -------------------------------------------------------------------------
  // Ajustes de IA
  // -------------------------------------------------------------------------
  "ajustesIa.metaTitle": "Ajustes de IA — Frasevia",
  "ajustesIa.eyebrow": "Ajustes",
  "ajustesIa.title": "Claves de IA",
  "ajustesIa.description":
    "Frasevia no trae claves propias. Pones la tuya y la aplicación la usa desde tu navegador. Pagas tú, a tu cuenta y con tus límites.",
  "ajustesIa.noKeyTitle": "Antes de nada: puedes no tener ninguna",
  "ajustesIa.noKeyBody":
    "Existe otra forma de generar tarjetas que no necesita clave: copiar un prompt a tu propio asistente y pegar aquí el JSON que devuelva.",
  "ajustesIa.goCreate": "Ir a crear un mazo con IA",
  "ajustesIa.noKeyTail":
    "Si no vas a usar la generación desde aquí, esta página se puede ignorar y no queda ninguna clave guardada en el navegador.",
  "ajustesIa.configured": "Configurada · {preview}",
  "ajustesIa.keyHint":
    "Se guarda en cuanto la escribes, así que no hay nada que confirmar. Para quitarla, usa Olvidar.",
  "ajustesIa.storageError":
    "Este navegador no dejó guardar la clave. Puede que tenga el almacenamiento bloqueado o lleno; prueba en modo incógnito o usa el modo de importar, que no necesita clave.",
  "ajustesIa.forget": "Olvidar",
  "ajustesIa.getKey": "Obtener una clave",
  "ajustesIa.scopingTitle": "Cómo asegurarla:",
  "ajustesIa.eraseTitle": "Borrarla",
  "ajustesIa.eraseSaved":
    "Al olvidarla no se pierde nada de tus mazos: solo se quita la clave de este navegador.",
  "ajustesIa.eraseNone":
    "Ahora mismo no hay ninguna clave guardada en este navegador.",
  "ajustesIa.forgetYes": "Sí, olvidarla",
  "ajustesIa.forgetKey": "Olvidar la clave",
  "ajustesIa.whyTitle": "Por qué no hay más proveedores aquí",
  "ajustesIa.whyBody1":
    "La generación directa sale del navegador, y solo funciona con servicios que envían cabeceras CORS. Se comprobó uno por uno: OpenRouter sí, y desde una sola clave cubre también los modelos de Google, Anthropic y MiniMax.",
  "ajustesIa.whyBody1Strong": "MiniMax no sirve desde el navegador",
  "ajustesIa.whyBody1Middle":
    "—su API no devuelve esas cabeceras—, por eso no aparece como opción propia. Si lo quieres usar, está en el catálogo de modelos de OpenRouter o en el modo de importar.",
  "ajustesIa.whyBody2Lead":
    "Y sobre Claude Code: sus credenciales de suscripción",
  "ajustesIa.whyBody2Strong": "no son una clave de API",
  "ajustesIa.whyBody2Tail":
    "y no valen para esto. No hace falta una aquí, porque el modo de importar ya usa la IA que tengas abierta.",

  // -------------------------------------------------------------------------
  // Proveedor de IA
  // -------------------------------------------------------------------------
  "provider.blurb":
    "Una sola clave da acceso a GPT, Claude, Gemini, MiniMax y muchos más.",
  "provider.keyName": "API key de OpenRouter",
  "provider.scoping":
    "En OpenRouter, la clave se puede limitar por presupuesto y por sitio de referencia; activar las dos deja una clave robada sin margen de daño.",

  // -------------------------------------------------------------------------
  // Errores de generación
  // -------------------------------------------------------------------------
  "generation.detailSuffix": " Detalle: {detail}",
  "generation.invalidKey":
    "La clave de OpenRouter no es válida. Revísala en «Ajustes de IA».",
  "generation.rejected":
    "OpenRouter rechazó la petición. Suele ser la clave sin saldo, o con la restricción de referencias web activada y este sitio sin añadir.",
  "generation.rateLimited":
    "OpenRouter dice que se alcanzó el límite de peticiones o que no queda crédito.",
  "generation.unknownModel":
    "OpenRouter no reconoce el modelo «{model}». Los identificadores cambian con frecuencia: búscalo en el catálogo de la pantalla anterior, que se pide al momento.",
  "generation.providerDown":
    "OpenRouter está teniendo problemas ahora mismo. Prueba en un momento.",
  "generation.failedWithStatus":
    "La petición a OpenRouter falló con el estado {status}.",
  "generation.missingKey":
    "Falta la clave de OpenRouter. Añádela en «Ajustes de IA», o usa el modo de importar, que no necesita clave.",
  "generation.pickModel":
    "Elige un modelo. El catálogo se pide al OpenRouter y no necesita clave.",
  "generation.network":
    "No se pudo contactar con OpenRouter desde el navegador. Comprueba la conexión e inténtalo de nuevo.",
  "generation.badJson":
    "OpenRouter respondió con algo que no se pudo leer como JSON.",
  "generation.emptyResponse":
    "El modelo respondió vacío. Puede que se haya quedado sin tokens a mitad; prueba con menos tarjetas o con otro modelo.",
  "generation.emptyTranslation":
    "El modelo no devolvió una traducción. Puedes escribirla manualmente.",

  "models.network": "No se pudo contactar con OpenRouter para ver los modelos.",
  "models.badStatus":
    "OpenRouter respondió con el estado {status} al pedir el catálogo de modelos.",
  "models.empty":
    "OpenRouter no devolvió ningún modelo utilizable. Se puede escribir el identificador a mano.",

  "draft.notADeck":
    "El modelo no devolvió nada con forma de mazo. Prueba con otro modelo o a reiterar la petición.",
  "draft.malformed":
    "La respuesta del modelo estaba cortada o mal formada. Prueba otra vez.",
  "draft.noUsableCards":
    "No encontramos tarjetas completas. Cada una necesita contenido en las dos caras.",
  "draft.defaultTitle": "Mazo generado con IA",

  // -------------------------------------------------------------------------
  // Guardado rápido de texto seleccionado
  // -------------------------------------------------------------------------
  "selection.menuLabel": "Acciones para el texto seleccionado",
  "selection.addToDeck": "Añadir a un mazo",
  "selection.closeMenu": "Cerrar menú",
  "selection.dialogTitle": "Guardar para repasar",
  "selection.dialogDescription":
    "Frasevia sugerirá una traducción con tu clave de OpenRouter. Puedes editarla antes de guardar.",
  "selection.selectedLanguage": "El texto seleccionado está en",
  "selection.english": "Inglés",
  "selection.spanish": "Español",
  "selection.destinationDeck": "Guardar en",
  "selection.createDeck": "Crear un mazo nuevo",
  "selection.newDeckName": "Nombre del mazo",
  "selection.newDeckPlaceholder": "Por ejemplo, Repaso rápido",
  "selection.translationRequired":
    "Escribe la palabra en inglés y su traducción al español.",
  "selection.translationTooLong":
    "El inglés admite hasta 200 caracteres y el español hasta 400.",
  "selection.translating": "Preparando una sugerencia de traducción…",
  "selection.suggestionReady":
    "Sugerencia lista. Puedes editarla antes de guardar.",
  "selection.translationNeedsKey":
    "Añade una clave de OpenRouter en Ajustes de IA para sugerir una traducción. También puedes escribirla manualmente.",
  "selection.configureAi": "Configurar IA",
  "selection.translationTooLongForSuggestion":
    "La sugerencia automática admite selecciones de hasta 200 caracteres. Puedes escribir la traducción manualmente.",
  "selection.translationSuggestionFailed":
    "No se pudo sugerir una traducción. Puedes escribirla manualmente.",
  "selection.deckUnavailable": "Ese mazo ya no está disponible.",
  "selection.sessionUnavailable":
    "Tu sesión terminó. Vuelve a entrar para guardar la palabra.",
  "selection.deckNameRequired": "Escribe un nombre para el mazo nuevo.",
  "selection.deckNameTooLong":
    "El nombre del mazo es demasiado largo. Usa menos de 120 caracteres.",
  "selection.saveFailed": "No se pudo guardar la palabra. Inténtalo de nuevo.",
  "selection.deckLoadError":
    "No se pudieron cargar tus mazos. Puedes crear uno nuevo.",
  "selection.saving": "Guardando…",
  "selection.save": "Guardar palabra",
  "selection.savedTitle": "Palabra guardada",
  "selection.saved": "Ya puedes repasar en «{deck}».",
  "selection.practiceNow": "Practicar ahora",
} satisfies Messages;

/** Todas las claves que la aplicación puede pedir. */
export type SpanishKey = keyof typeof es;

/** El catálogo español, indexado por clave. */
export type SpanishMessages = { [K in SpanishKey]: MessageValue };
