import { useAuth } from "@clerk/expo";
import { UserButton } from "@clerk/expo/web";
import { Host, TextInput } from "@expo/ui";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  type PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { APP_ACCENT_COLOR } from "./app-colors";
import {
  getHabitCategory,
  HABIT_CATEGORIES,
  type HabitCategoryId,
  resolveHabitCategoryId,
} from "./habit-categories";
import {
  getRollingWeekCheckins,
  getStreaks,
  getYearHabitHistory,
  type Habit,
  type HabitHistoryWeek,
  hasCheckInToday,
  MAX_HABIT_NAME_LENGTH,
  useHabits,
} from "./habits-store";

interface WebHabitsAppProps {
  selectedHabitId?: string;
}

interface WebHabitFormProps {
  habitId?: string;
}

const WEB_SIGN_IN_URL = process.env.EXPO_PUBLIC_CLERK_SIGN_IN_URL ?? "";
const WIDE_BREAKPOINT = 900;
const DANGER_COLOR = "#ff3b30";

interface Palette {
  accentSoft: string;
  border: string;
  fieldBg: string;
  hairline: string;
  hover: string;
  page: string;
  panel: string;
  secondary: string;
  shadow: string;
  sidebar: string;
  text: string;
  track: string;
}

const DARK_PALETTE: Palette = {
  page: "#000000",
  panel: "#1c1c1e",
  sidebar: "#141416",
  text: "#f5f5f7",
  secondary: "#98989f",
  border: "#2a2a2c",
  hairline: "#38383a",
  hover: "rgba(255,255,255,0.06)",
  track: "#2c2c2e",
  accentSoft: `${APP_ACCENT_COLOR}33`,
  fieldBg: "#1c1c1e",
  shadow: "none",
};

const LIGHT_PALETTE: Palette = {
  page: "#f5f5f7",
  panel: "#ffffff",
  sidebar: "#fbfbfd",
  text: "#1d1d1f",
  secondary: "#6e6e73",
  border: "#e4e4e9",
  hairline: "#d2d2d7",
  hover: "rgba(0,0,0,0.035)",
  track: "#e8e8ed",
  accentSoft: `${APP_ACCENT_COLOR}1f`,
  fieldBg: "#ffffff",
  shadow: "0px 1px 2px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.05)",
};

function usePalette(): Palette {
  const isDark = useColorScheme() === "dark";
  return isDark ? DARK_PALETTE : LIGHT_PALETTE;
}

const isHovered = (state: PressableStateCallbackType): boolean =>
  Boolean((state as { hovered?: boolean }).hovered);

function selectableBackground(
  state: PressableStateCallbackType,
  isSelected: boolean,
  palette: Palette
): string {
  if (isSelected) {
    return palette.accentSoft;
  }
  if (isHovered(state)) {
    return palette.hover;
  }
  return "transparent";
}

type WebButtonVariant = "filled" | "outlined";

function WebButton({
  label,
  onPress,
  variant = "filled",
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  variant?: WebButtonVariant;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const accent = destructive ? DANGER_COLOR : APP_ACCENT_COLOR;
  const filled = variant === "filled";
  const baseVariant = filled
    ? { backgroundColor: accent }
    : { borderColor: accent, borderWidth: 1 };
  const hoverVariant = filled
    ? styles.buttonFilledHover
    : { backgroundColor: `${accent}1f` };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      role="button"
      style={(state) => [
        styles.button,
        baseVariant,
        isHovered(state) && !disabled ? hoverVariant : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[styles.buttonLabel, { color: filled ? "#ffffff" : accent }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function openHostedSignIn() {
  if (!WEB_SIGN_IN_URL || typeof window === "undefined") {
    router.replace("/");
    return;
  }
  const url = new URL(WEB_SIGN_IN_URL);
  url.searchParams.set(
    "redirect_url",
    new URL("/", window.location.origin).href
  );
  window.location.href = url.href;
}

function AuthGate() {
  const palette = usePalette();
  return (
    <Host
      style={{ backgroundColor: palette.page, flex: 1, padding: 24 }}
      useViewportSizeMeasurement
    >
      <View style={styles.centered}>
        <View
          style={[
            styles.authCard,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
              boxShadow: palette.shadow,
            },
          ]}
        >
          <Text style={[styles.title, { color: palette.text }]}>Practice</Text>
          <Text style={[styles.copy, { color: palette.secondary }]}>
            Sign in to manage habits and streaks on the web.
          </Text>
          <WebButton label="Continue with Clerk" onPress={openHostedSignIn} />
          {WEB_SIGN_IN_URL ? null : (
            <Text style={[styles.errorText, { color: DANGER_COLOR }]}>
              Set EXPO_PUBLIC_CLERK_SIGN_IN_URL to enable hosted web sign-in.
            </Text>
          )}
        </View>
      </View>
    </Host>
  );
}

function Shell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const palette = usePalette();

  // While Clerk restores the persisted session, isSignedIn is briefly false.
  // Render a neutral loading state so the sign-in screen doesn't flash.
  if (!isLoaded) {
    return (
      <Host
        style={{ backgroundColor: palette.page, flex: 1 }}
        useViewportSizeMeasurement
      >
        <View style={styles.centered}>
          <Text style={{ color: palette.secondary }}>Loading...</Text>
        </View>
      </Host>
    );
  }

  if (!isSignedIn) {
    return <AuthGate />;
  }

  return (
    <Host
      style={{ backgroundColor: palette.page, flex: 1 }}
      useViewportSizeMeasurement
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.panel,
            borderBottomColor: palette.hairline,
          },
        ]}
      >
        <Pressable
          onPress={() => router.replace("/")}
          style={styles.headerTitleButton}
        >
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {title}
          </Text>
        </Pressable>
        <UserButton />
      </View>
      {children}
    </Host>
  );
}

function HabitList({
  habits,
  selectedHabitId,
  today,
}: {
  habits: Habit[];
  selectedHabitId?: string;
  today: string;
}) {
  const palette = usePalette();
  const [query, setQuery] = useState("");
  const filteredHabits = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return habits;
    }
    return habits.filter((habit) =>
      habit.name.toLowerCase().includes(normalized)
    );
  }, [habits, query]);

  return (
    <View
      style={[
        styles.listPane,
        {
          backgroundColor: palette.sidebar,
          borderRightColor: palette.hairline,
        },
      ]}
    >
      <View style={styles.listToolbar}>
        <TextInput
          onChangeText={setQuery}
          placeholder="Search habits"
          placeholderTextColor={palette.secondary}
          style={StyleSheet.flatten([
            styles.searchField,
            { backgroundColor: palette.track },
          ])}
          textStyle={{ color: palette.text }}
        />
        <WebButton label="New" onPress={() => router.push("/habit/new")} />
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHabits.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.secondary }]}>
            {query.trim() ? "No habit matches that search." : "No habits yet."}
          </Text>
        ) : (
          filteredHabits.map((habit) => {
            const isSelected = habit.id === selectedHabitId;
            const isComplete = hasCheckInToday(habit.checkins, today);
            const dots = getRollingWeekCheckins(habit.checkins, today, 14);
            return (
              <Pressable
                key={habit.id}
                onPress={() => router.push(`/habit/${habit.id}`)}
                style={(state) => [
                  styles.habitRow,
                  {
                    backgroundColor: selectableBackground(
                      state,
                      isSelected,
                      palette
                    ),
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkDot,
                    {
                      backgroundColor: isComplete
                        ? APP_ACCENT_COLOR
                        : "transparent",
                      borderColor: isComplete
                        ? APP_ACCENT_COLOR
                        : palette.secondary,
                    },
                  ]}
                />
                <View style={styles.rowMain}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.rowTitle,
                      {
                        color: isSelected ? APP_ACCENT_COLOR : palette.text,
                        fontWeight: isSelected ? "700" : "600",
                      },
                    ]}
                  >
                    {habit.name}
                  </Text>
                  <View style={styles.miniStreak}>
                    {dots.map((day) => (
                      <View
                        key={day.date}
                        style={[
                          styles.miniDot,
                          {
                            backgroundColor: day.completed
                              ? APP_ACCENT_COLOR
                              : palette.track,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function HistoryGrid({ weeks }: { weeks: HabitHistoryWeek[] }) {
  const palette = usePalette();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.historyGrid}>
        {weeks.map((week) => (
          <View key={week.weekStart} style={styles.historyColumn}>
            {week.days.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.historyCell,
                  { backgroundColor: getHistoryCellColor(day, palette) },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function DeleteDialog({
  habitName,
  onCancel,
  onConfirm,
}: {
  habitName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const palette = usePalette();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
              boxShadow: palette.shadow,
            },
          ]}
        >
          <Text style={[styles.dialogTitle, { color: palette.text }]}>
            Delete habit?
          </Text>
          <Text style={[styles.copyLeft, { color: palette.secondary }]}>
            This removes {habitName} and all of its streak history.
          </Text>
          <View style={styles.dialogActions}>
            <WebButton label="Cancel" onPress={onCancel} variant="outlined" />
            <WebButton destructive label="Delete" onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HabitDetail({ habit }: { habit?: Habit }) {
  const { deleteHabit, today, toggleCheckInToday, syncState } = useHabits();
  const palette = usePalette();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!habit) {
    return (
      <View style={styles.detailEmpty}>
        <Text style={[styles.title, { color: palette.text }]}>
          Select a habit
        </Text>
        <Text style={[styles.copy, { color: palette.secondary }]}>
          Choose a habit from the list to see its streak history.
        </Text>
      </View>
    );
  }

  const streaks = getStreaks(habit.checkins, today);
  const history = getYearHabitHistory(habit.checkins, today);
  const isComplete = hasCheckInToday(habit.checkins, today);
  const lastCheckin = habit.checkins.length
    ? habit.checkins.slice().sort().at(-1)
    : "Never";
  const isOnline = syncState === "online";

  const handleToggle = () => {
    setError(null);
    toggleCheckInToday(habit.id).catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to update habit.");
    });
  };

  const handleDelete = () => {
    setError(null);
    deleteHabit(habit.id)
      .then(() => {
        setDeleting(false);
        router.replace("/");
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Unable to delete habit."
        );
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.detailContent}>
      <View style={styles.detailHeader}>
        <View style={styles.rowMain}>
          <Text style={[styles.detailTitle, { color: palette.text }]}>
            {habit.name}
          </Text>
          <Text style={[styles.copyLeft, { color: palette.secondary }]}>
            {getHabitCategory(habit.categoryId).label}
          </Text>
        </View>
        <WebButton
          label="Edit"
          onPress={() => router.push(`/habit/edit/${habit.id}`)}
          variant="outlined"
        />
      </View>
      {syncState === "offline" ? (
        <Text style={[styles.errorTextLeft, { color: DANGER_COLOR }]}>
          Online storage is unavailable. Reconnect to update habits.
        </Text>
      ) : null}
      {error ? (
        <Text style={[styles.errorTextLeft, { color: DANGER_COLOR }]}>
          {error}
        </Text>
      ) : null}
      <View style={styles.statsGrid}>
        <Metric label="Current" value={streaks.current} />
        <Metric label="Highest" value={streaks.best} />
        <Metric label="Check-ins" value={habit.checkins.length} />
        <Metric label="Last" value={lastCheckin ?? "Never"} />
      </View>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: palette.panel,
            borderColor: palette.border,
            boxShadow: palette.shadow,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.secondary }]}>
          HISTORY
        </Text>
        <HistoryGrid weeks={history} />
      </View>
      <View style={styles.actionRow}>
        <WebButton
          disabled={!isOnline}
          label={isComplete ? "Mark incomplete" : "Mark complete"}
          onPress={handleToggle}
        />
        <WebButton
          destructive
          disabled={!isOnline}
          label="Delete"
          onPress={() => setDeleting(true)}
          variant="outlined"
        />
      </View>
      {deleting ? (
        <DeleteDialog
          habitName={habit.name}
          onCancel={() => setDeleting(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: palette.panel,
          borderColor: palette.border,
          boxShadow: palette.shadow,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.metricValue, { color: palette.text }]}
      >
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: palette.secondary }]}>
        {label}
      </Text>
    </View>
  );
}

export function WebHabitsApp({ selectedHabitId }: WebHabitsAppProps) {
  const { habits, isLoaded, today } = useHabits();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const selectedHabit =
    habits.find((habit) => habit.id === selectedHabitId) ??
    (selectedHabitId ? undefined : habits[0]);

  if (!isLoaded) {
    return (
      <Shell title="Practice">
        <View style={styles.centered}>
          <Text>Loading habits...</Text>
        </View>
      </Shell>
    );
  }

  // Narrow screens use a native-style master/detail flow: the list at the
  // root route, the detail once a habit is selected via the URL.
  const showDetail = isWide || Boolean(selectedHabitId);
  const showList = isWide || !selectedHabitId;

  return (
    <Shell title="Practice">
      <View style={isWide ? styles.desktop : styles.mobile}>
        {showList ? (
          <HabitList
            habits={habits}
            selectedHabitId={selectedHabit?.id}
            today={today}
          />
        ) : null}
        {showDetail ? (
          <View style={styles.detailPane}>
            <HabitDetail habit={selectedHabit} />
          </View>
        ) : null}
      </View>
    </Shell>
  );
}

function getHistoryCellColor(
  day: { completed: boolean; inRange: boolean },
  palette: Palette
) {
  if (day.completed) {
    return APP_ACCENT_COLOR;
  }
  if (day.inRange) {
    return palette.track;
  }
  return "transparent";
}

export function WebHabitForm({ habitId }: WebHabitFormProps) {
  const { addHabit, habits, updateHabit } = useHabits();
  const existingHabit = habits.find((habit) => habit.id === habitId);
  const [name, setName] = useState(existingHabit?.name ?? "");
  const [categoryId, setCategoryId] = useState<HabitCategoryId>(
    resolveHabitCategoryId(existingHabit?.categoryId)
  );
  const [error, setError] = useState<string | null>(null);
  const palette = usePalette();
  const isEditing = Boolean(habitId);

  const save = async () => {
    setError(null);
    try {
      if (isEditing) {
        if (!existingHabit) {
          throw new Error("Habit not found.");
        }
        await updateHabit(existingHabit.id, { name, categoryId });
        router.replace(`/habit/${existingHabit.id}`);
        return;
      }
      await addHabit({ name, categoryId });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save habit.");
    }
  };

  return (
    <Shell title={isEditing ? "Edit Habit" : "New Habit"}>
      <ScrollView contentContainerStyle={styles.formPage}>
        <View
          style={[
            styles.formPanel,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
              boxShadow: palette.shadow,
            },
          ]}
        >
          <Text style={[styles.detailTitle, { color: palette.text }]}>
            {isEditing ? "Edit habit" : "Create habit"}
          </Text>
          {error ? (
            <Text style={[styles.errorTextLeft, { color: DANGER_COLOR }]}>
              {error}
            </Text>
          ) : null}
          <TextInput
            autoFocus
            defaultValue={name}
            maxLength={MAX_HABIT_NAME_LENGTH}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={palette.secondary}
            style={StyleSheet.flatten([
              styles.textField,
              {
                backgroundColor: palette.fieldBg,
                borderColor: palette.hairline,
              },
            ])}
            textStyle={{ color: palette.text }}
          />
          <View style={styles.categoryGrid}>
            {HABIT_CATEGORIES.map((category) => {
              const isSelected = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={(state) => [
                    styles.categoryButton,
                    {
                      backgroundColor: selectableBackground(
                        state,
                        isSelected,
                        palette
                      ),
                      borderColor: isSelected
                        ? APP_ACCENT_COLOR
                        : palette.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? APP_ACCENT_COLOR : palette.text,
                      fontSize: 14,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.actionRow}>
            <WebButton
              label="Cancel"
              onPress={() => router.back()}
              variant="outlined"
            />
            <WebButton label={isEditing ? "Save" : "Create"} onPress={save} />
          </View>
        </View>
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  authCard: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    gap: 18,
    maxWidth: 420,
    padding: 36,
    width: "100%",
  },
  button: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    userSelect: "none",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonFilledHover: { opacity: 0.88 },
  buttonLabel: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  categoryButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  checkDot: { borderRadius: 10, borderWidth: 2, height: 20, width: 20 },
  copy: { fontSize: 15, lineHeight: 22, maxWidth: 460, textAlign: "center" },
  copyLeft: { fontSize: 15, lineHeight: 22 },
  desktop: { flex: 1, flexDirection: "row" },
  detailContent: {
    gap: 22,
    marginHorizontal: "auto",
    maxWidth: 820,
    padding: 28,
    width: "100%",
  },
  detailEmpty: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    padding: 24,
  },
  detailHeader: { alignItems: "center", flexDirection: "row", gap: 16 },
  detailPane: { flex: 1 },
  detailTitle: { fontSize: 26, fontWeight: "700", letterSpacing: -0.4 },
  dialog: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxWidth: 420,
    padding: 24,
    width: "90%",
  },
  dialogActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  dialogTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { padding: 24, textAlign: "center" },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  errorTextLeft: { fontSize: 14, lineHeight: 20 },
  formPage: { alignItems: "center", padding: 28 },
  formPanel: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 20,
    maxWidth: 680,
    padding: 28,
    width: "100%",
  },
  habitRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", letterSpacing: -0.3 },
  headerTitleButton: { paddingVertical: 4 },
  historyCell: { borderRadius: 3, height: 12, width: 12 },
  historyColumn: { gap: 4 },
  historyGrid: { flexDirection: "row", gap: 4, paddingVertical: 4 },
  listContent: { gap: 4, paddingBottom: 16, paddingHorizontal: 10 },
  listPane: {
    borderRightWidth: StyleSheet.hairlineWidth,
    flexBasis: 340,
    maxWidth: 400,
  },
  listToolbar: { flexDirection: "row", gap: 10, padding: 14 },
  metric: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 140,
    padding: 16,
  },
  metricLabel: { fontSize: 13 },
  metricValue: { fontSize: 24, fontWeight: "700", letterSpacing: -0.4 },
  miniDot: { borderRadius: 3, height: 6, width: 6 },
  miniStreak: { flexDirection: "row", gap: 3 },
  mobile: { flex: 1 },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  panel: { borderRadius: 14, borderWidth: 1, gap: 14, padding: 18 },
  rowMain: { flex: 1, gap: 6, minWidth: 0 },
  rowTitle: { fontSize: 15 },
  searchField: {
    borderRadius: 9,
    flex: 1,
    height: 38,
    paddingHorizontal: 12,
  },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  textField: {
    borderRadius: 10,
    borderWidth: 1,
    height: 46,
    paddingHorizontal: 14,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
});
