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
  useIsCloudAvailable,
} from "react-native-cloud-storage";
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

interface HabitsContextValue {
  addHabit: (input: {
    name: string;
    categoryId?: HabitCategoryId;
  }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  error: string | null;
  habits: Habit[];
  isCloudAvailable: boolean;
  isLoaded: boolean;
  reload: () => Promise<void>;
  toggleCheckInToday: (id: string) => Promise<void>;
  updateHabit: (
    id: string,
    input: { name: string; categoryId: HabitCategoryId }
  ) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

const HABITS_DIR = "/practice";
const HABITS_FILE = "/practice/habits.json";
const FILE_VERSION = 2;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE_SCOPE = CloudStorageScope.AppData;
export const MAX_HABIT_NAME_LENGTH = 120;

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
  return Array.from(unique);
};

const normalizeHabitName = (name: unknown) => {
  if (typeof name !== "string") {
    throw new Error("Habit name is required.");
  }
  const trimmed = name.trim();
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
  if (typeof categoryId !== "string") {
    throw new Error("Invalid habit category.");
  }
  if (!isValidHabitCategoryId(categoryId)) {
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

export const getStreaks = (
  checkins: string[],
  today = getTodayString()
): HabitStreaks => {
  const normalized = normalizeDateArray(checkins);
  if (normalized.length === 0 || !isValidDateString(today)) {
    return { current: 0, best: 0 };
  }

  const sorted = normalized.slice().sort();
  const set = new Set(sorted);
  const latest = sorted.at(-1);
  if (!latest) {
    return { current: 0, best: 0 };
  }

  let current = 0;
  const gap = diffInDays(parseDateString(today), parseDateString(latest));
  if (gap === 0) {
    current = streakFrom(today, set);
  } else if (gap === 1) {
    current = streakFrom(latest, set);
  }

  let best = 0;
  for (const date of sorted) {
    const prev = formatDate(addDays(parseDateString(date), -1));
    if (!set.has(prev)) {
      const length = streakFrom(date, set);
      if (length > best) {
        best = length;
      }
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
          record.checkins.filter(
            (value): value is string => typeof value === "string"
          )
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

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isNotFoundError = (error: unknown) =>
  error instanceof CloudStorageError &&
  (error.code === CloudStorageErrorCode.FILE_NOT_FOUND ||
    error.code === CloudStorageErrorCode.DIRECTORY_NOT_FOUND);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const isCloudAvailable = useIsCloudAvailable();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const runIfActive = (task: () => void) => {
      if (!cancelled) {
        task();
      }
    };

    const ensureStoragePath = async () => {
      const dirExists = await CloudStorage.exists(HABITS_DIR, STORAGE_SCOPE);
      if (!dirExists) {
        await CloudStorage.mkdir(HABITS_DIR, STORAGE_SCOPE);
      }
    };

    const writeEmptyFile = async () => {
      await CloudStorage.writeFile(
        HABITS_FILE,
        JSON.stringify({ version: FILE_VERSION, habits: [] }),
        STORAGE_SCOPE
      );
    };

    const readFromCloud = async () => {
      await ensureStoragePath();
      const fileExists = await CloudStorage.exists(HABITS_FILE, STORAGE_SCOPE);
      if (!fileExists) {
        await writeEmptyFile();
        return [];
      }
      try {
        await CloudStorage.triggerSync(HABITS_FILE, STORAGE_SCOPE);
      } catch {
        // Ignore sync issues; readFile will still try to access the file.
      }
      try {
        const content = await CloudStorage.readFile(HABITS_FILE, STORAGE_SCOPE);
        return parseHabitsContent(content);
      } catch (readError) {
        if (isNotFoundError(readError)) {
          await writeEmptyFile();
          return [];
        }
        throw readError;
      }
    };

    const ensureReady = async () => {
      if (!isCloudAvailable) {
        runIfActive(() => setIsLoaded(true));
        return;
      }

      setIsLoaded(false);
      try {
        const nextHabits = await readFromCloud();
        runIfActive(() => {
          setHabits(nextHabits);
          setError(null);
        });
      } catch {
        runIfActive(() => setError("Unable to access iCloud right now."));
      } finally {
        runIfActive(() => setIsLoaded(true));
      }
    };

    ensureReady();

    return () => {
      cancelled = true;
    };
  }, [isCloudAvailable]);

  const saveHabits = useCallback(
    async (nextHabits: Habit[]) => {
      setHabits(nextHabits);
      const payload = JSON.stringify({
        version: FILE_VERSION,
        habits: nextHabits,
      });
      if (!isCloudAvailable) {
        setError("iCloud is unavailable. Changes stay on this device.");
        return;
      }
      try {
        const dirExists = await CloudStorage.exists(HABITS_DIR, STORAGE_SCOPE);
        if (!dirExists) {
          await CloudStorage.mkdir(HABITS_DIR, STORAGE_SCOPE);
        }
        await CloudStorage.writeFile(HABITS_FILE, payload, STORAGE_SCOPE);
        setError(null);
      } catch (err) {
        if (isNotFoundError(err)) {
          try {
            await CloudStorage.mkdir(HABITS_DIR, STORAGE_SCOPE);
            await CloudStorage.writeFile(HABITS_FILE, payload, STORAGE_SCOPE);
            setError(null);
            return;
          } catch {
            setError("Unable to save changes to iCloud.");
            return;
          }
        }
        setError("Unable to save changes to iCloud.");
      }
    },
    [isCloudAvailable]
  );

  const addHabit = useCallback(
    async (input: { name: string; categoryId?: HabitCategoryId }) => {
      if (!input || typeof input !== "object") {
        throw new Error("Habit details are required.");
      }
      const trimmed = normalizeHabitName(input.name);
      const today = getTodayString();
      const nextHabits = [
        ...habits,
        {
          id: createId(),
          name: trimmed,
          categoryId: normalizeHabitCategoryId(input.categoryId),
          createdAt: today,
          checkins: [],
        },
      ];
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const toggleCheckInToday = useCallback(
    async (id: string) => {
      if (!id) {
        throw new Error("Habit ID is required.");
      }
      const today = getTodayString();
      let didUpdate = false;
      const nextHabits = habits.map((habit) => {
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
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const updateHabit = useCallback(
    async (
      id: string,
      input: { name: string; categoryId: HabitCategoryId }
    ) => {
      if (!id) {
        throw new Error("Habit ID is required.");
      }
      if (!input || typeof input !== "object") {
        throw new Error("Habit details are required.");
      }
      const trimmed = normalizeHabitName(input.name);
      const categoryId = normalizeHabitCategoryId(input.categoryId);
      let didUpdate = false;
      const nextHabits = habits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }
        didUpdate = true;
        return { ...habit, name: trimmed, categoryId };
      });
      if (!didUpdate) {
        throw new Error("Habit not found.");
      }
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      if (!id) {
        throw new Error("Habit ID is required.");
      }
      const nextHabits = habits.filter((habit) => habit.id !== id);
      if (nextHabits.length === habits.length) {
        throw new Error("Habit not found.");
      }
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const reload = useCallback(async () => {
    if (!isCloudAvailable) {
      return;
    }
    try {
      const dirExists = await CloudStorage.exists(HABITS_DIR, STORAGE_SCOPE);
      if (!dirExists) {
        await CloudStorage.mkdir(HABITS_DIR, STORAGE_SCOPE);
      }
      const fileExists = await CloudStorage.exists(HABITS_FILE, STORAGE_SCOPE);
      if (!fileExists) {
        await CloudStorage.writeFile(
          HABITS_FILE,
          JSON.stringify({ version: FILE_VERSION, habits: [] }),
          STORAGE_SCOPE
        );
        setHabits([]);
        setError(null);
        return;
      }
      try {
        await CloudStorage.triggerSync(HABITS_FILE, STORAGE_SCOPE);
      } catch {
        // Ignore sync issues and try reading anyway.
      }
      const content = await CloudStorage.readFile(HABITS_FILE, STORAGE_SCOPE);
      const nextHabits = parseHabitsContent(content);
      setHabits(nextHabits);
      setError(null);
    } catch {
      setError("Unable to refresh from iCloud.");
    }
  }, [isCloudAvailable]);

  const value = useMemo(
    () => ({
      habits,
      isLoaded,
      isCloudAvailable,
      error,
      addHabit,
      toggleCheckInToday,
      updateHabit,
      deleteHabit,
      reload,
    }),
    [
      habits,
      isLoaded,
      isCloudAvailable,
      error,
      addHabit,
      toggleCheckInToday,
      updateHabit,
      deleteHabit,
      reload,
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
