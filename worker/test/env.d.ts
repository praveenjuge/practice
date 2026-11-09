import type { D1Migration } from "cloudflare:test";
import type { Bindings } from "../env";

declare global {
  // biome-ignore lint/style/noNamespace: the Workers test types are augmented through the global Cloudflare namespace.
  namespace Cloudflare {
    interface Env extends Bindings {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
