// Pure helpers behind the offline-first habit store: check-ins waiting to
// sync, applying them on top of what the server last sent, and moving a
// cached list forward to a new day until the server answers.
import type { Habit, HabitDetail } from "../shared/api-types";

/** One check-in to send with PUT /habits/:id/checkins/:date. */
export interface PendingCheckIn {
  completed: boolean;
  date: string;
  habitId: string;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/** The user's local calendar day as YYYY-MM-DD. */
export const getTodayString = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const sameCheckIn = (a: PendingCheckIn, b: PendingCheckIn) =>
  a.habitId === b.habitId && a.date === b.date;

/** Adds check-ins to the queue; a later one for the same day replaces it. */
export const enqueueCheckIns = (
  queue: PendingCheckIn[],
  additions: PendingCheckIn[]
): PendingCheckIn[] => {
  let next = queue;
  for (const addition of additions) {
    next = [...next.filter((item) => !sameCheckIn(item, addition)), addition];
  }
  return next;
};

/** Removes exactly this check-in, unless a newer one replaced it. */
export const dequeueCheckIn = (
  queue: PendingCheckIn[],
  sent: PendingCheckIn
): PendingCheckIn[] =>
  queue.filter(
    (item) => !(sameCheckIn(item, sent) && item.completed === sent.completed)
  );

const applyToHabit = (
  habit: Habit,
  today: string,
  pending: PendingCheckIn[]
): Habit => {
  const own = pending.filter((item) => item.habitId === habit.id);
  if (own.length === 0) {
    return habit;
  }
  const byDate = new Map(own.map((item) => [item.date, item.completed]));
  return {
    ...habit,
    checkedToday: byDate.get(today) ?? habit.checkedToday,
    recentDays: habit.recentDays.map((day) => ({
      ...day,
      completed: byDate.get(day.date) ?? day.completed,
    })),
  };
};

/** The server's list with not-yet-synced check-ins shown on top. */
export const applyPending = (
  habits: Habit[],
  today: string,
  pending: PendingCheckIn[]
): Habit[] =>
  pending.length === 0
    ? habits
    : habits.map((habit) => applyToHabit(habit, today, pending));

/**
 * A detail with the list's newer recent days laid over its year history, so
 * the grid shows a check-in the moment it happens.
 */
export const mergeDetail = (
  detail: HabitDetail,
  listed: Habit
): HabitDetail => {
  const recent = new Map(
    listed.recentDays.map((day) => [day.date, day.completed])
  );
  return {
    ...detail,
    ...listed,
    history: detail.history.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        completed: recent.get(day.date) ?? day.completed,
      })),
    })),
  };
};

const addDays = (value: string, amount: number) => {
  const [year, month, day] = value.split("-").map(Number);
  return getTodayString(new Date(year, month - 1, day + amount));
};

/**
 * Moves a list cached on an earlier day forward to `today`: nothing is
 * checked yet and the recent days slide along. Streak numbers stay as they
 * were until the server's list arrives a moment later.
 */
export const rollForward = (
  habits: Habit[],
  cachedDay: string,
  today: string
): Habit[] => {
  if (cachedDay >= today) {
    return habits;
  }
  return habits.map((habit) => {
    const days = [...habit.recentDays];
    let cursor = cachedDay;
    while (cursor < today) {
      cursor = addDays(cursor, 1);
      days.push({ completed: false, date: cursor });
    }
    return {
      ...habit,
      checkedToday: false,
      recentDays: days.slice(-habit.recentDays.length),
    };
  });
};
