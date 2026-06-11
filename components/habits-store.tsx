import type { OptimisticLocalStore } from "convex/browser";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  computeHabitStats,
  type HabitStats,
  MAX_HABIT_NAME_LENGTH,
  normalizeName,
} from "../convex/model/stats";
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
  stats: HabitStats;
}

interface HabitsContextValue {
  addHabit: (input: {
    name: string;
    categoryId?: HabitCategoryId;
  }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  habits: Habit[];
  isLoaded: boolean;
  today: string;
  toggleCheckInToday: (id: string) => Promise<void>;
  updateHabit: (
    id: string,
    input: { name: string; categoryId: HabitCategoryId }
  ) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type ListRow = FunctionReturnType<typeof api.habits.list>[number];

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const getTodayString = (date = new Date()) => formatDate(date);

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
  const trimmed = normalizeName(name);
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

const toOnlineHabitId = (id: string) => id as Id<"habits">;

const createTempId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// Patch every cached args-variant of `habits.list` (search/detail routes may
// hold distinct `today` values). We iterate all queries rather than re-deriving
// args so a `today` mismatch never turns into a silent no-op.
const patchListQueries = (
  localStore: OptimisticLocalStore,
  patch: (rows: ListRow[], today: string) => ListRow[]
) => {
  for (const entry of localStore.getAllQueries(api.habits.list)) {
    if (entry.value === undefined) {
      continue;
    }
    const today = entry.args.today ?? getTodayString();
    localStore.setQuery(api.habits.list, entry.args, patch(entry.value, today));
  }
};

const optimisticToggleCheckin = (
  localStore: OptimisticLocalStore,
  args: { date: string; habitId: Id<"habits"> }
) => {
  patchListQueries(localStore, (rows, today) =>
    rows.map((row) => {
      if (row.id !== args.habitId) {
        return row;
      }
      const has = row.checkins.includes(args.date);
      const checkins = has
        ? row.checkins.filter((date) => date !== args.date)
        : [...row.checkins, args.date].sort();
      return { ...row, checkins, stats: computeHabitStats(checkins, today) };
    })
  );
};

const optimisticCreate = (
  localStore: OptimisticLocalStore,
  args: { categoryId: string; createdAt: string; name: string }
) => {
  patchListQueries(localStore, (rows, today) => {
    const tempRow: ListRow = {
      id: createTempId() as Id<"habits">,
      name: normalizeName(args.name),
      categoryId: args.categoryId,
      createdAt: args.createdAt,
      checkins: [],
      stats: computeHabitStats([], today),
    };
    return [...rows, tempRow].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
  });
};

const optimisticUpdate = (
  localStore: OptimisticLocalStore,
  args: { categoryId: string; habitId: Id<"habits">; name: string }
) => {
  patchListQueries(localStore, (rows) =>
    rows.map((row) =>
      row.id === args.habitId
        ? {
            ...row,
            name: normalizeName(args.name),
            categoryId: args.categoryId,
          }
        : row
    )
  );
};

const optimisticRemove = (
  localStore: OptimisticLocalStore,
  args: { habitId: Id<"habits"> }
) => {
  patchListQueries(localStore, (rows) =>
    rows.filter((row) => row.id !== args.habitId)
  );
};

const normalizeOnlineHabits = (habits: ListRow[]): Habit[] =>
  habits.map((habit) => ({
    ...habit,
    categoryId: resolveHabitCategoryId(habit.categoryId),
  }));

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const today = getTodayString();
  const onlineHabits = useQuery(
    api.habits.list,
    isAuthenticated ? { today } : "skip"
  );

  const createBase = useMutation(api.habits.create);
  const updateBase = useMutation(api.habits.update);
  const removeBase = useMutation(api.habits.remove);
  const toggleBase = useMutation(api.habits.toggleCheckin);

  const createOnlineHabit = useMemo(
    () => createBase.withOptimisticUpdate(optimisticCreate),
    [createBase]
  );
  const updateOnlineHabit = useMemo(
    () => updateBase.withOptimisticUpdate(optimisticUpdate),
    [updateBase]
  );
  const deleteOnlineHabit = useMemo(
    () => removeBase.withOptimisticUpdate(optimisticRemove),
    [removeBase]
  );
  const toggleOnlineCheckin = useMemo(
    () => toggleBase.withOptimisticUpdate(optimisticToggleCheckin),
    [toggleBase]
  );

  const addHabit = useCallback(
    async (input: { name: string; categoryId?: HabitCategoryId }) => {
      await createOnlineHabit({
        name: normalizeHabitName(input.name),
        categoryId: normalizeHabitCategoryId(input.categoryId),
        createdAt: getTodayString(),
      });
    },
    [createOnlineHabit]
  );

  const toggleCheckInToday = useCallback(
    async (id: string) => {
      await toggleOnlineCheckin({
        habitId: toOnlineHabitId(id),
        date: getTodayString(),
      });
    },
    [toggleOnlineCheckin]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      input: { name: string; categoryId: HabitCategoryId }
    ) => {
      await updateOnlineHabit({
        habitId: toOnlineHabitId(id),
        name: normalizeHabitName(input.name),
        categoryId: normalizeHabitCategoryId(input.categoryId),
      });
    },
    [updateOnlineHabit]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      await deleteOnlineHabit({ habitId: toOnlineHabitId(id) });
    },
    [deleteOnlineHabit]
  );

  const value = useMemo(
    () => ({
      habits: normalizeOnlineHabits(onlineHabits ?? []),
      isLoaded: onlineHabits !== undefined,
      today,
      addHabit,
      toggleCheckInToday,
      updateHabit,
      deleteHabit,
    }),
    [
      addHabit,
      deleteHabit,
      onlineHabits,
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
