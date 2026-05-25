import { useAuth } from "@clerk/expo";
import { UserButton } from "@clerk/expo/web";
import { Button, Host, TextInput } from "@expo/ui";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
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

const textColor = (isDark: boolean) => (isDark ? "#f5f5f7" : "#111827");
const secondaryColor = (isDark: boolean) => (isDark ? "#a1a1aa" : "#6b7280");
const borderColor = (isDark: boolean) => (isDark ? "#27272a" : "#e5e7eb");
const panelColor = (isDark: boolean) => (isDark ? "#111113" : "#ffffff");
const pageColor = (isDark: boolean) => (isDark ? "#050506" : "#f5f5f7");

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
  const isDark = useColorScheme() === "dark";
  return (
    <Host
      style={{
        backgroundColor: pageColor(isDark),
        flex: 1,
        padding: 24,
      }}
      useViewportSizeMeasurement
    >
      <View style={styles.centered}>
        <Text style={[styles.title, { color: textColor(isDark) }]}>
          Practice
        </Text>
        <Text style={[styles.copy, { color: secondaryColor(isDark) }]}>
          Sign in to manage habits and streaks on the web.
        </Text>
        <Button label="Continue with Clerk" onPress={openHostedSignIn} />
        {WEB_SIGN_IN_URL ? null : (
          <Text style={[styles.errorText, { color: "#b91c1c" }]}>
            Set EXPO_PUBLIC_CLERK_SIGN_IN_URL to enable hosted web sign-in.
          </Text>
        )}
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
  const { isSignedIn } = useAuth();
  const isDark = useColorScheme() === "dark";

  if (!isSignedIn) {
    return <AuthGate />;
  }

  return (
    <Host
      style={{
        backgroundColor: pageColor(isDark),
        flex: 1,
      }}
      useViewportSizeMeasurement
    >
      <View style={[styles.header, { borderBottomColor: borderColor(isDark) }]}>
        <Pressable onPress={() => router.replace("/")}>
          <Text style={[styles.headerTitle, { color: textColor(isDark) }]}>
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
  const isDark = useColorScheme() === "dark";
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
    <View style={[styles.listPane, { borderRightColor: borderColor(isDark) }]}>
      <View style={styles.listToolbar}>
        <TextInput
          onChangeText={setQuery}
          placeholder="Search habits"
          style={styles.input}
          value={undefined}
        />
        <Button label="New" onPress={() => router.push("/habit/new")} />
      </View>
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredHabits.length === 0 ? (
          <Text style={[styles.emptyText, { color: secondaryColor(isDark) }]}>
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
                style={[
                  styles.habitRow,
                  {
                    backgroundColor: isSelected
                      ? `${APP_ACCENT_COLOR}18`
                      : panelColor(isDark),
                    borderColor: isSelected
                      ? APP_ACCENT_COLOR
                      : borderColor(isDark),
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
                        : secondaryColor(isDark),
                    },
                  ]}
                />
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: textColor(isDark) }]}>
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
                              : borderColor(isDark),
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
  const isDark = useColorScheme() === "dark";
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={styles.historyGrid}>
        {weeks.map((week) => (
          <View key={week.weekStart} style={styles.historyColumn}>
            {week.days.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.historyCell,
                  {
                    backgroundColor: getHistoryCellColor(day, isDark),
                  },
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
  const isDark = useColorScheme() === "dark";
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: panelColor(isDark),
              borderColor: borderColor(isDark),
            },
          ]}
        >
          <Text style={[styles.dialogTitle, { color: textColor(isDark) }]}>
            Delete habit?
          </Text>
          <Text style={[styles.copy, { color: secondaryColor(isDark) }]}>
            This removes {habitName} and all of its streak history.
          </Text>
          <View style={styles.dialogActions}>
            <Button label="Cancel" onPress={onCancel} variant="outlined" />
            <Button label="Delete" onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function HabitDetail({ habit }: { habit?: Habit }) {
  const { deleteHabit, today, toggleCheckInToday, syncState } = useHabits();
  const isDark = useColorScheme() === "dark";
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!habit) {
    return (
      <View style={styles.detailEmpty}>
        <Text style={[styles.title, { color: textColor(isDark) }]}>
          Select a habit
        </Text>
        <Text style={[styles.copy, { color: secondaryColor(isDark) }]}>
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
          <Text style={[styles.title, { color: textColor(isDark) }]}>
            {habit.name}
          </Text>
          <Text style={[styles.copy, { color: secondaryColor(isDark) }]}>
            {getHabitCategory(habit.categoryId).label}
          </Text>
        </View>
        <Button
          label="Edit"
          onPress={() => router.push(`/habit/edit/${habit.id}`)}
        />
      </View>
      {syncState === "offline" ? (
        <Text style={[styles.errorText, { color: "#b91c1c" }]}>
          Online storage is unavailable. Reconnect to update habits.
        </Text>
      ) : null}
      {error ? (
        <Text style={[styles.errorText, { color: "#b91c1c" }]}>{error}</Text>
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
            backgroundColor: panelColor(isDark),
            borderColor: borderColor(isDark),
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: textColor(isDark) }]}>
          History
        </Text>
        <HistoryGrid weeks={history} />
      </View>
      <View style={styles.actionRow}>
        <Button
          disabled={!isOnline}
          label={isComplete ? "Mark incomplete" : "Mark complete"}
          onPress={handleToggle}
        />
        <Button
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
  const isDark = useColorScheme() === "dark";
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: panelColor(isDark),
          borderColor: borderColor(isDark),
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: textColor(isDark) }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: secondaryColor(isDark) }]}>
        {label}
      </Text>
    </View>
  );
}

export function WebHabitsApp({ selectedHabitId }: WebHabitsAppProps) {
  const { habits, isLoaded, today } = useHabits();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const selectedHabit =
    habits.find((habit) => habit.id === selectedHabitId) ??
    (selectedHabitId ? undefined : habits[0]);

  return (
    <Shell title="Practice">
      {isLoaded ? (
        <View style={isWide ? styles.desktop : styles.mobile}>
          <HabitList
            habits={habits}
            selectedHabitId={selectedHabit?.id}
            today={today}
          />
          <View style={styles.detailPane}>
            <HabitDetail habit={selectedHabit} />
          </View>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text>Loading habits...</Text>
        </View>
      )}
    </Shell>
  );
}

function getHistoryCellColor(
  day: { completed: boolean; inRange: boolean },
  isDark: boolean
) {
  if (day.completed) {
    return APP_ACCENT_COLOR;
  }
  if (day.inRange) {
    return borderColor(isDark);
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
  const isDark = useColorScheme() === "dark";
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
              backgroundColor: panelColor(isDark),
              borderColor: borderColor(isDark),
            },
          ]}
        >
          <Text style={[styles.title, { color: textColor(isDark) }]}>
            {isEditing ? "Edit habit" : "Create habit"}
          </Text>
          {error ? (
            <Text style={[styles.errorText, { color: "#b91c1c" }]}>
              {error}
            </Text>
          ) : null}
          <TextInput
            autoFocus
            defaultValue={name}
            maxLength={MAX_HABIT_NAME_LENGTH}
            onChangeText={setName}
            placeholder="Habit name"
            style={styles.textField}
          />
          <View style={styles.categoryGrid}>
            {HABIT_CATEGORIES.map((category) => {
              const isSelected = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: isSelected
                        ? `${APP_ACCENT_COLOR}18`
                        : "transparent",
                      borderColor: isSelected
                        ? APP_ACCENT_COLOR
                        : borderColor(isDark),
                    },
                  ]}
                >
                  <Text style={{ color: textColor(isDark) }}>
                    {category.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.actionRow}>
            <Button
              label="Cancel"
              onPress={() => router.back()}
              variant="outlined"
            />
            <Button label={isEditing ? "Save" : "Create"} onPress={save} />
          </View>
        </View>
      </ScrollView>
    </Shell>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
  },
  checkDot: { borderRadius: 9, borderWidth: 2, height: 18, width: 18 },
  copy: { fontSize: 15, lineHeight: 21, maxWidth: 460, textAlign: "center" },
  desktop: { flex: 1, flexDirection: "row" },
  detailContent: { gap: 20, padding: 24 },
  detailEmpty: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  detailHeader: { alignItems: "center", flexDirection: "row", gap: 16 },
  detailPane: { flex: 1 },
  dialog: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    maxWidth: 420,
    padding: 20,
    width: "90%",
  },
  dialogActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  dialogTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { padding: 16, textAlign: "center" },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  formPage: { alignItems: "center", padding: 24 },
  formPanel: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 18,
    maxWidth: 680,
    padding: 20,
    width: "100%",
  },
  habitRow: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  historyCell: { borderRadius: 3, height: 11, width: 11 },
  historyColumn: { gap: 3 },
  historyGrid: { flexDirection: "row", gap: 3, paddingVertical: 6 },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 12,
    width: "100%",
  },
  listContent: { gap: 10, padding: 16 },
  listPane: { borderRightWidth: 1, flexBasis: 360, maxWidth: 420 },
  listToolbar: { gap: 10, padding: 16 },
  metric: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minWidth: 140,
    padding: 16,
  },
  metricLabel: { fontSize: 13 },
  metricValue: { fontSize: 22, fontWeight: "700" },
  miniDot: { borderRadius: 3, height: 6, width: 6 },
  miniStreak: { flexDirection: "row", gap: 3 },
  mobile: { flex: 1 },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    flex: 1,
    justifyContent: "center",
  },
  panel: { borderRadius: 12, borderWidth: 1, gap: 12, padding: 16 },
  rowMain: { flex: 1, gap: 6, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  textField: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    paddingHorizontal: 12,
    width: "100%",
  },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
});
