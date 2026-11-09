// Text for the sign-in screen, shared by iOS, Android and web.

export const WELCOME_TITLE = "Practice";
export const WELCOME_SUBTITLE = "Build habits that stick, one day at a time.";

export const WELCOME_FEATURES = [
  {
    detail: "Tick off each habit in one tap.",
    key: "checkins",
    title: "Daily check-ins",
  },
  {
    detail: "See your current and best streaks grow.",
    key: "streaks",
    title: "Streaks that motivate",
  },
  {
    detail: "Look back on a whole year of progress.",
    key: "history",
    title: "Full-year history",
  },
  {
    detail: "Pick up where you left off on any device.",
    key: "sync",
    title: "Synced everywhere",
  },
] as const;

export type WelcomeFeatureKey = (typeof WELCOME_FEATURES)[number]["key"];
