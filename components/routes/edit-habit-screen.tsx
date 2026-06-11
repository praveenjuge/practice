import { useLocalSearchParams } from "expo-router";
import { HabitFormScreen } from "../web/habit-form-screen";
import { Shell } from "../web/shell";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitId = Array.isArray(id) ? id[0] : id;
  return (
    <Shell title="Edit Habit">
      <HabitFormScreen habitId={habitId} />
    </Shell>
  );
}
