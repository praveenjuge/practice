import React from "react";
import { Stack, router } from "expo-router";
import {
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  PlatformColor,
  Platform,
  Text,
} from "react-native";
import {
  useHabits,
  getStreaks,
  getTodayString,
  hasCheckInToday,
} from "../../components/habits-store";

export default function HomeScreen() {
  const { habits, isLoaded, isCloudAvailable, error, checkInToday } =
    useHabits();
  const today = getTodayString();

  const handleAdd = () => router.push("/add");

  return (
    <>
      <Stack.Screen
        options={{
          title: "Practice",
          headerRight: () => (
            <Pressable onPress={handleAdd} style={styles.headerButton}>
              <Text style={styles.headerAction}>Add</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {!isCloudAvailable ? (
          <View style={styles.syncNotice}>
            <Text style={styles.sectionTitle}>Sync</Text>
            <Text style={styles.subtle}>
              iCloud is unavailable on this device.
            </Text>
            {error ? <Text style={styles.subtle}>{error}</Text> : null}
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {!isLoaded ? (
            <Text style={styles.subtle}>Loading your habits...</Text>
          ) : habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.subtle}>No habits yet.</Text>
              <Pressable onPress={handleAdd} style={styles.inlineButton}>
                <Text style={styles.inlineButtonText}>Start a habit</Text>
              </Pressable>
            </View>
          ) : (
            habits.map((habit) => {
              const streaks = getStreaks(habit.checkins, today);
              const checkedToday = hasCheckInToday(habit.checkins, today);
              return (
                <Pressable
                  key={habit.id}
                  onPress={() => router.push(`/habit/${habit.id}`)}
                  style={styles.row}
                >
                  <View style={styles.rowContent}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{habit.name}</Text>
                      <Text style={styles.metaText}>
                        Current {streaks.current} · Best {streaks.best}
                      </Text>
                    </View>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        void checkInToday(habit.id);
                      }}
                      style={styles.checkButton}
                      accessibilityLabel={
                        checkedToday ? "Checked in today" : "Check in today"
                      }
                    >
                      <Text
                        style={[
                          styles.checkIcon,
                          checkedToday ? styles.checkIconActive : null,
                        ]}
                      >
                        {checkedToday ? "✓" : "○"}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
    backgroundColor: PlatformColor("systemBackground"),
  },
  headerButton: {
    padding: 6,
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "500",
    color: PlatformColor("label"),
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: PlatformColor("secondaryLabel"),
    marginBottom: 10,
  },
  subtle: {
    fontSize: 14,
    color: PlatformColor("secondaryLabel"),
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor("separator"),
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    color: PlatformColor("label"),
  },
  metaText: {
    fontSize: 12,
    marginTop: 2,
    color: PlatformColor("secondaryLabel"),
  },
  emptyState: {
    paddingVertical: 8,
  },
  syncNotice: {
    marginTop: 8,
    marginBottom: 8,
  },
  inlineButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: PlatformColor("tertiarySystemFill"),
  },
  inlineButtonText: {
    color: PlatformColor("label"),
  },
  checkButton: {
    padding: 6,
  },
  checkIcon: {
    fontSize: 18,
    color: PlatformColor("tertiaryLabel"),
  },
  checkIconActive: {
    color: PlatformColor("systemGreen"),
  },
});
