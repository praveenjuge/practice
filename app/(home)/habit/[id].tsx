import React, { useEffect, useMemo, useState } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  PlatformColor,
  Text,
  View,
} from "react-native";
import {
  getStreaks,
  getTodayString,
  useHabits,
} from "../../../components/habits-store";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { habits, renameHabit, deleteHabit } = useHabits();
  const habitId = Array.isArray(id) ? id[0] : id;
  const habit = useMemo(
    () => habits.find((item) => item.id === habitId),
    [habits, habitId]
  );
  const [name, setName] = useState(habit?.name ?? "");

  useEffect(() => {
    if (habit) {
      setName(habit.name);
    }
  }, [habit]);

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Habit" }} />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not found</Text>
            <Text style={styles.subtle}>This habit no longer exists.</Text>
            <Pressable onPress={() => router.back()} style={styles.button}>
              <Text style={styles.buttonText}>Go back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </>
    );
  }

  const today = getTodayString();
  const streaks = getStreaks(habit.checkins, today);
  const isDirty = name.trim() !== habit.name;
  const canSave = isDirty && name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    await renameHabit(habit.id, name);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete habit?",
      "This removes the habit and its streak history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteHabit(habit.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: habit.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current</Text>
            <Text style={styles.rowValue}>{streaks.current}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Best</Text>
            <Text style={styles.rowValue}>{streaks.best}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={PlatformColor("tertiaryLabel")}
            style={styles.input}
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.button, !canSave ? styles.buttonDisabled : null]}
          >
            <Text style={styles.buttonText}>Save name</Text>
          </Pressable>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger zone</Text>
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete habit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: PlatformColor("systemBackground"),
  },
  section: {
    marginBottom: 20,
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
    marginBottom: 12,
    color: PlatformColor("secondaryLabel"),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor("separator"),
  },
  rowLabel: {
    fontSize: 16,
    color: PlatformColor("label"),
  },
  rowValue: {
    fontSize: 16,
    color: PlatformColor("label"),
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 17,
    backgroundColor: PlatformColor("secondarySystemBackground"),
    color: PlatformColor("label"),
  },
  button: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PlatformColor("tertiarySystemFill"),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: PlatformColor("label"),
    fontWeight: "500",
  },
  deleteButton: {
    paddingVertical: 12,
  },
  deleteText: {
    color: PlatformColor("systemRed"),
  },
});
