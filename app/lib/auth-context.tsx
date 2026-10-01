import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { getSupabaseBrowser } from "./supabase";
import type { AuthUser } from "./types";

/**
 * Estado de autenticación para toda la aplicación.
 *
 * Se resuelve solo en el navegador porque la sesión de Supabase vive en
 * `localStorage`. Arranca en "loading" tanto en el servidor como en el cliente,
 * de modo que el marcado inicial coincide y no hay errores de hidratación; el
 * navbar muestra un espacio reservado hasta saber si hay sesión.
 */
export type AuthStatus =
  | "loading"
  | "unconfigured"
  | "authenticated"
  | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  status: "loading",
  user: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setStatus(session ? "authenticated" : "anonymous");
      setUser(
        session
          ? { id: session.user.id, email: session.user.email ?? null }
          : null,
      );
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setStatus("anonymous");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ status, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
