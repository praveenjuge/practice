import React, {
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

if (Platform.OS === "ios") {
  CloudStorage.setProvider(CloudStorageProvider.ICloud);
}

export type Habit = {
  id: string;
  name: string;
  createdAt: string;
  checkins: string[];
};

export type HabitStreaks = {
  current: number;
  best: number;
};

type HabitsContextValue = {
  habits: Habit[];
  isLoaded: boolean;
  isCloudAvailable: boolean;
  error: string | null;
  addHabit: (name: string) => Promise<void>;
  toggleCheckInToday: (id: string) => Promise<void>;
  renameHabit: (id: string, name: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reload: () => Promise<void>;
};

const HabitsContext = createContext<HabitsContextValue | null>(null);

const HABITS_DIR = "/practice";
const HABITS_FILE = "/practice/habits.json";
const FILE_VERSION = 1;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE_SCOPE = CloudStorageScope.AppData;

const pad2 = (value: number) => String(value).padStart(2, "0");

export const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;

export const getTodayString = (date = new Date()) => formatDate(date);

const parseDateString = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const diffInDays = (left: Date, right: Date) =>
  Math.round((left.getTime() - right.getTime()) / 86400000);

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
  const latest = sorted[sorted.length - 1];

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

    const ensureStoragePath = async () => {
      const dirExists = await CloudStorage.exists(
        HABITS_DIR,
        STORAGE_SCOPE
      );
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
      const fileExists = await CloudStorage.exists(
        HABITS_FILE,
        STORAGE_SCOPE
      );
      if (!fileExists) {
        await writeEmptyFile();
        return [];
      }
      try {
        await CloudStorage.triggerSync(HABITS_FILE, STORAGE_SCOPE);
      } catch (syncError) {
        // Ignore sync issues; readFile will still try to access the file.
      }
      try {
        const content = await CloudStorage.readFile(
          HABITS_FILE,
          STORAGE_SCOPE
        );
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
        if (!cancelled) {
          setIsLoaded(true);
        }
        return;
      }

      try {
        setIsLoaded(false);
        const nextHabits = await readFromCloud();
        if (!cancelled) {
          setHabits(nextHabits);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to access iCloud right now.");
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
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
        const dirExists = await CloudStorage.exists(
          HABITS_DIR,
          STORAGE_SCOPE
        );
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
          } catch (retryError) {
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
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      const today = getTodayString();
      const nextHabits = [
        ...habits,
        {
          id: createId(),
          name: trimmed,
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
      const today = getTodayString();
      const nextHabits = habits.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }
        const hasToday = habit.checkins.includes(today);
        return {
          ...habit,
          checkins: hasToday
            ? habit.checkins.filter((checkin) => checkin !== today)
            : normalizeDateArray([...habit.checkins, today]),
        };
      });
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const renameHabit = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      const nextHabits = habits.map((habit) =>
        habit.id === id ? { ...habit, name: trimmed } : habit
      );
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      const nextHabits = habits.filter((habit) => habit.id !== id);
      await saveHabits(nextHabits);
    },
    [habits, saveHabits]
  );

  const reload = useCallback(async () => {
    if (!isCloudAvailable) {
      return;
    }
    try {
      const dirExists = await CloudStorage.exists(
        HABITS_DIR,
        STORAGE_SCOPE
      );
      if (!dirExists) {
        await CloudStorage.mkdir(HABITS_DIR, STORAGE_SCOPE);
      }
      const fileExists = await CloudStorage.exists(
        HABITS_FILE,
        STORAGE_SCOPE
      );
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
      } catch (syncError) {
        // Ignore sync issues and try reading anyway.
      }
      const content = await CloudStorage.readFile(
        HABITS_FILE,
        STORAGE_SCOPE
      );
      const nextHabits = parseHabitsContent(content);
      setHabits(nextHabits);
      setError(null);
    } catch (err) {
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
      renameHabit,
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
      renameHabit,
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
