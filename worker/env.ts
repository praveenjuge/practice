import type { D1Database } from "@cloudflare/workers-types";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface Bindings {
  /** The web app's origin; its /callback is the only web redirect allowed. */
  APP_ORIGIN: string;
  DB: D1Database;
  WORKOS_API_KEY: string;
  WORKOS_CLIENT_ID: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: {
    sessionId: string;
    userId: string;
  };
}

export const apiError = (status: ContentfulStatusCode, message: string) =>
  new HTTPException(status, { message });
