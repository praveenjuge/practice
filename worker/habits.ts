import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { z } from "zod";
import {
  type Habit,
  type HabitDetail,
  type HabitList,
  MAX_HABIT_NAME_LENGTH,
  RECENT_DAY_COUNT,
} from "../shared/api-types";
import { isValidHabitCategoryId } from "../shared/habit-categories";
import { type AppEnv, apiError } from "./env";
import {
  buildRecentDays,
  buildYearHistory,
  computeHabitStats,
  isValidDateString,
} from "./stats";
import { validate } from "./validate";
import { requireUser } from "./workos";

interface HabitRow {
  category_id: string;
  id: string;
  name: string;
}

interface CheckinRow {
  date: string;
  habit_id: string;
}

const WHITESPACE_RE = /\s+/gu;

// Clients send their own calendar day so streaks follow the user's timezone.
const todayQuery = z.object({
  today: z.string().refine(isValidDateString, "Invalid date."),
});

const habitInput = z.object({
  categoryId: z
    .string()
    .refine(isValidHabitCategoryId, "Pick a category from the list."),
  name: z
    .string()
    .transform((value) => value.trim().replace(WHITESPACE_RE, " "))
    .pipe(
      z
        .string()
        .min(1, "Give your habit a name.")
        .max(
          MAX_HABIT_NAME_LENGTH,
          `Keep the name under ${MAX_HABIT_NAME_LENGTH} characters.`
        )
    ),
});

const toHabit = (row: HabitRow, dates: string[], today: string): Habit => {
  const dateSet = new Set(dates);
  return {
    categoryId: row.category_id,
    checkedToday: dateSet.has(today),
    id: row.id,
    name: row.name,
    recentDays: buildRecentDays(dateSet, today, RECENT_DAY_COUNT),
    stats: computeHabitStats(dates, today),
  };
};

const listHabits = async (
  db: D1Database,
  ownerId: string,
  today: string
): Promise<HabitList> => {
  const [habitResult, checkinResult] = await db.batch([
    db
      .prepare(
        "SELECT id, name, category_id FROM habits WHERE owner_id = ? ORDER BY created_at, id"
      )
      .bind(ownerId),
    db
      .prepare(
        "SELECT habit_id, date FROM checkins WHERE owner_id = ? ORDER BY habit_id, date"
      )
      .bind(ownerId),
  ]);
  const datesByHabit = new Map<string, string[]>();
  for (const checkin of checkinResult.results as CheckinRow[]) {
    const dates = datesByHabit.get(checkin.habit_id);
    if (dates) {
      dates.push(checkin.date);
    } else {
      datesByHabit.set(checkin.habit_id, [checkin.date]);
    }
  }
  return {
    habits: (habitResult.results as HabitRow[]).map((row) =>
      toHabit(row, datesByHabit.get(row.id) ?? [], today)
    ),
  };
};

const notFound = () => apiError(404, "That habit no longer exists.");

export const habitRoutes = new Hono<AppEnv>()
  .use(requireUser)
  .get("/", validate("query", todayQuery), async (c) => {
    const { today } = c.req.valid("query");
    return c.json(await listHabits(c.env.DB, c.var.userId, today));
  })
  .get("/:id", validate("query", todayQuery), async (c) => {
    const { today } = c.req.valid("query");
    const id = c.req.param("id");
    const [habitResult, checkinResult] = await c.env.DB.batch([
      c.env.DB.prepare(
        "SELECT id, name, category_id FROM habits WHERE id = ? AND owner_id = ?"
      ).bind(id, c.var.userId),
      c.env.DB.prepare(
        "SELECT date FROM checkins WHERE habit_id = ? AND owner_id = ? ORDER BY date"
      ).bind(id, c.var.userId),
    ]);
    const [row] = habitResult.results as HabitRow[];
    if (!row) {
      throw notFound();
    }
    const dates = (checkinResult.results as Pick<CheckinRow, "date">[]).map(
      (checkin) => checkin.date
    );
    const detail: HabitDetail = {
      ...toHabit(row, dates, today),
      history: buildYearHistory(new Set(dates), today),
    };
    return c.json(detail);
  })
  .post(
    "/",
    validate("query", todayQuery),
    validate("json", habitInput),
    async (c) => {
      const { today } = c.req.valid("query");
      const { categoryId, name } = c.req.valid("json");
      const now = Date.now();
      await c.env.DB.prepare(
        "INSERT INTO habits (id, owner_id, name, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(crypto.randomUUID(), c.var.userId, name, categoryId, now, now)
        .run();
      return c.json(await listHabits(c.env.DB, c.var.userId, today), 201);
    }
  )
  .patch(
    "/:id",
    validate("query", todayQuery),
    validate("json", habitInput),
    async (c) => {
      const { today } = c.req.valid("query");
      const { categoryId, name } = c.req.valid("json");
      const result = await c.env.DB.prepare(
        "UPDATE habits SET name = ?, category_id = ?, updated_at = ? WHERE id = ? AND owner_id = ?"
      )
        .bind(name, categoryId, Date.now(), c.req.param("id"), c.var.userId)
        .run();
      if (result.meta.changes === 0) {
        throw notFound();
      }
      return c.json(await listHabits(c.env.DB, c.var.userId, today));
    }
  )
  .delete("/:id", validate("query", todayQuery), async (c) => {
    const { today } = c.req.valid("query");
    // Check-ins go with it through ON DELETE CASCADE.
    const result = await c.env.DB.prepare(
      "DELETE FROM habits WHERE id = ? AND owner_id = ?"
    )
      .bind(c.req.param("id"), c.var.userId)
      .run();
    if (result.meta.changes === 0) {
      throw notFound();
    }
    return c.json(await listHabits(c.env.DB, c.var.userId, today));
  })
  // Toggles today's check-in: removes it if present, otherwise adds it.
  .post("/:id/toggle-today", validate("query", todayQuery), async (c) => {
    const { today } = c.req.valid("query");
    const id = c.req.param("id");
    const removed = await c.env.DB.prepare(
      "DELETE FROM checkins WHERE habit_id = ? AND date = ? AND owner_id = ?"
    )
      .bind(id, today, c.var.userId)
      .run();
    if (removed.meta.changes === 0) {
      const added = await c.env.DB.prepare(
        "INSERT OR IGNORE INTO checkins (habit_id, owner_id, date) SELECT id, owner_id, ? FROM habits WHERE id = ? AND owner_id = ?"
      )
        .bind(today, id, c.var.userId)
        .run();
      if (added.meta.changes === 0) {
        throw notFound();
      }
    }
    return c.json(await listHabits(c.env.DB, c.var.userId, today));
  });
