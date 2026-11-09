import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ApiErrorBody } from "../shared/api-types";
import { accountRoutes } from "./account";
import { authRoutes } from "./auth";
import type { AppEnv } from "./env";
import { habitRoutes } from "./habits";

// Static web assets are served by Workers Assets; only /api/* reaches this
// Worker (see run_worker_first in wrangler.jsonc).
const app = new Hono<AppEnv>()
  .basePath("/api")
  .route("/auth", authRoutes)
  .route("/habits", habitRoutes)
  .route("/account", accountRoutes);

app.notFound((c) => c.json<ApiErrorBody>({ error: "Not found." }, 404));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json<ApiErrorBody>({ error: error.message }, error.status);
  }
  console.error(error);
  return c.json<ApiErrorBody>(
    { error: "Something went wrong. Please try again." },
    500
  );
});

export type AppType = typeof app;

export default app;
