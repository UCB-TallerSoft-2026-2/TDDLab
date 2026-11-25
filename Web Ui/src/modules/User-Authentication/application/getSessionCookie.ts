import axios from "axios";
import { VITE_API } from "../../../../config.ts";

const API_URL = VITE_API;
const SESSION_REQUEST_TIMEOUT_MS = 5000;

const isSessionResponse = (
  value: unknown,
): value is {
  id: number;
  email: string;
  groupid: number;
  role: string;
} => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "number" &&
    typeof session.email === "string" &&
    typeof session.groupid === "number" &&
    typeof session.role === "string"
  );
};

type SessionData = {
  id: number;
  email: string;
  groupid: number;
  role: string;
};

let pendingSessionRequest: Promise<SessionData | null> | null = null;

export const getSessionCookie = (): Promise<SessionData | null> => {
  if (pendingSessionRequest) {
    return pendingSessionRequest;
  }

  pendingSessionRequest = axios
    .get(API_URL + "/user/me", {
      withCredentials: true,
      timeout: SESSION_REQUEST_TIMEOUT_MS,
    })
    .then((res) => {
      const userData = res.data;
      return isSessionResponse(userData) ? userData : null;
    })
    .catch((error) => {
      console.error("Error retrieving session cookie:", error);
      return null;
    })
    .finally(() => {
      pendingSessionRequest = null;
    });

  return pendingSessionRequest;
};
