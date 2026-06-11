import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  type HabitCategoryId,
  isValidHabitCategoryId,
  resolveHabitCategoryId,
} from "./habit-categories";

export interface Habit {
  categoryId: HabitCategoryId;
  checkins: string[];
  createdAt: string;
  id: string;
  name: string;
}

export interface HabitStreaks {
  best: number;
  current: number;
}

type StorageMode = "anonymous" | "signedIn";
type SyncState = "idle" | "claiming" | "online" | "offline" | "error";

interface HabitsContextValue {
  addHabit: (input: {
    name: string;
    categoryId?: HabitCategoryId;
  }) => Promise<void>;
  authPromptVisible: boolean;
  deleteHabit: (id: string) => Promise<void>;
  error: string | null;
  habits: Habit[];
  isLoaded: boolean;
  mode: StorageMode;
  reload: () => Promise<void>;
  syncState: SyncState;
  today: string;
  toggleCheckInToday: (id: string) => Promise<void>;
  updateHabit: (
    id: string,
    input: { name: string; categoryId: HabitCategoryId }
  ) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_HABIT_NAME_LENGTH = 120;

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatUtcDate = (date: Date) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;

export const getTodayString = (date = new Date()) => formatDate(date);
const getUtcTodayString = (date = new Date()) => formatUtcDate(date);

const parseDateString = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const diffInDays = (left: Date, right: Date) =>
  Math.round((left.getTime() - right.getTime()) / 86_400_000);

const isValidDateString = (value: string) => DATE_RE.test(value);

const normalizeDateArray = (dates: string[]) => {
  const unique = new Set<string>();
  for (const value of dates) {
    if (isValidDateString(value)) {
      unique.add(value);
    }
  }
  return Array.from(unique).sort();
};

const normalizeHabitName = (name: unknown) => {
  if (typeof name !== "string") {
    throw new Error("Habit name is required.");
  }
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    throw new Error("Habit name is required.");
  }
  if (trimmed.length > MAX_HABIT_NAME_LENGTH) {
    throw new Error(
      `Habit name must be ${MAX_HABIT_NAME_LENGTH} characters or fewer.`
    );
  }
  return trimmed;
};

const normalizeHabitCategoryId = (categoryId?: unknown) => {
  if (!categoryId) {
    return resolveHabitCategoryId();
  }
  if (typeof categoryId !== "string" || !isValidHabitCategoryId(categoryId)) {
    throw new Error("Invalid habit category.");
  }
  return categoryId;
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

export const hasCheckInToday = (checkins: string[], today = getTodayString()) =>
  normalizeDateArray(checkins).includes(today);

export interface RollingWeekDay {
  completed: boolean;
  date: string;
}

export const getRollingWeekCheckins = (
  checkins: string[],
  today = getTodayString(),
  length = 7
): RollingWeekDay[] => {
  if (!isValidDateString(today) || length <= 0) {
    return [];
  }
  const completedSet = new Set(normalizeDateArray(checkins));
  const todayDate = parseDateString(today);
  const days: RollingWeekDay[] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const date = formatDate(addDays(todayDate, -offset));
    days.push({ date, completed: completedSet.has(date) });
  }
  return days;
};

export interface HabitHistoryDay {
  completed: boolean;
  date: string;
  inRange: boolean;
}

export interface HabitHistoryWeek {
  days: HabitHistoryDay[];
  monthLabel?: string;
  weekStart: string;
}

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

export const getYearHabitHistory = (
  checkins: string[],
  today = getTodayString()
): HabitHistoryWeek[] => {
  if (!isValidDateString(today)) {
    return [];
  }
  const completedSet = new Set(normalizeDateArray(checkins));
  const todayDate = parseDateString(today);
  const windowStart = addDays(todayDate, -364);
  const firstColumnStart = addDays(windowStart, -windowStart.getDay());
  const totalWeeks =
    Math.floor(diffInDays(todayDate, firstColumnStart) / 7) + 1;
  const weeks: HabitHistoryWeek[] = [];
  let lastLabelWeekIndex = -3;
  let previousMonth = -1;

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const columnStart = addDays(firstColumnStart, weekIndex * 7);
    const days: HabitHistoryDay[] = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const cellDate = addDays(columnStart, dayOffset);
      const formatted = formatDate(cellDate);
      const daysFromToday = diffInDays(todayDate, cellDate);
      const inRange = daysFromToday >= 0 && daysFromToday < 365;
      days.push({
        completed: inRange && completedSet.has(formatted),
        date: formatted,
        inRange,
      });
    }
    const columnMonth = columnStart.getMonth();
    let monthLabel: string | undefined;
    if (columnMonth !== previousMonth && weekIndex - lastLabelWeekIndex >= 3) {
      monthLabel = SHORT_MONTH_NAMES[columnMonth];
      lastLabelWeekIndex = weekIndex;
    }
    previousMonth = columnMonth;
    weeks.push({ days, monthLabel, weekStart: formatDate(columnStart) });
  }
  return weeks;
};

export const getStreaks = (
  checkins: string[],
  today = getTodayString()
): HabitStreaks => {
  const sorted = normalizeDateArray(checkins);
  if (sorted.length === 0 || !isValidDateString(today)) {
    return { current: 0, best: 0 };
  }
  const set = new Set(sorted);
  const latest = sorted.at(-1);
  if (!latest) {
    return { current: 0, best: 0 };
  }
  const gap = diffInDays(parseDateString(today), parseDateString(latest));
  let current = 0;
  if (gap === 0) {
    current = streakFrom(today, set);
  } else if (gap === 1) {
    current = streakFrom(latest, set);
  }
  let best = 0;
  for (const date of sorted) {
    const prev = formatDate(addDays(parseDateString(date), -1));
    if (!set.has(prev)) {
      best = Math.max(best, streakFrom(date, set));
    }
  }
  return { current, best };
};

const useOnlineHabits = (enabled: boolean) =>
  useQuery(api.habits.list, enabled ? {} : "skip");

const normalizeOnlineHabits = (
  habits: NonNullable<ReturnType<typeof useOnlineHabits>>
): Habit[] =>
  habits.map((habit) => ({
    ...habit,
    categoryId: resolveHabitCategoryId(habit.categoryId),
  }));

const toOnlineHabitId = (id: string) => id as Id<"habits">;

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const onlineHabits = useOnlineHabits(isAuthenticated);
  const createOnlineHabit = useMutation(api.habits.create);
  const updateOnlineHabit = useMutation(api.habits.update);
  const deleteOnlineHabit = useMutation(api.habits.remove);
  const toggleOnlineCheckin = useMutation(api.habits.toggleCheckin);
  const [error, setError] = useState<string | null>(null);
  const mode: StorageMode = isSignedIn ? "signedIn" : "anonymous";
  const today = getUtcTodayString();

  const requireOnline = useCallback(() => {
    if (!isAuthenticated) {
      throw new Error("Sign in to manage habits.");
    }
    if (onlineHabits === undefined) {
      throw new Error("Reconnect before changing habits.");
    }
  }, [isAuthenticated, onlineHabits]);

  const addHabit = useCallback(
    async (input: { name: string; categoryId?: HabitCategoryId }) => {
      requireOnline();
      await createOnlineHabit({
        name: normalizeHabitName(input.name),
        categoryId: normalizeHabitCategoryId(input.categoryId),
        createdAt: getUtcTodayString(),
      });
    },
    [createOnlineHabit, requireOnline]
  );

  const toggleCheckInToday = useCallback(
    async (id: string) => {
      requireOnline();
      await toggleOnlineCheckin({
        habitId: toOnlineHabitId(id),
        date: getUtcTodayString(),
      });
    },
    [requireOnline, toggleOnlineCheckin]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      input: { name: string; categoryId: HabitCategoryId }
    ) => {
      requireOnline();
      await updateOnlineHabit({
        habitId: toOnlineHabitId(id),
        name: normalizeHabitName(input.name),
        categoryId: normalizeHabitCategoryId(input.categoryId),
      });
    },
    [requireOnline, updateOnlineHabit]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      requireOnline();
      await deleteOnlineHabit({ habitId: toOnlineHabitId(id) });
    },
    [deleteOnlineHabit, requireOnline]
  );

  const reload = useCallback(() => {
    setError(null);
    return Promise.resolve();
  }, []);

  let syncState: SyncState = "offline";
  if (mode === "anonymous") {
    syncState = "idle";
  } else if (onlineHabits !== undefined) {
    syncState = "online";
  }

  const value = useMemo(
    () => ({
      habits: isAuthenticated ? normalizeOnlineHabits(onlineHabits ?? []) : [],
      isLoaded:
        mode === "anonymous" || convexAuthLoading
          ? !convexAuthLoading
          : onlineHabits !== undefined,
      mode,
      syncState,
      today,
      authPromptVisible: mode === "anonymous",
      error,
      addHabit,
      toggleCheckInToday,
      updateHabit,
      deleteHabit,
      reload,
    }),
    [
      addHabit,
      convexAuthLoading,
      deleteHabit,
      error,
      isAuthenticated,
      mode,
      onlineHabits,
      reload,
      syncState,
      today,
      toggleCheckInToday,
      updateHabit,
    ]
  );

  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error("useHabits must be used within HabitsProvider");
  }
  return context;
}
