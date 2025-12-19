import React, { useState } from "react";
import { Stack, router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  PlatformColor,
  Text,
  View,
} from "react-native";
import { useHabits } from "../../components/habits-store";

export default function AddHabitScreen() {
  const { addHabit } = useHabits();
  const [name, setName] = useState("");

  const isValid = name.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) {
      return;
    }
    await addHabit(name);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Add Habit" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Habit</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Habit name"
            placeholderTextColor={PlatformColor("tertiaryLabel")}
            style={styles.input}
            autoFocus
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={styles.subtle}>Starts today.</Text>
        </View>
        <View style={styles.section}>
          <Pressable
            onPress={handleSave}
            style={[styles.button, !isValid ? styles.buttonDisabled : null]}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Save habit</Text>
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
    marginTop: 8,
    color: PlatformColor("secondaryLabel"),
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
});
