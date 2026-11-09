import {
  AuthRequest,
  CodeChallengeMethod,
  ResponseType,
} from "expo-auth-session";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { maybeCompleteAuthSession } from "expo-web-browser";
import { hc } from "hono/client";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import type {
  AccountUser,
  ApiErrorBody,
  AuthSession,
} from "../shared/api-types";
import type { AppType } from "../worker";

// The app talks only to the Worker. It never sees the WorkOS API key; it only
// holds a short-lived access token (memory) and, on native, the refresh token
// (Keychain / Keystore). On web the refresh token is an httpOnly cookie.

const isWeb = Platform.OS === "web";
const PLATFORM = isWeb ? "web" : "native";
const REFRESH_TOKEN_KEY = "practice.refreshToken";
const NATIVE_REDIRECT_URI = "practice://callback";
const PRODUCTION_API_URL = "https://practice.praveenjuge.com";

const apiUrl = isWeb
  ? globalThis.location.origin
  : (process.env.EXPO_PUBLIC_API_URL ?? PRODUCTION_API_URL);

// Finishes the web sign-in popup when it lands back on /callback. The popup
// closes itself, so it must not touch the session.
const isCompletingWebSignIn =
  isWeb && maybeCompleteAuthSession().type === "success";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: AccountUser };

let state: SessionState = { status: "loading" };
let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

const setState = (next: SessionState) => {
  state = next;
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getState = () => state;

export const useSession = () => useSyncExternalStore(subscribe, getState);

const readRefreshToken = () =>
  isWeb ? Promise.resolve(undefined) : getItemAsync(REFRESH_TOKEN_KEY);

const clearLocalSession = async () => {
  accessToken = null;
  if (!isWeb) {
    await deleteItemAsync(REFRESH_TOKEN_KEY);
  }
  setState({ status: "signedOut" });
};

const readError = async (response: { json: () => Promise<unknown> }) => {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Not JSON: fall through to the generic message.
  }
  return "Something went wrong. Please try again.";
};

const applySession = async ({
  accessToken: token,
  refreshToken,
  user,
}: AuthSession) => {
  accessToken = token;
  if (refreshToken) {
    await setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
  setState({ status: "signedIn", user });
};

const postAuth = (path: string, body: object) =>
  fetch(`${apiUrl}/api/auth/${path}`, {
    body: JSON.stringify({ ...body, platform: PLATFORM }),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

// Returns false only when the server says the session is over; network
// failures throw so a flaky connection never signs the user out.
const refreshSession = (): Promise<boolean> => {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await readRefreshToken();
      if (!(isWeb || refreshToken)) {
        return false;
      }
      const response = await postAuth("refresh", { refreshToken });
      if (response.status === 401) {
        return false;
      }
      if (!response.ok) {
        throw new ApiError(await readError(response), response.status);
      }
      await applySession((await response.json()) as AuthSession);
      return true;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

const withToken = (init: RequestInit | undefined, token: string | null) => {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
};

// fetch for API calls: adds the access token and, on a 401, refreshes once
// and retries. Signs the user out when the refresh is rejected.
const authedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const response = await fetch(input, withToken(init, accessToken));
  if (response.status !== 401) {
    return response;
  }
  if (!(await refreshSession())) {
    await clearLocalSession();
    return response;
  }
  return fetch(input, withToken(init, accessToken));
};

export const { api } = hc<AppType>(apiUrl, { fetch: authedFetch });

// Resolves a Hono client response to its JSON body, or throws the server's
// error message.
export const unwrap = async <T>(
  request: Promise<{ json: () => Promise<T>; ok: boolean; status: number }>
): Promise<T> => {
  const response = await request;
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  return response.json();
};

export const restoreSession = async () => {
  if (isCompletingWebSignIn) {
    return;
  }
  try {
    if (!(await refreshSession())) {
      await clearLocalSession();
    }
  } catch {
    // Offline or server error: keep the stored session and show signed out
    // for now; the next launch tries again.
    setState({ status: "signedOut" });
  }
};

// Opens WorkOS AuthKit (via the Worker) in the system browser sheet, then
// trades the code + PKCE verifier for a session on the Worker.
export const signIn = async () => {
  const request = new AuthRequest({
    clientId: "practice",
    codeChallengeMethod: CodeChallengeMethod.S256,
    redirectUri: isWeb
      ? `${globalThis.location.origin}/callback`
      : NATIVE_REDIRECT_URI,
    responseType: ResponseType.Code,
    usePKCE: true,
  });
  const result = await request.promptAsync({
    authorizationEndpoint: `${apiUrl}/api/auth/authorize`,
  });
  if (result.type !== "success") {
    if (result.type === "error") {
      throw new ApiError(
        result.error?.description ?? "Sign-in didn't go through.",
        400
      );
    }
    return;
  }
  const response = await postAuth("token", {
    code: result.params.code,
    codeVerifier: request.codeVerifier,
  });
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  await applySession((await response.json()) as AuthSession);
};

export const signOut = async () => {
  try {
    await api.auth.logout.$post();
  } finally {
    await clearLocalSession();
  }
};

export const deleteAccount = async () => {
  const response = await api.account.$delete();
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  await clearLocalSession();
};
