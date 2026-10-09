import type { Messages } from "../types";

/**
 * Ajustes de repaso, de IA y el proveedor.
 */
export const ajustes = {
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

  "provider.blurb":
    "Una sola clave da acceso a GPT, Claude, Gemini, MiniMax y muchos más.",
  "provider.keyName": "API key de OpenRouter",
  "provider.scoping":
    "En OpenRouter, la clave se puede limitar por presupuesto y por sitio de referencia; activar las dos deja una clave robada sin margen de daño.",

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
} satisfies Messages;
