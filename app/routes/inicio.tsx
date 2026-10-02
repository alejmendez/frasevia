import { ButtonLink, Card, Tag } from "~/components/ui";
import { t } from "~/lib/locale";
import { useT } from "~/lib/locale-context";

const PILLARS = ["inicio.pillar1", "inicio.pillar2", "inicio.pillar3"] as const;

/**
 * Tarjetas de muestra de la portada.
 *
 * El término y el ejemplo van en inglés y el significado y la traducción en
 * español, y eso no cambia con el idioma de la interfaz: es contenido de
 * ejemplo, no un rótulo. Traducirlo al inglés sería hacer una tarjeta que no
 * enseña nada, porque se vería que el «significado» de una frase inglesa es la
 * misma frase inglesa.
 */
const EXAMPLES = [
  {
    term: "Could you clarify what you mean by that?",
    meaning: "¿Podrías aclarar a qué te refieres con eso?",
    example: "I want to make sure I got it right.",
    translation: "Quiero asegurarme de entender bien.",
  },
  {
    term: "How are you doing?",
    meaning: "¿Cómo estás?",
    example: "It has been a while.",
    translation: "Hacía mucho que no nos veíamos.",
  },
  {
    term: "The deadline is next Friday.",
    meaning: "La fecha límite es el próximo viernes.",
    example: "We need to move it up by two days.",
    translation: "Tenemos que adelantarla dos días.",
  },
];

export function meta() {
  return [
    { title: t("inicio.metaTitle") },
    {
      name: "description",
      content: t("inicio.metaDescription"),
    },
  ];
}

export default function Inicio() {
  const tr = useT();

  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {tr("inicio.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
            {tr("inicio.titleLead")}
            <span className="text-brand">{tr("inicio.titleAccent")}</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            {tr("inicio.body")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/explorar" variant="primary">
              {tr("inicio.ctaExplore")}
            </ButtonLink>
            <ButtonLink to="/crear-cuenta" variant="secondary">
              {tr("inicio.ctaSignUp")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Ejemplos de tarjetas ---------------------------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
        <h2 className="font-display text-2xl text-ink">
          {tr("inicio.cardsTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">{tr("inicio.cardsBody")}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {EXAMPLES.map((example) => (
            <Card key={example.term} as="article">
              <p className="font-display text-lg text-brand">{example.term}</p>
              <p className="mt-2 text-ink-soft">{example.meaning}</p>
              <div className="mt-4 border-t border-line pt-3 text-sm">
                <p className="text-ink">{example.example}</p>
                <p className="mt-1 text-ink-faint">{example.translation}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pilares ----------------------------------------------------------- */}
      <section className="border-y border-line bg-paper-sunken/60">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar}>
                <h3 className="font-display text-lg text-ink">
                  {tr(`${pillar}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {tr(`${pillar}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre ------------------------------------------------------------ */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
        <Card className="text-center">
          <h2 className="font-display text-2xl text-ink">
            {tr("inicio.startTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-ink-soft">
            {tr("inicio.startBody")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Tag tone="brand">{tr("inicio.tagBasics")}</Tag>
            <Tag tone="accent">{tr("inicio.tagDevs")}</Tag>
          </div>
          <div className="mt-6 flex justify-center">
            <ButtonLink to="/explorar">{tr("inicio.seeCatalog")}</ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}
