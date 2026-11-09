import { Host, HStack, List, Spacer, Text } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { HabitForm } from "../../components/habit-form";
import { APP_ACCENT_COLOR, HOST_THEME } from "../../lib/app-colors";
import { useEditHabit, useHeaderSubmit } from "../../lib/screen-hooks";

export default function EditHabitScreen() {
  const { habit, handleSubmit } = useEditHabit();
  const {
    handleHeaderSubmit,
    handleSubmitReady,
    isHeaderDisabled,
    setIsSaving,
  } = useHeaderSubmit();

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Habit" }} />
        <Host {...HOST_THEME} style={{ flex: 1 }}>
          <List>
            <HStack>
              <Text>Not found</Text>
              <Spacer />
              <Text
                modifiers={[
                  foregroundStyle({
                    style: "secondary",
                    type: "hierarchical",
                  }),
                ]}
              >
                This habit no longer exists
              </Text>
            </HStack>
          </List>
        </Host>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitleEnabled: false,
          title: "Edit Habit",
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Save"
          disabled={isHeaderDisabled}
          icon="checkmark"
          onPress={handleHeaderSubmit}
          tintColor={APP_ACCENT_COLOR}
          variant="done"
        />
      </Stack.Toolbar>
      <HabitForm
        initialCategoryId={habit.categoryId}
        initialName={habit.name}
        onSavingChange={setIsSaving}
        onSubmit={handleSubmit}
        onSubmitReady={handleSubmitReady}
        showSubmitSection={false}
        submitErrorTitle="Unable to update habit"
        submitLabel="Save Changes"
      />
    </>
  );
}
