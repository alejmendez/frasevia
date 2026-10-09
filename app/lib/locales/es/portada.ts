import type { Messages } from "../types";

/**
 * Portada y las pantallas de acceso.
 */
export const portada = {
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
} satisfies Messages;
