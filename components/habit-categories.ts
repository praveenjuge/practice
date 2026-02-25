const CATEGORIES = [
  { id: "uncategorized", label: "Uncategorized", group: "General" },
  { id: "routines", label: "Routines", group: "General" },
  { id: "self-care", label: "Self Care", group: "General" },
  { id: "hobbies", label: "Hobbies", group: "General" },
  { id: "social-life", label: "Social Life", group: "General" },
  { id: "fitness", label: "Fitness", group: "Health & Wellness" },
  { id: "strength-training", label: "Strength Training", group: "Health & Wellness" },
  { id: "cardio", label: "Cardio", group: "Health & Wellness" },
  { id: "mobility", label: "Mobility", group: "Health & Wellness" },
  { id: "nutrition", label: "Nutrition", group: "Health & Wellness" },
  { id: "hydration", label: "Hydration", group: "Health & Wellness" },
  { id: "sleep", label: "Sleep", group: "Health & Wellness" },
  { id: "mindfulness", label: "Mindfulness", group: "Health & Wellness" },
  { id: "mental-health", label: "Mental Health", group: "Health & Wellness" },
  { id: "reading", label: "Reading", group: "Learning & Growth" },
  { id: "writing", label: "Writing", group: "Learning & Growth" },
  { id: "language-learning", label: "Language Learning", group: "Learning & Growth" },
  { id: "online-courses", label: "Online Courses", group: "Learning & Growth" },
  { id: "skill-practice", label: "Skill Practice", group: "Learning & Growth" },
  { id: "creative-practice", label: "Creative Practice", group: "Learning & Growth" },
  { id: "career-development", label: "Career Development", group: "Learning & Growth" },
  { id: "exam-prep", label: "Exam Prep", group: "Learning & Growth" },
  { id: "research", label: "Research", group: "Learning & Growth" },
  { id: "deep-work", label: "Deep Work", group: "Work & Productivity" },
  { id: "planning", label: "Planning", group: "Work & Productivity" },
  { id: "email-inbox", label: "Email & Inbox", group: "Work & Productivity" },
  { id: "meetings", label: "Meetings", group: "Work & Productivity" },
  { id: "coding", label: "Coding", group: "Work & Productivity" },
  { id: "side-projects", label: "Side Projects", group: "Work & Productivity" },
  { id: "documentation", label: "Documentation", group: "Work & Productivity" },
  { id: "time-management", label: "Time Management", group: "Work & Productivity" },
  { id: "goal-tracking", label: "Goal Tracking", group: "Work & Productivity" },
  { id: "home-organization", label: "Home Organization", group: "Home & Relationships" },
  { id: "cleaning", label: "Cleaning", group: "Home & Relationships" },
  { id: "meal-prep", label: "Meal Prep", group: "Home & Relationships" },
  { id: "errands", label: "Errands", group: "Home & Relationships" },
  { id: "parenting", label: "Parenting", group: "Home & Relationships" },
  { id: "partner-relationship", label: "Partner Relationship", group: "Home & Relationships" },
  { id: "friends-community", label: "Friends & Community", group: "Home & Relationships" },
  { id: "pet-care", label: "Pet Care", group: "Home & Relationships" },
  { id: "volunteering", label: "Volunteering", group: "Home & Relationships" },
  { id: "budgeting", label: "Budgeting", group: "Finance & Lifestyle" },
  { id: "saving", label: "Saving", group: "Finance & Lifestyle" },
  { id: "investing", label: "Investing", group: "Finance & Lifestyle" },
  { id: "debt-payoff", label: "Debt Payoff", group: "Finance & Lifestyle" },
  { id: "expense-tracking", label: "Expense Tracking", group: "Finance & Lifestyle" },
  { id: "no-spend", label: "No Spend", group: "Finance & Lifestyle" },
  { id: "shopping-discipline", label: "Shopping Discipline", group: "Finance & Lifestyle" },
  { id: "subscription-audit", label: "Subscription Audit", group: "Finance & Lifestyle" },
  { id: "tax-planning", label: "Tax Planning", group: "Finance & Lifestyle" },
] as const;

export const HABIT_CATEGORIES = CATEGORIES;
export type HabitCategory = (typeof CATEGORIES)[number];
export type HabitCategoryId = HabitCategory["id"];
export type HabitCategoryGroup = HabitCategory["group"];

export const DEFAULT_HABIT_CATEGORY_ID: HabitCategoryId = "uncategorized";

const HABIT_CATEGORY_IDS = new Set<string>(HABIT_CATEGORIES.map((item) => item.id));
const HABIT_CATEGORY_MAP = new Map<HabitCategoryId, HabitCategory>(
  HABIT_CATEGORIES.map((item) => [item.id, item])
);

export const HABIT_CATEGORY_GROUP_ORDER = Array.from(
  new Set(HABIT_CATEGORIES.map((item) => item.group))
) as HabitCategoryGroup[];

export const isValidHabitCategoryId = (id: string): id is HabitCategoryId =>
  HABIT_CATEGORY_IDS.has(id);

export const resolveHabitCategoryId = (
  input?: string | null
): HabitCategoryId => {
  if (typeof input === "string" && isValidHabitCategoryId(input)) {
    return input;
  }
  return DEFAULT_HABIT_CATEGORY_ID;
};

export const getHabitCategory = (id?: string | null): HabitCategory =>
  HABIT_CATEGORY_MAP.get(resolveHabitCategoryId(id)) ??
  HABIT_CATEGORY_MAP.get(DEFAULT_HABIT_CATEGORY_ID)!;
