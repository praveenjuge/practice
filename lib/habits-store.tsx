import { useLocalSearchParams } from "expo-router";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import type { Habit, HabitDetail, HabitList } from "../shared/api-types";
import {
  collectCheckIns,
  donateCheckIn,
  publishHabits,
  subscribeToCheckIns,
} from "./habit-surfaces";
import {
  applyPending,
  dequeueCheckIn,
  enqueueCheckIns,
  getTodayString,
  mergeDetail,
  type PendingCheckIn,
  rollForward,
} from "./habit-sync";
import { readJSON, removeJSON, writeJSON } from "./local-store";
import { ApiError, api, unwrap, useSession } from "./session";

export type {
  Habit,
  HabitHistoryWeek,
  RecentDay,
} from "../shared/api-types";

// Offline-first: the last list renders straight from the device, check-ins
// queue locally and sync with an idempotent PUT, and check-ins made on a
// widget, a control or with Siri join the same queue.

interface HabitInput {
  categoryId: string;
  name: string;
}

interface CachedList {
  date: string;
  habits: Habit[];
}

interface HabitsContextValue {
  addHabit: (input: HabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  habits: Habit[];
  isLoaded: boolean;
  /** Fetches the latest list (pull to refresh). */
  refresh: () => Promise<void>;
  /** Bumps after every change so detail views know to refetch. */
  revision: number;
  setCheckIn: (id: string, date: string, completed: boolean) => void;
  today: string;
  toggleCheckInToday: (id: string) => void;
  updateHabit: (id: string, input: HabitInput) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

const LIST_KEY = "habits";
const PENDING_KEY = "pending-checkins";
const DETAILS_KEY = "habit-details";

const readCachedHabits = (today: string) => {
  const cached = readJSON<CachedList>(LIST_KEY);
  return cached ? rollForward(cached.habits, cached.date, today) : null;
};

// Server answers that mean a queued check-in can never succeed (the habit was
// deleted, or the day is too old to change). Anything else is retried.
const isRejected = (error: unknown) =>
  error instanceof ApiError && (error.status === 400 || error.status === 404);

// Habit details (with a year of history), kept across launches so the
// details screen opens fully drawn.
let detailCache: Record<string, HabitDetail> | null = null;

const getDetailCache = () => {
  detailCache ??= readJSON<Record<string, HabitDetail>>(DETAILS_KEY) ?? {};
  return detailCache;
};

const fetchDetail = async (id: string, today: string) => {
  const detail = await unwrap(
    api.habits[":id"].$get({ param: { id }, query: { today } })
  );
  getDetailCache()[id] = detail;
  writeJSON(DETAILS_KEY, getDetailCache());
  return detail;
};

const clearLocalHabits = () => {
  detailCache = {};
  removeJSON(LIST_KEY);
  removeJSON(PENDING_KEY);
  removeJSON(DETAILS_KEY);
};

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const isSignedIn = session.status === "signedIn";
  const isSignedOut = session.status === "signedOut";
  const [today, setToday] = useState(getTodayString);
  const [serverHabits, setServerHabits] = useState<Habit[] | null>(() =>
    readCachedHabits(getTodayString())
  );
  const [pending, setPending] = useState<PendingCheckIn[]>(
    () => readJSON<PendingCheckIn[]>(PENDING_KEY) ?? []
  );
  const [revision, setRevision] = useState(0);
  // Bumps when a sync should republish to widgets even if nothing changed,
  // so their `changed` marks get cleared.
  const [publishCount, setPublishCount] = useState(0);
  const pendingRef = useRef(pending);
  const flushRef = useRef<Promise<void> | null>(null);
  const prefetchedRef = useRef(false);

  const updatePending = useCallback(
    (update: (queue: PendingCheckIn[]) => PendingCheckIn[]) => {
      const next = update(pendingRef.current);
      pendingRef.current = next;
      writeJSON(PENDING_KEY, next);
      setPending(next);
    },
    []
  );

  const applyList = useCallback((next: HabitList) => {
    const day = getTodayString();
    writeJSON(LIST_KEY, { date: day, habits: next.habits });
    setServerHabits(next.habits);
    setRevision((current) => current + 1);
  }, []);

  // Sends queued check-ins one at a time. Stops at the first network error
  // and leaves the rest queued for the next try.
  const flush = useCallback(() => {
    flushRef.current ??= (async () => {
      try {
        while (pendingRef.current.length > 0) {
          const [item] = pendingRef.current;
          try {
            applyList(
              // biome-ignore lint/performance/noAwaitInLoops: check-ins sync in order, one at a time
              await unwrap(
                api.habits[":id"].checkins[":date"].$put({
                  json: { completed: item.completed },
                  param: { date: item.date, id: item.habitId },
                  query: { today: getTodayString() },
                })
              )
            );
          } catch (error) {
            if (!isRejected(error)) {
              return;
            }
          }
          updatePending((queue) => dequeueCheckIn(queue, item));
        }
      } finally {
        flushRef.current = null;
      }
    })();
    return flushRef.current;
  }, [applyList, updatePending]);

  const load = useCallback(async () => {
    const day = getTodayString();
    setToday(day);
    const external = await collectCheckIns(day);
    if (external.length > 0) {
      updatePending((queue) => enqueueCheckIns(queue, external));
      setPublishCount((count) => count + 1);
    }
    await flush();
    applyList(await unwrap(api.habits.$get({ query: { today: day } })));
  }, [applyList, flush, updatePending]);

  useEffect(() => {
    if (isSignedOut) {
      clearLocalHabits();
      pendingRef.current = [];
      setPending([]);
      setServerHabits(null);
      return;
    }
    if (!isSignedIn) {
      return;
    }
    const refetch = () => {
      load().catch(() => {
        // Offline: keep showing the cached list; the next foreground retries.
      });
    };
    refetch();
    const appState = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        refetch();
      }
    });
    const unsubscribe = subscribeToCheckIns(refetch);
    // On web, sync queued check-ins as soon as the connection is back.
    const isWeb = Platform.OS === "web";
    if (isWeb) {
      globalThis.addEventListener("online", refetch);
    }
    return () => {
      appState.remove();
      unsubscribe();
      if (isWeb) {
        globalThis.removeEventListener("online", refetch);
      }
    };
  }, [isSignedIn, isSignedOut, load]);

  const habits = useMemo(
    () => (serverHabits ? applyPending(serverHabits, today, pending) : null),
    [pending, serverHabits, today]
  );

  // Keeps widgets, Siri and Spotlight in step with the list.
  useEffect(() => {
    if (isSignedOut) {
      publishHabits([], getTodayString(), false);
    } else if (habits) {
      publishHabits(habits, today, isSignedIn);
    }
  }, [habits, isSignedIn, isSignedOut, publishCount, today]);

  // Warms the details cache once per launch for habits never opened before.
  useEffect(() => {
    if (!serverHabits || revision === 0 || prefetchedRef.current) {
      return;
    }
    prefetchedRef.current = true;
    const missing = serverHabits.filter((habit) => !getDetailCache()[habit.id]);
    (async () => {
      for (const habit of missing) {
        // biome-ignore lint/performance/noAwaitInLoops: prefetch gently, one request at a time
        await fetchDetail(habit.id, today).catch(() => undefined);
      }
    })();
  }, [revision, serverHabits, today]);

  const setCheckIn = useCallback(
    (id: string, date: string, completed: boolean) => {
      updatePending((queue) =>
        enqueueCheckIns(queue, [{ completed, date, habitId: id }])
      );
      if (completed) {
        donateCheckIn(id);
      }
      flush().catch(() => undefined);
    },
    [flush, updatePending]
  );

  const toggleCheckInToday = useCallback(
    (id: string) => {
      const habit = habits?.find((item) => item.id === id);
      if (habit) {
        setCheckIn(id, today, !habit.checkedToday);
      }
    },
    [habits, setCheckIn, today]
  );

  const addHabit = useCallback(
    async (input: HabitInput) => {
      applyList(
        await unwrap(api.habits.$post({ json: input, query: { today } }))
      );
    },
    [applyList, today]
  );

  const updateHabit = useCallback(
    async (id: string, input: HabitInput) => {
      applyList(
        await unwrap(
          api.habits[":id"].$patch({
            json: input,
            param: { id },
            query: { today },
          })
        )
      );
    },
    [applyList, today]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      applyList(
        await unwrap(
          api.habits[":id"].$delete({ param: { id }, query: { today } })
        )
      );
      delete getDetailCache()[id];
      writeJSON(DETAILS_KEY, getDetailCache());
    },
    [applyList, today]
  );

  const value = useMemo(
    () => ({
      addHabit,
      deleteHabit,
      habits: habits ?? [],
      isLoaded: habits !== null,
      refresh: load,
      revision,
      setCheckIn,
      today,
      toggleCheckInToday,
      updateHabit,
    }),
    [
      addHabit,
      deleteHabit,
      habits,
      load,
      revision,
      setCheckIn,
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

/** The `[id]` route param, for screens under /habit/[id]. */
export function useHabitIdParam(): string | undefined {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return Array.isArray(id) ? id[0] : id;
}

type DetailState =
  | { status: "loading" }
  | { status: "missing" }
  | { detail: HabitDetail; status: "ready" };

// One habit with its year of history. Shows the cached copy at once, then
// refetches after any change to the list so streaks match the server.
export function useHabitDetail(id: string | undefined): DetailState {
  const { habits, isLoaded, revision, today } = useHabits();
  const [fetched, setFetched] = useState<{
    detail: HabitDetail | null;
    id: string;
  } | null>(null);
  const listed = habits.find((habit) => habit.id === id);

  useEffect(() => {
    if (!id || revision === 0) {
      return;
    }
    let cancelled = false;
    fetchDetail(id, today)
      .then((next) => {
        if (!cancelled) {
          setFetched({ detail: next, id });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && isRejected(error)) {
          setFetched({ detail: null, id });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, revision, today]);

  if (!id || (isLoaded && !listed)) {
    return { status: "missing" };
  }
  const detail =
    fetched?.id === id ? fetched.detail : (getDetailCache()[id] ?? null);
  if (fetched?.id === id && !detail) {
    return { status: "missing" };
  }
  if (!detail) {
    return { status: "loading" };
  }
  // Show list changes (like an offline check-in) on top of the history.
  return {
    detail: listed ? mergeDetail(detail, listed) : detail,
    status: "ready",
  };
}
