/**
 * La interfaz compartida: botones, campos, cajas, avisos.
 *
 * Antes era un solo archivo de casi 400 líneas que había que abrir entero para
 * encontrar una clase. Ahora cada archivo tiene un motivo —botones, campos,
 * contenedores, avisos— y quien importa sigue diciendo `~/components/ui`.
 *
 * La regla que sostiene el módulo es la del `README`: aquí no se sabe nada de
 * mazos, de estudio ni de la sesión. Lo que sabe, vive en `app/features/`.
 */

export { Button, ButtonLink, type ButtonVariant, buttonClass } from "./button";
export {
  Alert,
  type AlertVariant,
  ConfigNotice,
  EmptyState,
  LoadingState,
  ProgressBar,
  Tag,
} from "./feedback";
export { Field, inputClass, Select, Textarea, textareaClass } from "./field";
export { Card, cx, Page, PageHeader, SectionTitle } from "./layout";
