import { useAuth } from "~/lib/auth-context";
import { useT } from "~/lib/locale-context";
import {
  buttonClass,
  Card,
  Control,
  cx,
  DeckTiles,
  ITEMS,
  ModeOptions,
  Page,
  PageHeader,
  Placeholder,
  SkeletonButton,
  SkeletonField,
  Tag,
  TextLines,
} from "./primitives";

/**
 * Los esqueletos de las pantallas de acceso.
 *
 * Recuperar la contraseña es la única que se puede ver con la sesión ya iniciada,
 * porque se entra a ella desde un correo. Por eso el esqueleto depende del estado
 * de la sesión y no solo de la ruta.
 */

export function AuthSkeleton({
  kind,
}: {
  kind: "signIn" | "signUp" | "reset";
}) {
  const tr = useT();
  const { status } = useAuth();
  const recovery = kind === "reset" && status === "authenticated";
  const title =
    kind === "reset"
      ? tr(recovery ? "reset.newTitle" : "reset.title")
      : tr(`${kind}.title`);
  const description =
    kind === "reset"
      ? tr(recovery ? "reset.newBody" : "reset.body")
      : tr(`${kind}.description`);
  return (
    <Page className="max-w-md">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="mt-2 text-ink-soft">{description}</p>
      <div className={cx("space-y-5", kind === "reset" ? "mt-6" : "mt-8")}>
        <SkeletonField
          label={tr(recovery ? "reset.fieldNewPassword" : "signIn.fieldEmail")}
          hint={recovery ? tr("signUp.passwordHint") : undefined}
          required
        />
        {kind !== "reset" ? (
          <SkeletonField
            label={tr("signIn.fieldPassword")}
            hint={kind === "signUp" ? tr("signUp.passwordHint") : undefined}
            required
          />
        ) : null}
        <SkeletonButton className="w-full">
          {kind === "reset"
            ? tr(recovery ? "reset.savePassword" : "reset.sendLink")
            : kind === "signUp"
              ? tr("signUp.submit")
              : title}
        </SkeletonButton>
      </div>
      {kind !== "reset" ? (
        <div className="mt-6">
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-line" />
            {tr("google.divider")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <Placeholder className="mt-4 h-10 w-full rounded-lg" />
          <p className="mt-3 text-xs text-ink-faint">{tr("google.privacy")}</p>
        </div>
      ) : null}
      <div className="mt-6 space-y-2 text-sm text-ink-soft">
        {kind === "signIn" ? (
          <>
            <p className="text-brand">{tr("signIn.forgot")}</p>
            <p>
              {tr("signIn.noAccountYet")}{" "}
              <span className="text-brand">{tr("signIn.createOne")}</span>
            </p>
          </>
        ) : kind === "signUp" ? (
          <p>
            {tr("signUp.haveAccount")}{" "}
            <span className="text-brand">{tr("signUp.signInLink")}</span>
          </p>
        ) : (
          <p className="text-brand">{tr("reset.backToSignIn")}</p>
        )}
      </div>
    </Page>
  );
}
