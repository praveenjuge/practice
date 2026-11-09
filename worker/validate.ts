import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { apiError } from "./env";

// zValidator that reports the first issue as `{ error }` like every other
// API error, so clients show one readable message.
export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(
  target: Target,
  schema: Schema
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw apiError(
        400,
        result.error.issues[0]?.message ?? "Invalid request."
      );
    }
  });
