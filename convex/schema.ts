import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  habits: defineTable({
    categoryId: v.string(),
    createdAt: v.string(),
    name: v.string(),
    normalizedName: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_name", ["ownerId", "normalizedName"]),
  checkins: defineTable({
    date: v.string(),
    habitId: v.id("habits"),
    ownerId: v.string(),
  })
    .index("by_habit", ["habitId"])
    .index("by_habit_and_date", ["habitId", "date"])
    .index("by_owner", ["ownerId"]),
  claimImports: defineTable({
    completedAt: v.number(),
    habitCount: v.number(),
    importKey: v.string(),
    ownerId: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_key", ["ownerId", "importKey"]),
});
