// Turns habits into widget props and reads check-ins made on a widget back
// out, for lib/habit-surfaces.*.ts.
import { getHabitCategory } from "../shared/habit-categories";
import type { TodayWidgetProps } from "../widgets/types";
import { getTodayString, type PendingCheckIn } from "./habit-sync";
import type { Habit } from "./habits-store";

export const toWidgetProps = (
  habits: Habit[],
  today: string,
  signedIn: boolean
): TodayWidgetProps => ({
  date: today,
  habits: habits.map((habit) => ({
    changed: false,
    done: habit.checkedToday,
    id: habit.id,
    name: habit.name,
  })),
  signedIn,
});

/** The same habits on the next day, nothing checked yet. */
export const nextDayProps = (props: TodayWidgetProps): TodayWidgetProps => {
  const [year, month, day] = props.date.split("-").map(Number);
  return {
    ...props,
    date: getTodayString(new Date(year, month - 1, day + 1)),
    habits: props.habits.map((habit) => ({ ...habit, done: false })),
  };
};

export const startOfNextDay = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

/** Check-ins made on a widget (or by Siri or a control) since the app last synced. */
export const changedCheckIns = (
  props: TodayWidgetProps | null | undefined
): PendingCheckIn[] =>
  (props?.date ? props.habits : [])
    .filter((habit) => habit.changed)
    .map((habit) => ({
      completed: habit.done,
      date: props?.date ?? "",
      habitId: habit.id,
    }));

/** What Siri and Spotlight know about each habit. */
export const toEntityCatalog = (habits: Habit[]) =>
  habits.map((habit) => ({
    id: habit.id,
    subtitle: getHabitCategory(habit.categoryId).label,
    title: habit.name,
  }));
