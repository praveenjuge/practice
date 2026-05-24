import { useAuth } from "@clerk/expo";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  CloudStorage,
  CloudStorageError,
  CloudStorageErrorCode,
  CloudStorageProvider,
  CloudStorageScope,
} from "react-native-cloud-storage";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import {
  type HabitCategoryId,
  isValidHabitCategoryId,
  resolveHabitCategoryId,
} from "./habit-categories";

if (Platform.OS === "ios") {
  CloudStorage.setProvider(CloudStorageProvider.ICloud);
}

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

const DATABASE_NAME = "practice.db";
const DATABASE_VERSION = 1;
const HABITS_FILE = "/practice/habits.json";
const STORAGE_SCOPE = CloudStorageScope.AppData;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CLAIM_KEY = "claim_key";
const ICLOUD_IMPORT_DONE_KEY = "icloud_import_done_v1";
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

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createClaimKey = () => `claim-${createId()}`;

const isNotFoundError = (error: unknown) =>
  error instanceof CloudStorageError &&
  (error.code === CloudStorageErrorCode.FILE_NOT_FOUND ||
    error.code === CloudStorageErrorCode.DIRECTORY_NOT_FOUND);

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

const sanitizeHabits = (raw: unknown) => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const today = getTodayString();
  const sanitized: Habit[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.name !== "string") {
      continue;
    }
    const name = record.name.trim();
    if (!name) {
      continue;
    }
    const createdAt =
      typeof record.createdAt === "string" &&
      isValidDateString(record.createdAt)
        ? record.createdAt
        : today;
    const checkins = Array.isArray(record.checkins)
      ? normalizeDateArray(
          record.checkins.filter((v): v is string => typeof v === "string")
        )
      : [];
    sanitized.push({
      id: record.id,
      name,
      categoryId: resolveHabitCategoryId(
        typeof record.categoryId === "string" ? record.categoryId : null
      ),
      createdAt,
      checkins,
    });
  }
  return sanitized;
};

const parseHabitsContent = (content: string) => {
  if (!content.trim()) {
    return [];
  }
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return sanitizeHabits(parsed);
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { habits?: unknown }).habits)
  ) {
    return sanitizeHabits((parsed as { habits: unknown }).habits);
  }
  return [];
};

const openDatabase = async () => {
  const db = await openDatabaseAsync(DATABASE_NAME);
  const current = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  if ((current?.user_version ?? 0) < DATABASE_VERSION) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS checkins (
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY (habit_id, date)
      );
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      PRAGMA user_version = ${DATABASE_VERSION};
    `);
  }
  const claim = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    CLAIM_KEY
  );
  if (!claim) {
    await db.runAsync(
      "INSERT INTO app_meta (key, value) VALUES (?, ?)",
      CLAIM_KEY,
      createClaimKey()
    );
  }
  return db;
};

const getMeta = (db: SQLiteDatabase, key: string) =>
  db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?",
    key
  );

const setMeta = (db: SQLiteDatabase, key: string, value: string) =>
  db.runAsync(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
    key,
    value
  );

const readLocalHabits = async (db: SQLiteDatabase) => {
  const habits = await db.getAllAsync<{
    category_id: string;
    created_at: string;
    id: string;
    name: string;
  }>(
    "SELECT id, name, category_id, created_at FROM habits ORDER BY created_at ASC"
  );
  const checkins = await db.getAllAsync<{ date: string; habit_id: string }>(
    "SELECT habit_id, date FROM checkins ORDER BY date ASC"
  );
  const byHabit = new Map<string, string[]>();
  for (const checkin of checkins) {
    byHabit.set(checkin.habit_id, [
      ...(byHabit.get(checkin.habit_id) ?? []),
      checkin.date,
    ]);
  }
  return habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    categoryId: resolveHabitCategoryId(habit.category_id),
    createdAt: habit.created_at,
    checkins: byHabit.get(habit.id) ?? [],
  }));
};

const insertLocalHabits = async (db: SQLiteDatabase, habits: Habit[]) => {
  for (const habit of habits) {
    await db.runAsync(
      "INSERT OR IGNORE INTO habits (id, name, category_id, created_at) VALUES (?, ?, ?, ?)",
      habit.id,
      habit.name,
      habit.categoryId,
      habit.createdAt
    );
    for (const date of normalizeDateArray(habit.checkins)) {
      await db.runAsync(
        "INSERT OR IGNORE INTO checkins (habit_id, date) VALUES (?, ?)",
        habit.id,
        date
      );
    }
  }
};

const clearLocalHabits = async (db: SQLiteDatabase) => {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM checkins");
    await db.runAsync("DELETE FROM habits");
    await setMeta(db, CLAIM_KEY, createClaimKey());
  });
};

const readLegacyICloudHabits = async () => {
  if (Platform.OS !== "ios") {
    return [];
  }
  const exists = await CloudStorage.exists(HABITS_FILE, STORAGE_SCOPE);
  if (!exists) {
    return [];
  }
  try {
    await CloudStorage.triggerSync(HABITS_FILE, STORAGE_SCOPE);
  } catch {
    // Best-effort only; the next read may still return the local iCloud copy.
  }
  return parseHabitsContent(
    await CloudStorage.readFile(HABITS_FILE, STORAGE_SCOPE)
  );
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
  const mode: StorageMode = isSignedIn ? "signedIn" : "anonymous";
  const onlineHabits = useOnlineHabits(isAuthenticated);
  const createOnlineHabit = useMutation(api.habits.create);
  const updateOnlineHabit = useMutation(api.habits.update);
  const deleteOnlineHabit = useMutation(api.habits.remove);
  const toggleOnlineCheckin = useMutation(api.habits.toggleCheckin);
  const claimFromLocal = useMutation(api.habits.claimFromLocal);

  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [localHabits, setLocalHabits] = useState<Habit[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const [legacyImportReady, setLegacyImportReady] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [error, setError] = useState<string | null>(null);
  const today = mode === "signedIn" ? getUtcTodayString() : getTodayString();

  const loadLocal = useCallback(async (database: SQLiteDatabase) => {
    setLocalHabits(await readLocalHabits(database));
    setLocalLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    openDatabase()
      .then(async (database) => {
        if (cancelled) {
          return;
        }
        setDb(database);
        await loadLocal(database);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to open local storage.");
          setLocalLoaded(true);
          setLegacyImportReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadLocal]);

  useEffect(() => {
    if (!db || legacyImportReady) {
      return;
    }
    let cancelled = false;
    const importLegacyData = async () => {
      const done = await getMeta(db, ICLOUD_IMPORT_DONE_KEY);
      if (done) {
        setLegacyImportReady(true);
        return;
      }
      try {
        const imported = await readLegacyICloudHabits();
        await db.withTransactionAsync(async () => {
          await insertLocalHabits(db, imported);
        });
        await setMeta(db, ICLOUD_IMPORT_DONE_KEY, "1");
        if (!cancelled) {
          await loadLocal(db);
        }
      } catch (importError) {
        if (!isNotFoundError(importError)) {
          setError("Unable to import older iCloud habits.");
        }
      } finally {
        if (!cancelled) {
          setLegacyImportReady(true);
        }
      }
    };
    importLegacyData();
    return () => {
      cancelled = true;
    };
  }, [db, legacyImportReady, loadLocal]);

  useEffect(() => {
    if (
      !(db && isAuthenticated && localLoaded && legacyImportReady) ||
      localHabits.length === 0
    ) {
      return;
    }
    let cancelled = false;
    const claim = async () => {
      setSyncState("claiming");
      try {
        const claimKey =
          (await getMeta(db, CLAIM_KEY))?.value ?? createClaimKey();
        await claimFromLocal({ habits: localHabits, importKey: claimKey });
        await clearLocalHabits(db);
        if (!cancelled) {
          setLocalHabits([]);
          setError(null);
          setSyncState("online");
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to store local habits online. Your local data is still safe."
          );
          setSyncState("error");
        }
      }
    };
    claim();
    return () => {
      cancelled = true;
    };
  }, [
    claimFromLocal,
    db,
    isAuthenticated,
    legacyImportReady,
    localHabits,
    localLoaded,
  ]);

  useEffect(() => {
    if (mode === "anonymous") {
      setSyncState("idle");
      setError(null);
      return;
    }
    if (
      convexAuthLoading ||
      syncState === "claiming" ||
      syncState === "error"
    ) {
      return;
    }
    setSyncState(onlineHabits ? "online" : "offline");
  }, [convexAuthLoading, mode, onlineHabits, syncState]);

  const reload = useCallback(async () => {
    if (mode === "anonymous" && db) {
      await loadLocal(db);
    }
  }, [db, loadLocal, mode]);

  const saveLocalHabits = useCallback(
    async (nextHabits: Habit[]) => {
      if (!db) {
        throw new Error("Local storage is not ready.");
      }
      await db.withTransactionAsync(async () => {
        await db.runAsync("DELETE FROM checkins");
        await db.runAsync("DELETE FROM habits");
        await insertLocalHabits(db, nextHabits);
      });
      setLocalHabits(nextHabits);
    },
    [db]
  );

  const addHabit = useCallback(
    async (input: { name: string; categoryId?: HabitCategoryId }) => {
      const name = normalizeHabitName(input.name);
      const categoryId = normalizeHabitCategoryId(input.categoryId);
      if (mode === "signedIn") {
        await createOnlineHabit({
          name,
          categoryId,
          createdAt: getUtcTodayString(),
        });
        return;
      }
      await saveLocalHabits([
        ...localHabits,
        {
          id: createId(),
          name,
          categoryId,
          createdAt: getTodayString(),
          checkins: [],
        },
      ]);
    },
    [createOnlineHabit, localHabits, mode, saveLocalHabits]
  );

  const toggleCheckInToday = useCallback(
    async (id: string) => {
      if (mode === "signedIn") {
        await toggleOnlineCheckin({
          habitId: toOnlineHabitId(id),
          date: getUtcTodayString(),
        });
        return;
      }
      let didUpdate = false;
      const nextHabits = localHabits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }
        didUpdate = true;
        const hasToday = habit.checkins.includes(today);
        return {
          ...habit,
          checkins: hasToday
            ? habit.checkins.filter((checkin) => checkin !== today)
            : normalizeDateArray([...habit.checkins, today]),
        };
      });
      if (!didUpdate) {
        throw new Error("Habit not found.");
      }
      await saveLocalHabits(nextHabits);
    },
    [localHabits, mode, saveLocalHabits, today, toggleOnlineCheckin]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      input: { name: string; categoryId: HabitCategoryId }
    ) => {
      const name = normalizeHabitName(input.name);
      const categoryId = normalizeHabitCategoryId(input.categoryId);
      if (mode === "signedIn") {
        await updateOnlineHabit({
          habitId: toOnlineHabitId(id),
          name,
          categoryId,
        });
        return;
      }
      let didUpdate = false;
      const nextHabits = localHabits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }
        didUpdate = true;
        return { ...habit, name, categoryId };
      });
      if (!didUpdate) {
        throw new Error("Habit not found.");
      }
      await saveLocalHabits(nextHabits);
    },
    [localHabits, mode, saveLocalHabits, updateOnlineHabit]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      if (mode === "signedIn") {
        await deleteOnlineHabit({ habitId: toOnlineHabitId(id) });
        return;
      }
      const nextHabits = localHabits.filter((habit) => habit.id !== id);
      if (nextHabits.length === localHabits.length) {
        throw new Error("Habit not found.");
      }
      await saveLocalHabits(nextHabits);
    },
    [deleteOnlineHabit, localHabits, mode, saveLocalHabits]
  );

  const habits =
    mode === "signedIn"
      ? normalizeOnlineHabits(onlineHabits ?? [])
      : localHabits;
  const isLoaded =
    mode === "anonymous"
      ? localLoaded && legacyImportReady
      : onlineHabits !== undefined;

  const value = useMemo(
    () => ({
      habits,
      isLoaded,
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
      deleteHabit,
      error,
      habits,
      isLoaded,
      mode,
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
