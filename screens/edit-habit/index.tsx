import { HabitFormScreen } from "../../components/web/habit-form-screen";
import { Shell } from "../../components/web/shell";
import { useHabitIdParam } from "../../lib/habits-store";

export default function EditHabitScreen() {
  const habitId = useHabitIdParam();
  return (
    <Shell title="Edit Habit">
      <HabitFormScreen habitId={habitId} />
    </Shell>
  );
}
