import AccountCircleIcon from "@expo/material-symbols/account_circle.xml";
import AddIcon from "@expo/material-symbols/add.xml";
import { NotificationFeedbackType, notificationAsync } from "expo-haptics";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import { deleteAccount, signOut, useSession } from "./session";

// Toolbar icons: SF Symbols on iOS, Material Symbol drawables on Android
// (Android toolbar items need an image source).
const isIOS = Platform.OS === "ios";
export const ACCOUNT_MENU_ICON = isIOS
  ? "person.crop.circle"
  : AccountCircleIcon;
export const ADD_TOOLBAR_ICON = isIOS ? "plus" : AddIcon;

const showError = (title: string, error: unknown) => {
  Alert.alert(
    title,
    error instanceof Error ? error.message : "Please try again."
  );
};

// Account actions for the native toolbar menu, with native confirmations.
export function useAccountActions() {
  const session = useSession();
  const email = session.status === "signedIn" ? session.user.email : "";

  const confirmSignOut = useCallback(() => {
    Alert.alert("Sign out?", email ? `You're signed in as ${email}.` : "", [
      { style: "cancel", text: "Cancel" },
      {
        onPress: () => {
          signOut().catch((error: unknown) => {
            showError("Couldn't sign out", error);
          });
        },
        text: "Sign Out",
      },
    ]);
  }, [email]);

  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, habits and check-ins. It can't be undone.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: () => {
            notificationAsync(NotificationFeedbackType.Warning);
            deleteAccount().catch((error: unknown) => {
              showError("Couldn't delete your account", error);
            });
          },
          style: "destructive",
          text: "Delete Account",
        },
      ]
    );
  }, []);

  return { confirmDeleteAccount, confirmSignOut, email };
}
