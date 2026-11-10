// Habit math, computed on the server so clients only render results.
// Calendar math is string-based: callers pass the user's local `today`
// ("YYYY-MM-DD") and dates are compared as calendar days. Workers run in UTC,
// so the local Date helpers below behave as plain calendar arithmetic.

import type {
  HabitHistoryDay,
  HabitHistoryWeek,
  HabitStats,
  RecentDay,
} from "../shared/api-types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
const DAYS_PER_WEEK = 7;
const HISTORY_DAYS = 365;
const MIN_WEEKS_BETWEEN_MONTH_LABELS = 3;
const MS_PER_DAY = 86_400_000;

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

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
  Math.round((left.getTime() - right.getTime()) / MS_PER_DAY);

export const isValidDateString = (value: string) => {
  if (!DATE_RE.test(value)) {
    return false;
  }
  return formatDate(parseDateString(value)) === value;
};

/** How many calendar days `date` falls before `today` (negative if after). */
export const daysBefore = (date: string, today: string) =>
  diffInDays(parseDateString(today), parseDateString(date));

const streakFrom = (start: string, set: Set<string>) => {
  let count = 0;
  let cursor = start;
  while (set.has(cursor)) {
    count += 1;
    cursor = formatDate(addDays(parseDateString(cursor), -1));
  }
  return count;
};

// `sortedDates` must be unique, valid and ascending (the database returns them
// that way via ORDER BY on the primary key).
export const computeHabitStats = (
  sortedDates: string[],
  today: string
): HabitStats => {
  const totalCheckins = sortedDates.length;
  const lastCheckin = sortedDates.at(-1) ?? null;

  if (lastCheckin === null) {
    return { bestStreak: 0, currentStreak: 0, lastCheckin, totalCheckins };
  }

  const set = new Set(sortedDates);
  const gap = diffInDays(parseDateString(today), parseDateString(lastCheckin));

  let currentStreak = 0;
  if (gap === 0) {
    currentStreak = streakFrom(today, set);
  } else if (gap === 1) {
    currentStreak = streakFrom(lastCheckin, set);
  }

  // streakFrom counts backwards, so measure each run from its last day.
  let bestStreak = 0;
  for (const date of sortedDates) {
    const next = formatDate(addDays(parseDateString(date), 1));
    if (!set.has(next)) {
      bestStreak = Math.max(bestStreak, streakFrom(date, set));
    }
  }

  return { bestStreak, currentStreak, lastCheckin, totalCheckins };
};

export const buildRecentDays = (
  dates: Set<string>,
  today: string,
  length: number
): RecentDay[] => {
  const todayDate = parseDateString(today);
  const days: RecentDay[] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const date = formatDate(addDays(todayDate, -offset));
    days.push({ completed: dates.has(date), date });
  }
  return days;
};

// One year of weeks (Sunday-first columns), with a month label on the first
// column of each month when labels would not crowd each other.
export const buildYearHistory = (
  dates: Set<string>,
  today: string
): HabitHistoryWeek[] => {
  const todayDate = parseDateString(today);
  const windowStart = addDays(todayDate, -(HISTORY_DAYS - 1));
  const firstColumnStart = addDays(windowStart, -windowStart.getDay());
  const totalWeeks =
    Math.floor(diffInDays(todayDate, firstColumnStart) / DAYS_PER_WEEK) + 1;
  const weeks: HabitHistoryWeek[] = [];
  let lastLabelWeekIndex = -MIN_WEEKS_BETWEEN_MONTH_LABELS;
  let previousMonth = -1;

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const columnStart = addDays(firstColumnStart, weekIndex * DAYS_PER_WEEK);
    const days: HabitHistoryDay[] = [];
    for (let dayOffset = 0; dayOffset < DAYS_PER_WEEK; dayOffset += 1) {
      const cellDate = addDays(columnStart, dayOffset);
      const date = formatDate(cellDate);
      const daysFromToday = diffInDays(todayDate, cellDate);
      const inRange = daysFromToday >= 0 && daysFromToday < HISTORY_DAYS;
      days.push({ completed: inRange && dates.has(date), date, inRange });
    }
    const columnMonth = columnStart.getMonth();
    let monthLabel: string | undefined;
    if (
      columnMonth !== previousMonth &&
      weekIndex - lastLabelWeekIndex >= MIN_WEEKS_BETWEEN_MONTH_LABELS
    ) {
      monthLabel = SHORT_MONTH_NAMES[columnMonth];
      lastLabelWeekIndex = weekIndex;
    }
    previousMonth = columnMonth;
    weeks.push({ days, monthLabel, weekStart: formatDate(columnStart) });
  }
  return weeks;
};
