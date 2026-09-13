import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../../modules/User-Authentication/domain/authStore";

import {
  fireBaseAuthManager,
} from "../../../modules/User-Authentication/infrastructure/authFirebase";

import {
  handleAuthResult,
  handleSignInWithGoogle,
} from "../services/authService";

const OAUTH_PENDING_KEY = "auth:oauth-pending";

export const useAuth = () => {
  const navigate = useNavigate();

  const firebaseUser = useAuthStore(
    (state) => state.firebaseUser,
  );

  const isHydrated = useAuthStore(
    (state) => state.isHydrated,
  );

  const authData = useAuthStore(
    (state) => state.authData,
  );

  const setFirebaseUser = useAuthStore(
    (state) => state.setFirebaseUser,
  );

  const setLoading = useAuthStore(
    (state) => state.setLoading,
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe =
      fireBaseAuthManager.onAuthStateChanged((user) => {
        setFirebaseUser(user);
        setLoading(false);
      });

    return unsubscribe;
  }, [setFirebaseUser, setLoading]);

  useEffect(() => {
    if (!firebaseUser || !isHydrated) {
      return;
    }

    const oauthPending =
      sessionStorage.getItem(OAUTH_PENDING_KEY) === "true";

    if (!oauthPending) {
      return;
    }

    const authenticateUser = async () => {
      try {
        setLoading(true);
        setError(null);

        await handleAuthResult({
          user: firebaseUser,
          isGoogle: true,
          onSuccess: () => {
            sessionStorage.removeItem(OAUTH_PENDING_KEY);
            navigate("/");
          },
        });
      } catch (err: unknown) {
        sessionStorage.removeItem(OAUTH_PENDING_KEY);

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error al iniciar sesión";

        if (errorMessage.includes("GitHub")) {
          setError(
            "Este usuario está registrado con GitHub. Por favor, inicia sesión con GitHub.",
          );
        } else if (
          errorMessage.includes("no encontrado") ||
          errorMessage.includes("404")
        ) {
          setError(
            "Usuario no encontrado. Por favor, regístrate primero.",
          );
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [
    firebaseUser,
    isHydrated,
    navigate,
    setLoading,
  ]);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      sessionStorage.setItem(
        OAUTH_PENDING_KEY,
        "true",
      );

      await handleSignInWithGoogle();

      /*
       * En popup:
       *
       * signInWithPopup()
       *       ↓
       * onAuthStateChanged()
       *       ↓
       * firebaseUser
       *       ↓
       * handleAuthResult()
       *
       * En redirect:
       *
       * signInWithRedirect()
       *       ↓
       * Google
       *       ↓
       * vuelve a /login
       *       ↓
       * onAuthStateChanged()
       *       ↓
       * firebaseUser
       *       ↓
       * handleAuthResult()
       */
    } catch (err: unknown) {
      sessionStorage.removeItem(OAUTH_PENDING_KEY);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al iniciar sesión";

      setError(errorMessage);
      setLoading(false);
    }
  };

  return {
    loginWithGoogle,
    firebaseUser,
    authData,
    loading: useAuthStore((state) => state.isLoading),
    error,
    setError,
  };
};
