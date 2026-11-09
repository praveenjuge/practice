import type { AuthenticationResponse } from "@workos-inc/node";
import { type Context, Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import type { AuthSession } from "../shared/api-types";
import { type AppEnv, apiError } from "./env";
import { validate } from "./validate";
import { getWorkOS, isWorkOSClientError, requireUser } from "./workos";

const NATIVE_REDIRECT_URI = "practice://callback";
const REFRESH_COOKIE = "__Host-practice_refresh";
const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
// RFC 7636: verifiers are 43-128 characters; an S256 challenge is 43.
const PKCE_MIN_LENGTH = 43;
const PKCE_MAX_LENGTH = 128;
const MAX_STATE_LENGTH = 512;

const platformSchema = z.enum(["native", "web"]);
type Platform = z.infer<typeof platformSchema>;

const authorizeQuery = z.object({
  code_challenge: z.string().length(PKCE_MIN_LENGTH),
  redirect_uri: z.string(),
  state: z.string().min(1).max(MAX_STATE_LENGTH),
});

const tokenBody = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(PKCE_MIN_LENGTH).max(PKCE_MAX_LENGTH),
  platform: platformSchema,
});

const refreshBody = z.object({
  platform: platformSchema,
  refreshToken: z.string().min(1).optional(),
});

export const clearRefreshCookie = (c: Context<AppEnv>) => {
  deleteCookie(c, REFRESH_COOKIE, { path: "/", secure: true });
};

// Native apps keep the refresh token in the keychain/keystore; the web app
// gets it as an httpOnly cookie so page scripts never see it.
const sessionResponse = (
  c: Context<AppEnv>,
  result: AuthenticationResponse,
  platform: Platform
) => {
  const { accessToken, refreshToken, user } = result;
  const session: AuthSession = {
    accessToken,
    user: {
      email: user.email,
      firstName: user.firstName,
      id: user.id,
      lastName: user.lastName,
      profilePictureUrl: user.profilePictureUrl,
    },
  };
  if (platform === "web") {
    setCookie(c, REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "Strict",
      secure: true,
    });
  } else {
    session.refreshToken = refreshToken;
  }
  return c.json(session);
};

const signInFailed = (error: unknown) => {
  if (isWorkOSClientError(error)) {
    return apiError(401, "Sign-in didn't go through. Please try again.");
  }
  return error;
};

export const authRoutes = new Hono<AppEnv>()
  // Starts AuthKit. The app opens this URL in the system auth session; PKCE
  // keeps an intercepted callback code useless without the app's verifier.
  .get("/authorize", validate("query", authorizeQuery), (c) => {
    const query = c.req.valid("query");
    const webRedirectUri = `${c.env.APP_ORIGIN}/callback`;
    if (
      query.redirect_uri !== NATIVE_REDIRECT_URI &&
      query.redirect_uri !== webRedirectUri
    ) {
      throw apiError(400, "Unknown redirect URI.");
    }
    const url = getWorkOS(c.env).userManagement.getAuthorizationUrl({
      clientId: c.env.WORKOS_CLIENT_ID,
      codeChallenge: query.code_challenge,
      codeChallengeMethod: "S256",
      provider: "authkit",
      redirectUri: query.redirect_uri,
      state: query.state,
    });
    return c.redirect(url, 302);
  })
  .post("/token", validate("json", tokenBody), async (c) => {
    const { code, codeVerifier, platform } = c.req.valid("json");
    try {
      const result = await getWorkOS(c.env).userManagement.authenticateWithCode(
        {
          clientId: c.env.WORKOS_CLIENT_ID,
          code,
          codeVerifier,
        }
      );
      return sessionResponse(c, result, platform);
    } catch (error) {
      throw signInFailed(error);
    }
  })
  .post("/refresh", validate("json", refreshBody), async (c) => {
    const { platform, refreshToken: bodyToken } = c.req.valid("json");
    const refreshToken = bodyToken ?? getCookie(c, REFRESH_COOKIE);
    if (!refreshToken) {
      throw apiError(401, "Sign in to continue.");
    }
    try {
      const result = await getWorkOS(
        c.env
      ).userManagement.authenticateWithRefreshToken({
        clientId: c.env.WORKOS_CLIENT_ID,
        refreshToken,
      });
      return sessionResponse(c, result, platform);
    } catch (error) {
      if (isWorkOSClientError(error)) {
        clearRefreshCookie(c);
        throw apiError(401, "Your session has expired. Sign in again.");
      }
      throw error;
    }
  })
  .post("/logout", requireUser, async (c) => {
    await getWorkOS(c.env).userManagement.revokeSession({
      sessionId: c.var.sessionId,
    });
    clearRefreshCookie(c);
    return c.body(null, 204);
  });
