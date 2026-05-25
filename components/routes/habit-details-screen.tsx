import { useLocalSearchParams } from "expo-router";
import { WebHabitsApp } from "../web-habits-app";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const habitId = Array.isArray(id) ? id[0] : id;
  return <WebHabitsApp selectedHabitId={habitId} />;
}
