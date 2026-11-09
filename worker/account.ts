import { Hono } from "hono";
import { clearRefreshCookie } from "./auth";
import type { AppEnv } from "./env";
import { getWorkOS, requireUser } from "./workos";

export const accountRoutes = new Hono<AppEnv>()
  .use(requireUser)
  // Deletes the user's habits first, then the WorkOS user (which also ends
  // every session). If WorkOS fails, the user can retry: their data is gone.
  .delete("/", async (c) => {
    const { DB } = c.env;
    await DB.batch([
      DB.prepare("DELETE FROM checkins WHERE owner_id = ?").bind(c.var.userId),
      DB.prepare("DELETE FROM habits WHERE owner_id = ?").bind(c.var.userId),
    ]);
    await getWorkOS(c.env).userManagement.deleteUser(c.var.userId);
    clearRefreshCookie(c);
    return c.body(null, 204);
  });
