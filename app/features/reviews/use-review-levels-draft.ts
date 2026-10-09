import { useCallback, useEffect, useState } from "react";

import type { ReviewLevel } from "~/lib/types";

/**
 * Los niveles de repaso que se están editando.
 *
 * La lista vive en estado y no se guarda hasta que se pulsa «Guardar», así que
 * hay que poder reordenarla, editarla y añadir niveles sin tocar la base. Tres
 * operaciones con una regla en común: **la posición es el lugar en la lista**.
 *
 * Por eso renumerar no es opcional. Si dos niveles tuvieran la misma posición, el
 * orden de los botones de la pantalla de estudio y el de esta lista dejarían de
 * coincidir, y quien reordena aquí vería algo distinto de lo que verá después.
 */
/** Cambia un nivel de la lista. */
export type UpdateLevel = (id: string, updates: Partial<ReviewLevel>) => void;

export interface ReviewLevelsDraft {
  levels: ReviewLevel[];
  update: UpdateLevel;
  /** Sube o baja un nivel un puesto. */
  move: (index: number, offset: number) => void;
  /** Añade un nivel propio al final. */
  add: (level: Omit<ReviewLevel, "position">) => void;
}

export function useReviewLevelsDraft(
  initial: ReviewLevel[],
  saved: ReviewLevel[] | undefined,
): ReviewLevelsDraft {
  const [levels, setLevels] = useState<ReviewLevel[]>(initial);

  // La respuesta del action trae los niveles ya guardados y ordenados por la base.
  // Sin esto, quien anade uno nuevo y sale sin querer volveria a ver la lista vieja.
  useEffect(() => {
    if (!saved) return;
    setLevels([...saved].sort((a, b) => a.position - b.position));
  }, [saved]);

  const update = useCallback((id: string, updates: Partial<ReviewLevel>) => {
    setLevels((current) =>
      current.map((level) =>
        level.id === id ? { ...level, ...updates } : level,
      ),
    );
  }, []);

  const move = useCallback((index: number, offset: number) => {
    setLevels((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;

      const reordered = [...current];
      [reordered[index], reordered[target]] = [
        reordered[target],
        reordered[index],
      ];
      return renumber(reordered);
    });
  }, []);

  const add = useCallback((level: Omit<ReviewLevel, "position">) => {
    setLevels((current) => [
      ...current,
      { ...level, position: current.length + 1 },
    ]);
  }, []);

  return { levels, update, move, add };
}

/** Renumera según el lugar en la lista. */
function renumber(levels: ReviewLevel[]): ReviewLevel[] {
  return levels.map((level, index) => ({ ...level, position: index + 1 }));
}
