// Shared, pure-TS habit math. Importable by both the Convex server runtime
// and the client so that optimistic stats match server-computed stats exactly.
// Calendar math is string-based (timezone-agnostic): callers pass a local
// `today` date string ("YYYY-MM-DD") and dates are compared as calendar days.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_HABIT_NAME_LENGTH = 120;

export interface HabitStats {
  bestStreak: number;
  currentStreak: number;
  lastCheckin: string | null;
  totalCheckins: number;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateString = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const diffInDays = (left: Date, right: Date) =>
  Math.round((left.getTime() - right.getTime()) / 86_400_000);

export const isValidDateString = (value: string) => DATE_RE.test(value);

const normalizeDateArray = (dates: string[]) => {
  const unique = new Set<string>();
  for (const value of dates) {
    if (isValidDateString(value)) {
      unique.add(value);
    }
  }
  return Array.from(unique).sort();
};

const streakFrom = (start: string, set: Set<string>) => {
  let count = 0;
  let cursor = start;
  while (set.has(cursor)) {
    count += 1;
    cursor = formatDate(addDays(parseDateString(cursor), -1));
  }
  return count;
};

// Trim and collapse internal whitespace. Used identically on the server and in
// optimistic updates so that names match before/after reconciliation.
export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export const computeHabitStats = (
  sortedCheckins: string[],
  today: string
): HabitStats => {
  const sorted = normalizeDateArray(sortedCheckins);
  const totalCheckins = sorted.length;
  const lastCheckin = sorted.at(-1) ?? null;

  if (totalCheckins === 0 || !isValidDateString(today)) {
    return { currentStreak: 0, bestStreak: 0, totalCheckins, lastCheckin };
  }

  const set = new Set(sorted);
  const latest = lastCheckin as string;
  const gap = diffInDays(parseDateString(today), parseDateString(latest));

  let currentStreak = 0;
  if (gap === 0) {
    currentStreak = streakFrom(today, set);
  } else if (gap === 1) {
    currentStreak = streakFrom(latest, set);
  }

  let bestStreak = 0;
  for (const date of sorted) {
    const prev = formatDate(addDays(parseDateString(date), -1));
    if (!set.has(prev)) {
      bestStreak = Math.max(bestStreak, streakFrom(date, set));
    }
  }

  return { currentStreak, bestStreak, totalCheckins, lastCheckin };
};
