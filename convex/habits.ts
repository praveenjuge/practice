import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HABIT_NAME_LENGTH = 120;

const habitInput = v.object({
  categoryId: v.string(),
  checkins: v.array(v.string()),
  createdAt: v.string(),
  id: v.string(),
  name: v.string(),
});

const getOwnerId = async (ctx: {
  auth: { getUserIdentity: () => Promise<null | { subject: string }> };
}) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Sign in to sync habits.",
    });
  }
  return identity.subject;
};

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");
const normalizeKey = (name: string) => normalizeName(name).toLocaleLowerCase();
const isDate = (value: string) => DATE_RE.test(value);

const normalizeCheckins = (dates: string[]) =>
  Array.from(new Set(dates.filter(isDate))).sort();

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      categoryId: v.string(),
      checkins: v.array(v.string()),
      createdAt: v.string(),
      id: v.string(),
      name: v.string(),
    })
  ),
  handler: async (ctx) => {
    const ownerId = await getOwnerId(ctx);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
    const rows = await Promise.all(
      habits.map(async (habit) => {
        const checkins = await ctx.db
          .query("checkins")
          .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
          .collect();
        return {
          id: habit._id,
          name: habit.name,
          categoryId: habit.categoryId,
          createdAt: habit.createdAt,
          checkins: checkins.map((checkin) => checkin.date).sort(),
        };
      })
    );
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
    const habitCheckins = await ctx.db
      .query("checkins")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();
    const existing = habitCheckins.find(
      (checkin) => checkin.date === args.date
    );
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

export const claimFromLocal = mutation({
  args: { habits: v.array(habitInput), importKey: v.string() },
  returns: v.object({ imported: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await getOwnerId(ctx);
    const imports = await ctx.db
      .query("claimImports")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
    const existingImport = imports.find(
      (item) => item.importKey === args.importKey
    );
    if (existingImport) {
      return { imported: true };
    }

    for (const input of args.habits) {
      const name = normalizeName(input.name);
      if (
        !name ||
        name.length > MAX_HABIT_NAME_LENGTH ||
        !isDate(input.createdAt)
      ) {
        continue;
      }
      const normalizedName = normalizeKey(name);
      const matchingHabits = await ctx.db
        .query("habits")
        .withIndex("by_owner_and_name", (q) => q.eq("ownerId", ownerId))
        .collect();
      let habit =
        matchingHabits.find((item) => item.normalizedName === normalizedName) ??
        null;
      if (!habit) {
        const habitId = await ctx.db.insert("habits", {
          ownerId,
          name,
          normalizedName,
          categoryId: input.categoryId,
          createdAt: input.createdAt,
          updatedAt: Date.now(),
        });
        habit = await ctx.db.get(habitId);
      }
      if (!habit) {
        continue;
      }
      const habitCheckins = await ctx.db
        .query("checkins")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();
      for (const date of normalizeCheckins(input.checkins)) {
        const existing = habitCheckins.find((checkin) => checkin.date === date);
        if (!existing) {
          await ctx.db.insert("checkins", {
            ownerId,
            habitId: habit._id,
            date,
          });
        }
      }
    }

    await ctx.db.insert("claimImports", {
      ownerId,
      importKey: args.importKey,
      habitCount: args.habits.length,
      completedAt: Date.now(),
    });
    return { imported: true };
  },
});
