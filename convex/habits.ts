import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  computeHabitStats,
  MAX_HABIT_NAME_LENGTH,
  normalizeName,
} from "./model/stats";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const getOwnerId = async (ctx: {
  auth: { getUserIdentity: () => Promise<null | { subject: string }> };
}) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Sign in to manage your habits.",
    });
  }
  return identity.subject;
};

const pad2 = (value: number) => String(value).padStart(2, "0");
const getUtcTodayString = (date = new Date()) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;

const normalizeKey = (name: string) => normalizeName(name).toLocaleLowerCase();
const isDate = (value: string) => DATE_RE.test(value);

const statsValidator = v.object({
  bestStreak: v.number(),
  currentStreak: v.number(),
  lastCheckin: v.union(v.string(), v.null()),
  totalCheckins: v.number(),
});

export const list = query({
  // `today` is optional so already-shipped native clients calling `list({})`
  // still pass validation; the server falls back to UTC today in that case.
  args: { today: v.optional(v.string()) },
  returns: v.array(
    v.object({
      categoryId: v.string(),
      checkins: v.array(v.string()),
      createdAt: v.string(),
      id: v.string(),
      name: v.string(),
      stats: statsValidator,
    })
  ),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const today =
      args.today && isDate(args.today) ? args.today : getUtcTodayString();

    // Fetch habits and ALL of the owner's checkins in parallel, then group by
    // habit in a Map to avoid the per-habit N+1 query.
    const [habits, checkins] = await Promise.all([
      ctx.db
        .query("habits")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect(),
      ctx.db
        .query("checkins")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect(),
    ]);

    const datesByHabit = new Map<string, string[]>();
    for (const checkin of checkins) {
      const key = checkin.habitId as string;
      const list_ = datesByHabit.get(key);
      if (list_) {
        list_.push(checkin.date);
      } else {
        datesByHabit.set(key, [checkin.date]);
      }
    }

    const rows = habits.map((habit) => {
      const dates = (datesByHabit.get(habit._id as string) ?? [])
        .slice()
        .sort();
      return {
        id: habit._id,
        name: habit.name,
        categoryId: habit.categoryId,
        createdAt: habit.createdAt,
        checkins: dates,
        stats: computeHabitStats(dates, today),
      };
    });

    return rows.sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
  },
});

export const create = mutation({
  args: { categoryId: v.string(), createdAt: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const name = normalizeName(args.name);
    if (
      !name ||
      name.length > MAX_HABIT_NAME_LENGTH ||
      !isDate(args.createdAt)
    ) {
      throw new ConvexError({ code: "BAD_INPUT", message: "Invalid habit." });
    }
    const now = Date.now();
    await ctx.db.insert("habits", {
      ownerId,
      name,
      normalizedName: normalizeKey(name),
      categoryId: args.categoryId,
      createdAt: args.createdAt,
      updatedAt: now,
    });
    return null;
  },
});

export const update = mutation({
  args: { categoryId: v.string(), habitId: v.id("habits"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const habit = await ctx.db.get(args.habitId);
    const name = normalizeName(args.name);
    if (!habit || habit.ownerId !== ownerId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Habit not found." });
    }
    if (!name || name.length > MAX_HABIT_NAME_LENGTH) {
      throw new ConvexError({ code: "BAD_INPUT", message: "Invalid habit." });
    }
    await ctx.db.patch(args.habitId, {
      name,
      normalizedName: normalizeKey(name),
      categoryId: args.categoryId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { habitId: v.id("habits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.ownerId !== ownerId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Habit not found." });
    }
    const checkins = await ctx.db
      .query("checkins")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();
    await Promise.all(checkins.map((checkin) => ctx.db.delete(checkin._id)));
    await ctx.db.delete(args.habitId);
    return null;
  },
});

export const toggleCheckin = mutation({
  args: { date: v.string(), habitId: v.id("habits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.ownerId !== ownerId || !isDate(args.date)) {
      throw new ConvexError({
        code: "BAD_INPUT",
        message: "Invalid check-in.",
      });
    }
    // Point lookup on the composite index instead of scanning all checkins.
    const existing = await ctx.db
      .query("checkins")
      .withIndex("by_habit_and_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return null;
    }
    await ctx.db.insert("checkins", {
      ownerId,
      habitId: args.habitId,
      date: args.date,
    });
    return null;
  },
});
