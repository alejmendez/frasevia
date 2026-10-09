import { type ComponentProps, type ReactNode, useEffect, useRef } from "react";

import { cx } from "./ui";

/**
 * El modal.
 *
 * Se apoya en `<dialog>` nativo y no en una biblioteca porque el nativo ya hace
 * lo que cuesta más: atrapa el foco dentro, cierra con `Esc` y lo anuncia a los
 * lectores de pantalla. Lo único que hay que resolver es quién decide qué
 * significa «cerrar», y de eso se encarga `onClose`.
 *
 * Hay dos modales en la aplicación y los dos montaban el mismo `<dialog>` con las
 * mismas clases. El menú rápido además manejaba `Esc` a mano, por encima del
 * `onCancel` que ya lo hacía: dos caminos para lo mismo, y el que no servía.
 *
 * - `width` distingue el diálogo estrecho de confirmar del ancho de un formulario.
 * - `dismissOnBackdrop` cierra al pulsar fuera. El navegador no lo hace solo, y
 *   solo tiene sentido donde no se está haciendo algo a medias.
 * - `ref` lo necesita quien tenga que cerrarlo por su cuenta: para eso está el
 *   `close()` del propio `<dialog>`.
 */
export function ModalDialog({
  children,
  onClose,
  labelledBy,
  width = "narrow",
  dismissOnBackdrop = false,
  ref,
  className,
  ...rest
}: {
  children: ReactNode;
  onClose: () => void;
  /** El `id` del título, para que el diálogo se anuncie con nombre. */
  labelledBy: string;
  width?: "narrow" | "wide";
  dismissOnBackdrop?: boolean;
  className?: string;
} & Pick<ComponentProps<"dialog">, "ref"> &
  Omit<
    ComponentProps<"dialog">,
    "aria-labelledby" | "children" | "className" | "ref"
  >) {
  const fallbackRef = useRef<HTMLDialogElement>(null);
  const ownRef = ref ?? fallbackRef;
  // El `ref` puede ser un callback y no un objeto, y aquí solo hace falta
  // llamarlo, no leerlo.
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const setRef = (node: HTMLDialogElement | null) => {
    dialogRef.current = node;
    if (typeof ownRef === "function") {
      ownRef(node);
    } else if (ownRef) {
      ownRef.current = node;
    }
  };

  // El diálogo solo se monta cuando alguien lo pidió, así que se abre al montar.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: cerrar al pulsar fuera es un atajo de raton, y el teclado ya tiene su camino: `Esc` (el `onCancel` de abajo) y el boton de cerrar que cada dialogo trae en su contenido. Anadir un manejador de teclado aqui cerraria el dialogo con cualquier tecla.
    <dialog
      {...rest}
      ref={setRef}
      aria-labelledby={labelledBy}
      className={cx(
        "m-auto rounded-card border border-line bg-paper-raised p-0 text-ink shadow-xl backdrop:bg-ink/40",
        width === "narrow"
          ? "w-[min(28rem,calc(100vw-2rem))]"
          : "w-[min(34rem,calc(100vw-2rem))]",
        className,
      )}
      onCancel={(event) => {
        // `Esc` cierra el diálogo; lo que hubiera dentro nunca llega a enviarse.
        event.preventDefault();
        onClose();
      }}
      onClick={
        dismissOnBackdrop
          ? (event) => {
              // Solo si el pulso fue en el diálogo y no en algo suyo: dentro, el
              // objetivo es el hijo y esto no llega a ejecutarse.
              if (event.target === event.currentTarget) onClose();
            }
          : undefined
      }
    >
      {children}
    </dialog>
  );
}
