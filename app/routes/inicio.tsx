import { ButtonLink, Card, Tag } from "~/components/ui";

const PILLARS = [
  {
    title: "Tarjetas con contexto",
    body: "Cada palabra o frase trae su ejemplo, su traducción y una nota de uso, para que el contexto llegue antes que la definición.",
  },
  {
    title: "Cuatro formas de practicar",
    body: "Explorar, elegir el significado, completar la frase y repaso. Cambia de modo cuando el contenido no da para uno en concreto.",
  },
  {
    title: "Sesiones cortas",
    body: "Tantos elementos como quieras y un resumen al final. Sin rachas obligatorias: avanzas cuando puedes volver.",
  },
];

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
    { title: "Frasevia — aprende inglés con frases útiles" },
    {
      name: "description",
      content:
        "Mazos de inglés con ejemplos reales para personas hispanohablantes. Explora, crea tus propios mazos y registra tu progreso.",
    },
  ];
}

export default function Inicio() {
  return (
    <div>
      {/* Hero ------------------------------------------------------------- */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Inglés desde el español
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
            Aprende inglés con frases que
            <span className="text-brand"> alguien dijo de verdad</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Frasevia reúne palabras, frases y reglas sencillas con ejemplos
            naturales y su traducción. Crea tus propios mazos, compártelos y
            practica a tu ritmo, sin rachas que te presionen.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/explorar" variant="primary">
              Explorar mazos
            </ButtonLink>
            <ButtonLink to="/crear-cuenta" variant="secondary">
              Crear una cuenta
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Ejemplos de tarjetas ---------------------------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8">
        <h2 className="font-display text-2xl text-ink">
          Así se ve una tarjeta
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          El término en inglés, su significado, la frase donde aparece y cómo
          usarla. Todo en la misma pantalla.
        </p>

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
              <div key={pillar.title}>
                <h3 className="font-display text-lg text-ink">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {pillar.body}
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
            Empieza con el mazo de las bases
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-ink-soft">
            Saludos, presentaciones, preguntas básicas, números, horarios y los
            verbos que usas todos los días.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Tag tone="brand">Inglés desde las bases</Tag>
            <Tag tone="accent">Inglés para desarrolladores</Tag>
          </div>
          <div className="mt-6 flex justify-center">
            <ButtonLink to="/explorar">Ver el catálogo</ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}
