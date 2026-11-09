import { useLocalSearchParams } from "expo-router";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import type { Habit, HabitDetail } from "../shared/api-types";
import { api, unwrap, useSession } from "./session";

export type {
  Habit,
  HabitHistoryWeek,
  RecentDay,
} from "../shared/api-types";

interface HabitInput {
  categoryId: string;
  name: string;
}

interface HabitsContextValue {
  addHabit: (input: HabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  habits: Habit[];
  isLoaded: boolean;
  /** Bumps after every change so detail views know to refetch. */
  revision: number;
  today: string;
  toggleCheckInToday: (id: string) => Promise<void>;
  updateHabit: (id: string, input: HabitInput) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

const pad2 = (value: number) => String(value).padStart(2, "0");

// The user's local calendar day; the server computes streaks against it.
const getTodayString = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// Instant feedback while the toggle request is in flight.
const flipToday = (habit: Habit, today: string): Habit => ({
  ...habit,
  checkedToday: !habit.checkedToday,
  recentDays: habit.recentDays.map((day) =>
    day.date === today ? { ...day, completed: !habit.checkedToday } : day
  ),
});

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const isSignedIn = session.status === "signedIn";
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [revision, setRevision] = useState(0);
  const [today, setToday] = useState(getTodayString);

  const applyList = useCallback((next: { habits: Habit[] }) => {
    setHabits(next.habits);
    setRevision((current) => current + 1);
  }, []);

  const load = useCallback(async () => {
    const day = getTodayString();
    setToday(day);
    applyList(await unwrap(api.habits.$get({ query: { today: day } })));
  }, [applyList]);

  useEffect(() => {
    if (!isSignedIn) {
      setHabits(null);
      return;
    }
    load().catch(() => {
      // Leave the list as it is; the next foreground refetch retries.
    });
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        load().catch(() => {
          // Same as above.
        });
      }
    });
    return () => subscription.remove();
  }, [isSignedIn, load]);

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
    },
    [applyList, today]
  );

  const toggleCheckInToday = useCallback(
    async (id: string) => {
      const previous = habits;
      setHabits(
        (current) =>
          current?.map((habit) =>
            habit.id === id ? flipToday(habit, today) : habit
          ) ?? current
      );
      try {
        applyList(
          await unwrap(
            api.habits[":id"]["toggle-today"].$post({
              param: { id },
              query: { today },
            })
          )
        );
      } catch (error) {
        setHabits(previous);
        throw error;
      }
    },
    [applyList, habits, today]
  );

  const value = useMemo(
    () => ({
      addHabit,
      deleteHabit,
      habits: habits ?? [],
      isLoaded: habits !== null,
      revision,
      today,
      toggleCheckInToday,
      updateHabit,
    }),
    [
      addHabit,
      deleteHabit,
      habits,
      revision,
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

// One habit with its year of history. Refetches after any change to the list
// so streaks and history stay in step with the server.
export function useHabitDetail(id: string | undefined): DetailState {
  const { habits, revision, today } = useHabits();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const listed = habits.find((habit) => habit.id === id);

  useEffect(() => {
    if (!id || revision === 0) {
      return;
    }
    let cancelled = false;
    unwrap(api.habits[":id"].$get({ param: { id }, query: { today } }))
      .then((detail) => {
        if (!cancelled) {
          setState({ detail, status: "ready" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "missing" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, revision, today]);

  if (!id || (revision > 0 && !listed)) {
    return { status: "missing" };
  }
  // Show list changes (like an optimistic check-in) before the refetch lands.
  if (state.status === "ready" && listed) {
    return {
      detail: { ...state.detail, ...listed, history: state.detail.history },
      status: "ready",
    };
  }
  return state;
}
