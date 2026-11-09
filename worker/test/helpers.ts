import { env } from "cloudflare:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { vi } from "vitest";
import app from "../index";

const KEY_ID = "test-key";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const publicJwk = {
  ...(await exportJWK(publicKey)),
  alg: "RS256",
  kid: KEY_ID,
};

// Same claims WorkOS puts on a user access token (sid + auth_time).
export const signAccessToken = (
  userId: string,
  sessionId = `session_${userId}`
) => {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ auth_time: now, sid: sessionId })
    .setProtectedHeader({ alg: "RS256", kid: KEY_ID })
    .setSubject(userId)
    .setIssuer("https://api.workos.com")
    .setIssuedAt(now)
    .setExpirationTime("5m")
    .setAudience(env.WORKOS_CLIENT_ID)
    .sign(privateKey);
};

export interface WorkOSCall {
  body: unknown;
  method: string;
  path: string;
}

type WorkOSHandler = (call: WorkOSCall) => Response | undefined;

// Every outbound request goes to WorkOS. JWKS is always served; tests add
// handlers for the API calls they exercise and can inspect `workosCalls`.
export const workosCalls: WorkOSCall[] = [];
let handler: WorkOSHandler = () => undefined;

export const onWorkOS = (next: WorkOSHandler) => {
  handler = next;
};

export const resetWorkOS = () => {
  workosCalls.length = 0;
  handler = () => undefined;
};

vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.pathname === `/sso/jwks/${env.WORKOS_CLIENT_ID}`) {
    return Response.json({ keys: [publicJwk] });
  }
  const text = await request.text();
  const call: WorkOSCall = {
    body: text ? JSON.parse(text) : null,
    method: request.method,
    path: url.pathname,
  };
  workosCalls.push(call);
  const response = handler(call);
  if (!response) {
    throw new Error(`Unexpected request: ${request.method} ${url}`);
  }
  return response;
});

interface ApiOptions {
  body?: unknown;
  cookie?: string;
  method?: string;
  token?: string;
}

export const api = (path: string, options: ApiOptions = {}) => {
  const headers = new Headers();
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.cookie) {
    headers.set("Cookie", options.cookie);
  }
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  return app.request(
    `https://practice.test${path}`,
    {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
      method: options.method ?? "GET",
      redirect: "manual",
    },
    env
  );
};

export const workosUser = (id: string) => ({
  created_at: "2026-01-01T00:00:00.000Z",
  email: `${id}@example.com`,
  email_verified: true,
  external_id: null,
  first_name: "Test",
  id,
  last_name: "User",
  last_sign_in_at: null,
  metadata: {},
  object: "user",
  profile_picture_url: null,
  updated_at: "2026-01-01T00:00:00.000Z",
});
