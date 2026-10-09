import type { StudyCard } from "~/lib/types";

/**
 * Qué ejemplo va en cada idioma, y cuál es la traducción del otro.
 *
 * Las tres prácticas que muestran la tarjeta completa —explorar, repasar y elegir
 * significado— necesitan resolver exactamente esta pregunta y la tenían escrita
 * tres veces. La lógica va aquí; el estilo es de cada una y se queda allí.
 *
 * Un mazo de repaso general tiene un solo idioma, así que el ejemplo no se
 * traduce: es contexto, no una frase en el otro idioma.
 */
export interface PracticeExample {
  /** El ejemplo en el idioma que se está mirando. */
  target: string | null;
  /** Su traducción, si es que la hay. */
  translation: string | null;
}

export function practiceExample(card: StudyCard): PracticeExample {
  const targetLanguage = card.targetLanguage ?? "en";

  if (card.studyMode === "general") {
    return { target: card.exampleEn, translation: null };
  }

  return {
    target: targetLanguage === "es" ? card.exampleEs : card.exampleEn,
    translation: targetLanguage === "es" ? card.exampleEn : card.exampleEs,
  };
}
