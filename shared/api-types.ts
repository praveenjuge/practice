// Response shapes shared by the Worker API and the app. The server computes
// everything here; clients only render it.

export const MAX_HABIT_NAME_LENGTH = 120;
export const RECENT_DAY_COUNT = 30;
/** Check-ins older than this many days can't be changed (offline replays). */
export const MAX_CHECKIN_AGE_DAYS = 7;

export interface HabitStats {
  bestStreak: number;
  currentStreak: number;
  lastCheckin: string | null;
  totalCheckins: number;
}

export interface RecentDay {
  completed: boolean;
  date: string;
}

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

export interface Habit {
  categoryId: string;
  checkedToday: boolean;
  id: string;
  name: string;
  /** The last RECENT_DAY_COUNT days, oldest first, ending today. */
  recentDays: RecentDay[];
  stats: HabitStats;
}

export interface HabitDetail extends Habit {
  history: HabitHistoryWeek[];
}

export interface HabitList {
  habits: Habit[];
}

export interface AccountUser {
  email: string;
  firstName: string | null;
  id: string;
  lastName: string | null;
  profilePictureUrl: string | null;
}

export interface AuthSession {
  accessToken: string;
  /** Omitted on web, where the refresh token lives in an httpOnly cookie. */
  refreshToken?: string;
  user: AccountUser;
}

export interface ApiErrorBody {
  error: string;
}
