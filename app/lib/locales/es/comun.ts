import type { Messages } from "../types";

/**
 * El tipo de estudio, el repaso general y los ejemplos de la portada.
 *
 * Estas claves no viven en la pantalla de la que hablan, sino en varios sitios a
 * la vez: `studyMode.*` aparece en crear un mazo, editarlo y filtrar la
 * biblioteca, y `general.*` en las cuatro prácticas de estudio. Por eso están
 * aquí y no en la pantalla donde más se ven.
 *
 * Los textos de ejemplo de la portada (`inicio.demoGeneral*`) no se traducen: son
 * el contenido del mazo de muestra, y el idioma de la interfaz no es el del
 * contenido. En un libro en español las citas en inglés siguen en inglés.
 */
export const comun = {
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
} satisfies Messages;
