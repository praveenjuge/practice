import { requireOptionalNativeModule } from "expo";
import { addUserInteractionListener } from "expo-widgets";
import TodayWidget from "../widgets/today-widget.android";
import type { TodayWidgetProps } from "../widgets/types";
import type { PendingCheckIn } from "./habit-sync";
import type { Habit } from "./habits-store";
import { changedCheckIns, toWidgetProps } from "./widget-props";

// native/WidgetStateModule.kt: reads the widget's saved props, which
// expo-widgets doesn't expose on Android.
const WidgetState = requireOptionalNativeModule<{
  readProps: (name: string) => string | null;
}>("WidgetState");

export const publishHabits = (
  habits: Habit[],
  today: string,
  signedIn: boolean
) => {
  TodayWidget.updateSnapshot(toWidgetProps(habits, today, signedIn));
};

export const collectCheckIns = (today: string): Promise<PendingCheckIn[]> => {
  try {
    const saved = WidgetState?.readProps("TodayWidget");
    const props = saved ? (JSON.parse(saved) as TodayWidgetProps) : null;
    return Promise.resolve(
      changedCheckIns(props).filter((item) => item.date <= today)
    );
  } catch {
    return Promise.resolve([]);
  }
};

// Siri and Spotlight are iOS only.
export const donateCheckIn = (_habitId: string) => undefined;

export const subscribeToCheckIns = (onCheckIn: () => void) => {
  const subscription = addUserInteractionListener(onCheckIn);
  return () => subscription.remove();
};
