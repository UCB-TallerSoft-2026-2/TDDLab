import {
  AuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  User,
  Unsubscribe,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";

import { auth } from "../../../firebaseConfig";
import isWebKit from "../../../utils/browserKit";

export enum OAuthProvider {
  Google = "google",
  Github = "github",
}

class FirebaseAuthManager {
  private readonly oAuthProviders: Record<
    OAuthProvider,
    AuthProvider
  > = {
    [OAuthProvider.Google]: new GoogleAuthProvider(),
    [OAuthProvider.Github]: new GithubAuthProvider(),
  };

  async loginWithOAuth(provider: OAuthProvider): Promise<void> {
    const firebaseProvider = this.oAuthProviders[provider];

    if (firebaseProvider instanceof GoogleAuthProvider) {
      firebaseProvider.setCustomParameters({
        prompt: "select_account",
      });
    }

    try {
      if (isWebKit()) {
        await signInWithRedirect(auth, firebaseProvider);
        return;
      }

      await signInWithPopup(auth, firebaseProvider);
    } catch (error) {
      console.error("Error en la autenticación:", error);
      throw error;
    }
  }

  onAuthStateChanged(
    callback: (user: User | null) => void,
  ): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  }

  async logout(): Promise<boolean> {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      return false;
    }
  }
}

export const fireBaseAuthManager = new FirebaseAuthManager();
