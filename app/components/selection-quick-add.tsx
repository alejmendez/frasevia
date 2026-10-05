import {
  BookmarkSimpleIcon,
  CircleNotchIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  GenerationError,
  isAbort,
  suggestTranslation,
} from "~/features/ai/generate";
import { hasKey } from "~/features/ai/keys";
import type { QuickAddDeck } from "~/lib/decks";
import { useT } from "~/lib/locale-context";
import { getSession } from "~/lib/session";
import { Alert, Button, Field, inputClass, Select } from "./ui";

const NEW_DECK = "__new__";

interface SelectionAnchor {
  text: string;
  left: number;
  top: number;
}

export function SelectionQuickAdd({
  decks,
  deckLoadError,
  sharedText,
}: {
  decks: QuickAddDeck[];
  deckLoadError: string | null;
  sharedText: string | null;
}) {
  const tr = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);
  const [dialogText, setDialogText] = useState<string | null>(null);
  const [availableDecks, setAvailableDecks] = useState(decks);
  const lastSharedText = useRef<string | null>(null);
  const menuPointerActive = useRef(false);

  useEffect(() => setAvailableDecks(decks), [decks]);

  useEffect(() => {
    function updateSelection() {
      const selection = window.getSelection();
      const text = selection?.toString().trim().replace(/\s+/g, " ");
      if (
        !selection ||
        !text ||
        text.length > 200 ||
        selection.rangeCount < 1
      ) {
        if (!menuPointerActive.current) setAnchor(null);
        return;
      }

      const main = document.querySelector("main");
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const element = node instanceof Element ? node : node.parentElement;
      if (
        !main?.contains(element) ||
        element?.closest(
          "a, button, input, textarea, select, dialog, [contenteditable='true'], [data-no-word-save]",
        )
      ) {
        setAnchor(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setAnchor(null);
        return;
      }

      const menuWidth = 300;
      const desiredTop = rect.top > 76 ? rect.top - 58 : rect.bottom + 10;
      setAnchor({
        text,
        left: Math.max(
          12,
          Math.min(
            rect.left + rect.width / 2 - menuWidth / 2,
            window.innerWidth - menuWidth - 12,
          ),
        ),
        top: Math.min(
          Math.max(12, desiredTop),
          Math.max(12, window.innerHeight - 68),
        ),
      });
    }

    document.addEventListener("selectionchange", updateSelection);
    window.addEventListener("resize", updateSelection);
    window.addEventListener("scroll", updateSelection, true);
    return () => {
      document.removeEventListener("selectionchange", updateSelection);
      window.removeEventListener("resize", updateSelection);
      window.removeEventListener("scroll", updateSelection, true);
    };
  }, []);

  useEffect(() => {
    const text = sharedText?.trim();
    if (!text) {
      lastSharedText.current = null;
      return;
    }
    if (text === lastSharedText.current) {
      return;
    }

    lastSharedText.current = text;
    setAnchor(null);
    setDialogText(text.replace(/\s+/g, " "));

    const search = new URLSearchParams(location.search);
    search.delete("text");
    search.delete("title");
    search.delete("url");
    void navigate(
      { search: search.size > 0 ? `?${search.toString()}` : "" },
      { replace: true, preventScrollReset: true },
    );
  }, [location.search, navigate, sharedText]);

  return (
    <>
      {anchor ? (
        <fieldset
          data-no-word-save
          aria-label={tr("selection.menuLabel")}
          className="fixed z-50 flex min-w-0 max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl border border-line-strong bg-paper-raised p-2 text-ink shadow-lg"
          style={{ left: anchor.left, top: anchor.top }}
          onPointerDownCapture={() => {
            menuPointerActive.current = true;
          }}
          onPointerUpCapture={() => {
            window.requestAnimationFrame(() => {
              menuPointerActive.current = false;
            });
          }}
          onPointerCancelCapture={() => {
            menuPointerActive.current = false;
          }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <span className="min-w-0 max-w-32 truncate px-1 text-sm text-ink-soft">
            {anchor.text}
          </span>
          <Button
            type="button"
            className="min-h-10 shrink-0 px-3 py-2"
            onClick={() => setDialogText(anchor.text)}
          >
            <BookmarkSimpleIcon aria-hidden size={17} weight="fill" />
            {tr("selection.addToDeck")}
          </Button>
          <button
            type="button"
            aria-label={tr("selection.closeMenu")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-sunken hover:text-ink"
            onClick={() => setAnchor(null)}
          >
            <XIcon aria-hidden size={17} />
          </button>
        </fieldset>
      ) : null}

      {dialogText ? (
        <QuickAddDialog
          key={dialogText}
          text={dialogText}
          decks={availableDecks}
          deckLoadError={deckLoadError}
          onSaved={(deck) =>
            setAvailableDecks((current) =>
              current.some((item) => item.id === deck.id)
                ? current
                : [...current, deck].sort((a, b) =>
                    a.title.localeCompare(b.title),
                  ),
            )
          }
          onClose={() => {
            setDialogText(null);
            setAnchor(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      ) : null}
    </>
  );
}

function QuickAddDialog({
  text,
  decks,
  deckLoadError,
  onSaved,
  onClose,
}: {
  text: string;
  decks: QuickAddDeck[];
  deckLoadError: string | null;
  onSaved: (deck: QuickAddDeck) => void;
  onClose: () => void;
}) {
  const tr = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "es">(
    guessLanguage(text),
  );
  const [english, setEnglish] = useState(() =>
    guessLanguage(text) === "en" ? text : "",
  );
  const [spanish, setSpanish] = useState(() =>
    guessLanguage(text) === "es" ? text : "",
  );
  const [deckId, setDeckId] = useState(decks[0]?.id ?? NEW_DECK);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestionState, setSuggestionState] = useState<
    "loading" | "ready" | "error" | "missing-key" | "too-long"
  >("loading");
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const translationEdited = useRef(false);
  const [saving, setSaving] = useState(false);
  const [savedDeck, setSavedDeck] = useState<QuickAddDeck | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    const sourceLanguage = selectedLanguage;
    const targetLanguage = sourceLanguage === "en" ? "es" : "en";
    const controller = new AbortController();
    let active = true;
    setSuggestionError(null);

    if (text.length > 200) {
      setSuggestionState("too-long");
      return () => {
        active = false;
        controller.abort();
      };
    }

    if (!hasKey()) {
      setSuggestionState("missing-key");
      return () => {
        active = false;
        controller.abort();
      };
    }

    setSuggestionState("loading");
    void suggestTranslation({
      text,
      sourceLanguage,
      targetLanguage,
      signal: controller.signal,
    })
      .then((suggestion) => {
        if (!active) return;
        if (!translationEdited.current) {
          if (targetLanguage === "en") setEnglish(suggestion);
          else setSpanish(suggestion);
        }
        setSuggestionState("ready");
      })
      .catch((error: unknown) => {
        if (!active || isAbort(error)) return;
        setSuggestionState("error");
        setSuggestionError(
          error instanceof GenerationError
            ? error.message
            : tr("selection.translationSuggestionFailed"),
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedLanguage, text, tr]);

  function close() {
    if (!dialogRef.current?.open) return;
    dialogRef.current.close();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const term = english.trim();
    const meaning = spanish.trim();
    if (!term || !meaning) {
      setFormError(tr("selection.translationRequired"));
      return;
    }
    if (term.length > 200 || meaning.length > 400) {
      setFormError(tr("selection.translationTooLong"));
      return;
    }

    const selectedDeck = decks.find((deck) => deck.id === deckId);
    if (deckId !== NEW_DECK && !selectedDeck) {
      setFormError(tr("selection.deckUnavailable"));
      return;
    }

    setSaving(true);
    try {
      const session = await getSession();
      if (session.status !== "ready") {
        setFormError(tr("selection.sessionUnavailable"));
        return;
      }

      let deck = selectedDeck;
      let createdDeckId: string | null = null;
      if (deckId === NEW_DECK) {
        const title = newDeckTitle.trim();
        if (!title) {
          setFormError(tr("selection.deckNameRequired"));
          return;
        }

        const { data, error } = await session.supabase
          .from("decks")
          .insert({
            author_id: session.userId,
            title,
            description: "",
            source_language: "es",
            target_language: "en",
            visibility: "private",
          })
          .select("id, title, source_language, target_language")
          .single();

        if (error || !data) {
          setFormError(error?.message ?? tr("selection.saveFailed"));
          return;
        }

        deck = data as QuickAddDeck;
        createdDeckId = deck.id;
      }

      if (!deck) {
        setFormError(tr("selection.deckUnavailable"));
        return;
      }

      const { data: lastCard, error: positionError } = await session.supabase
        .from("cards")
        .select("position")
        .eq("deck_id", deck.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (positionError) {
        if (createdDeckId) {
          await session.supabase
            .from("decks")
            .delete()
            .eq("id", createdDeckId)
            .eq("author_id", session.userId);
        }
        setFormError(positionError.message);
        return;
      }

      const { error: cardError } = await session.supabase.from("cards").insert({
        deck_id: deck.id,
        kind: /\s/.test(term) ? "phrase" : "word",
        term,
        meaning_es: meaning,
        example_en: null,
        example_es: null,
        usage_note: null,
        tags: [],
        position: ((lastCard?.position as number | undefined) ?? -1) + 1,
      });

      if (cardError) {
        if (createdDeckId) {
          await session.supabase
            .from("decks")
            .delete()
            .eq("id", createdDeckId)
            .eq("author_id", session.userId);
        }
        setFormError(cardError.message);
        return;
      }

      onSaved(deck);
      setSavedDeck(deck);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : tr("selection.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      data-no-word-save
      aria-labelledby="selection-dialog-title"
      className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-card border border-line bg-paper-raised p-0 text-ink shadow-xl backdrop:bg-ink/40"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="p-5 sm:p-7">
        {savedDeck ? (
          <>
            <h2
              id="selection-dialog-title"
              className="font-display text-2xl text-brand"
            >
              {tr("selection.savedTitle")}
            </h2>
            <p className="mt-3 text-ink-soft">
              {tr("selection.saved", { deck: savedDeck.title })}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                {tr("common.done")}
              </Button>
              <Link
                to={`/estudiar/${savedDeck.id}`}
                onClick={close}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-medium text-on-solid hover:bg-brand-solid-hover"
              >
                {tr("selection.practiceNow")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2
              id="selection-dialog-title"
              className="font-display text-2xl text-brand"
            >
              {tr("selection.dialogTitle")}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {tr("selection.dialogDescription")}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {deckLoadError ? (
                <Alert variant="warning">{tr("selection.deckLoadError")}</Alert>
              ) : null}
              {formError ? <Alert variant="error">{formError}</Alert> : null}

              <Field
                label={tr("selection.selectedLanguage")}
                htmlFor="selection-language"
              >
                <Select
                  id="selection-language"
                  value={selectedLanguage}
                  onChange={(event) => {
                    const language = event.target.value as "en" | "es";
                    translationEdited.current = false;
                    setSelectedLanguage(language);
                    if (language === "en") {
                      setEnglish(text);
                      setSpanish((current) =>
                        current === text ? "" : current,
                      );
                    } else {
                      setSpanish(text);
                      setEnglish((current) =>
                        current === text ? "" : current,
                      );
                    }
                  }}
                >
                  <option value="en">{tr("language.en")}</option>
                  <option value="es">{tr("language.es")}</option>
                </Select>
              </Field>

              {suggestionState === "loading" ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-muted px-3 py-2.5 text-sm text-brand-strong"
                >
                  <CircleNotchIcon
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 animate-spin"
                  />
                  <span>{tr("selection.translating")}</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr("selection.english")} htmlFor="selection-en">
                  <input
                    id="selection-en"
                    lang="en"
                    type="text"
                    value={english}
                    onChange={(event) => setEnglish(event.target.value)}
                    maxLength={200}
                    required
                    autoFocus={selectedLanguage === "en"}
                    className={inputClass}
                  />
                </Field>
                <Field label={tr("selection.spanish")} htmlFor="selection-es">
                  <input
                    id="selection-es"
                    lang="es"
                    type="text"
                    value={spanish}
                    onChange={(event) => setSpanish(event.target.value)}
                    maxLength={400}
                    required
                    autoFocus={selectedLanguage === "es"}
                    className={inputClass}
                  />
                </Field>
              </div>

              {suggestionState === "ready" ? (
                <p role="status" className="text-sm text-ink-soft">
                  {tr("selection.suggestionReady")}
                </p>
              ) : null}
              {suggestionState === "error" ? (
                <Alert variant="warning">
                  {suggestionError ??
                    tr("selection.translationSuggestionFailed")}
                </Alert>
              ) : null}
              {suggestionState === "missing-key" ? (
                <p role="status" className="text-sm text-ink-soft">
                  {tr("selection.translationNeedsKey")}{" "}
                  <Link
                    to="/ajustes/ia"
                    onClick={close}
                    className="font-medium text-brand underline"
                  >
                    {tr("selection.configureAi")}
                  </Link>
                </p>
              ) : null}
              {suggestionState === "too-long" ? (
                <p role="status" className="text-sm text-ink-soft">
                  {tr("selection.translationTooLongForSuggestion")}
                </p>
              ) : null}

              <Field
                label={tr("selection.destinationDeck")}
                htmlFor="quick-deck"
              >
                <Select
                  id="quick-deck"
                  value={deckId}
                  onChange={(event) => setDeckId(event.target.value)}
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.title}
                    </option>
                  ))}
                  <option value={NEW_DECK}>{tr("selection.createDeck")}</option>
                </Select>
              </Field>

              {deckId === NEW_DECK ? (
                <Field
                  label={tr("selection.newDeckName")}
                  htmlFor="quick-new-deck"
                >
                  <input
                    id="quick-new-deck"
                    value={newDeckTitle}
                    onChange={(event) => setNewDeckTitle(event.target.value)}
                    maxLength={120}
                    required
                    placeholder={tr("selection.newDeckPlaceholder")}
                    className={inputClass}
                  />
                </Field>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  disabled={saving}
                >
                  {tr("common.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? tr("selection.saving") : tr("selection.save")}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}

function guessLanguage(text: string): "en" | "es" {
  return /[ñáéíóú¿¡]|\b(?:el|la|los|las|una?|que|de|del|para|con|pero|está)\b/i.test(
    text,
  )
    ? "es"
    : "en";
}
