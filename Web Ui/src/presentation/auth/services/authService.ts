import { User } from "firebase/auth";

import {
  setCookieAndGlobalStateForValidUser,
} from "../../../modules/User-Authentication/application/setCookieAndGlobalStateForValidUser";

import {
  CheckIfUserHasAccount,
} from "../../../modules/User-Authentication/application/checkIfUserHasAccount";

import {
  fireBaseAuthManager,
  OAuthProvider,
} from "../../../modules/User-Authentication/infrastructure/authFirebase";

const USER_NOT_REGISTERED_MESSAGE =
  "Disculpa, tu usuario no está registrado. Por favor, regístrate primero.";

export const handleSignInWithGoogle = async (): Promise<void> => {
  return fireBaseAuthManager.loginWithOAuth(
    OAuthProvider.Google,
  );
};

export const handleAuthResult = async ({
  user,
  isGoogle,
  onSuccess,
}: {
  user: User | null;
  isGoogle: boolean;
  onSuccess: () => void;
}) => {
  if (!user?.email) {
    throw new Error(
      USER_NOT_REGISTERED_MESSAGE,
    );
  }

  const idToken = await user.getIdToken();

  const loginPort = new CheckIfUserHasAccount();

  const userCourse = isGoogle
    ? await loginPort.userHasAnAccountWithGoogleToken(
        idToken,
      )
    : await loginPort.userHasAnAccountWithToken(
        idToken,
      );

  if (!userCourse) {
    throw new Error(
      USER_NOT_REGISTERED_MESSAGE,
    );
  }

  setCookieAndGlobalStateForValidUser(
    user,
    userCourse,
    onSuccess,
  );

  localStorage.setItem(
    "userProfilePic",
    user.photoURL || "",
  );
};
