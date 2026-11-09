import { WorkOS } from "@workos-inc/node";
import { createMiddleware } from "hono/factory";
import { type AppEnv, apiError, type Bindings } from "./env";

// One client per isolate so the JWKS used by verifyAccessToken stays cached
// between requests.
let cached: { client: WorkOS; key: string } | undefined;

// WORKOS_API_URL points the SDK at the local WorkOS emulator; production
// leaves it unset and talks to api.workos.com.
const hostOptions = (apiUrl: string | undefined) => {
  if (!apiUrl) {
    return {};
  }
  const url = new URL(apiUrl);
  return {
    apiHostname: url.hostname,
    https: url.protocol === "https:",
    port: url.port ? Number(url.port) : undefined,
  };
};

export const getWorkOS = (env: Bindings): WorkOS => {
  const key = `${env.WORKOS_CLIENT_ID}:${env.WORKOS_API_KEY}:${env.WORKOS_API_URL ?? ""}`;
  if (cached?.key !== key) {
    cached = {
      client: new WorkOS(env.WORKOS_API_KEY, {
        clientId: env.WORKOS_CLIENT_ID,
        ...hostOptions(env.WORKOS_API_URL),
      }),
      key,
    };
  }
  return cached.client;
};

const BEARER_PREFIX = "Bearer ";

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length)
    : null;
  if (!token) {
    throw apiError(401, "Sign in to continue.");
  }
  const claims = await getWorkOS(c.env).userManagement.verifyAccessToken(token);
  if (!claims) {
    throw apiError(401, "Your session has expired. Sign in again.");
  }
  c.set("userId", claims.sub);
  c.set("sessionId", claims.sid as string);
  await next();
});

// WorkOS rejects bad or expired codes and refresh tokens with a 4xx; treat
// those as a sign-in failure and let anything else surface as a server error.
export const isWorkOSClientError = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }
  const { status } = error;
  return typeof status === "number" && status >= 400 && status < 500;
};
