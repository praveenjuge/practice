// Props shared by the app and the home and lock screen widgets. The widgets
// run in their own runtime and only ever see these props.

export interface WidgetHabit {
  /** True once a widget, control or Siri changed `done` (synced by the app). */
  changed: boolean;
  done: boolean;
  id: string;
  name: string;
}

export interface TodayWidgetProps {
  /** The calendar day these check-ins belong to (YYYY-MM-DD). */
  date: string;
  habits: WidgetHabit[];
  signedIn: boolean;
}

export const EMPTY_WIDGET_PROPS: TodayWidgetProps = {
  date: "",
  habits: [],
  signedIn: false,
};

// Names must match the widget entries in app.config.ts.
export const TODAY_WIDGET = "TodayWidget";
export const PROGRESS_WIDGET = "ProgressWidget";
