import {
  addAppIntentListener,
  donateIntentAsync,
  getPendingInvocationsAsync,
  removePendingInvocationAsync,
  setEntityCatalogAsync,
} from "expo-app-intents";
import { addUserInteractionListener } from "expo-widgets";
import ProgressWidget from "../widgets/progress-widget.ios";
import TodayWidget from "../widgets/today-widget.ios";
import { getTodayString, type PendingCheckIn } from "./habit-sync";
import type { Habit } from "./habits-store";
import {
  changedCheckIns,
  nextDayProps,
  startOfNextDay,
  toEntityCatalog,
  toWidgetProps,
} from "./widget-props";

const CHECK_IN_INTENT = "checkInHabit";

export const publishHabits = (
  habits: Habit[],
  today: string,
  signedIn: boolean
) => {
  const props = toWidgetProps(habits, today, signedIn);
  // A second entry clears the checkmarks at midnight, even if the app
  // isn't opened.
  const timeline = [
    { date: new Date(), props },
    { date: startOfNextDay(), props: nextDayProps(props) },
  ];
  TodayWidget.updateTimeline(timeline);
  ProgressWidget.updateTimeline(timeline);
  // An empty catalog also clears habits from Siri and Spotlight on sign-out.
  setEntityCatalogAsync("habit", signedIn ? toEntityCatalog(habits) : []).catch(
    () => {
      // Siri and Spotlight are extras; the app works without them.
    }
  );
};

export const collectCheckIns = async (
  today: string
): Promise<PendingCheckIn[]> => {
  const [timeline, invocations] = await Promise.all([
    TodayWidget.getTimeline().catch(() => []),
    getPendingInvocationsAsync().catch(() => []),
  ]);
  const fromWidget = timeline.flatMap((entry) => changedCheckIns(entry.props));
  // Siri also writes to the widget; this covers a habit the widget didn't
  // have yet.
  const fromSiri: PendingCheckIn[] = [];
  for (const invocation of invocations) {
    const { habitId } = invocation.params;
    if (invocation.name === CHECK_IN_INTENT && typeof habitId === "string") {
      fromSiri.push({
        completed: true,
        date: getTodayString(new Date(invocation.createdAt)),
        habitId,
      });
    }
    removePendingInvocationAsync(invocation.id).catch(() => {
      // Delivery is at-least-once; a duplicate check-in is harmless.
    });
  }
  return [...fromSiri, ...fromWidget].filter((item) => item.date <= today);
};

export const donateCheckIn = (habitId: string) => {
  donateIntentAsync(CHECK_IN_INTENT, { habitId }).catch(() => {
    // Suggestions are best effort.
  });
};

export const subscribeToCheckIns = (onCheckIn: () => void) => {
  const widget = addUserInteractionListener(onCheckIn);
  const siri = addAppIntentListener(onCheckIn);
  return () => {
    widget.remove();
    siri.remove();
  };
};
