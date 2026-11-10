// Places outside the app that show habits or take check-ins: widgets, Siri,
// Shortcuts, Spotlight and Control Center. Implemented for iOS and Android
// (habit-surfaces.ios.ts, habit-surfaces.android.ts); on web there are none.

import type { PendingCheckIn } from "./habit-sync";
import type { Habit } from "./habits-store";

/** Shows the latest habits in widgets, Siri and Spotlight. */
export const publishHabits = (
  _habits: Habit[],
  _today: string,
  _signedIn: boolean
) => undefined;

/** Check-ins made outside the app since it last synced. */
export const collectCheckIns = (_today: string): Promise<PendingCheckIn[]> =>
  Promise.resolve([]);

/** Tells the system the user checked a habit in, for suggestions. */
export const donateCheckIn = (_habitId: string) => undefined;

/** Calls back when a widget, control or Siri checks in while the app runs. */
export const subscribeToCheckIns = (_onCheckIn: () => void) => () => undefined;
