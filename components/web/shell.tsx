import { Text } from "@expo/ui";
import { router } from "expo-router";
import { type ReactNode, useCallback, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { deleteAccount, signOut, useSession } from "../../lib/session";
import { DeleteDialog } from "./delete-dialog";
import { DANGER_COLOR, usePalette } from "./palette";
import { AppButton, HoverPressable } from "./pointer";

const WIDE_BREAKPOINT = 900;

const goHome = () => router.replace("/");

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}

function AccountControls() {
  const session = useSession();
  const palette = usePalette();
  const isWide = useIsWide();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = useCallback(() => {
    signOut().catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Couldn't sign out.");
    });
  }, []);

  const handleDelete = useCallback(() => {
    deleteAccount().catch((reason: unknown) => {
      setConfirmingDelete(false);
      setError(
        reason instanceof Error
          ? reason.message
          : "Couldn't delete your account."
      );
    });
  }, []);

  const openDeleteDialog = useCallback(() => setConfirmingDelete(true), []);
  const closeDeleteDialog = useCallback(() => setConfirmingDelete(false), []);

  if (session.status !== "signedIn") {
    return null;
  }

  return (
    <View style={styles.account}>
      {error ? (
        <Text textStyle={{ color: DANGER_COLOR, fontSize: 13 }}>{error}</Text>
      ) : null}
      {isWide ? (
        <Text textStyle={{ color: palette.secondary, fontSize: 14 }}>
          {session.user.email}
        </Text>
      ) : null}
      <AppButton label="Sign out" onPress={handleSignOut} variant="outlined" />
      <AppButton
        destructive
        label="Delete account"
        onPress={openDeleteDialog}
        variant="outlined"
      />
      {confirmingDelete ? (
        <DeleteDialog
          message="This permanently deletes your account, habits and check-ins. It can't be undone."
          onCancel={closeDeleteDialog}
          onConfirm={handleDelete}
          title="Delete your account?"
        />
      ) : null}
    </View>
  );
}

export function Shell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const palette = usePalette();

  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: palette.panel,
            borderBottomColor: palette.hairline,
          },
        ]}
      >
        <HoverPressable onPress={goHome} style={styles.titleButton}>
          <Text
            textStyle={{ color: palette.text, fontSize: 19, fontWeight: "700" }}
          >
            {title}
          </Text>
        </HoverPressable>
        <AccountControls />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  account: { alignItems: "center", flexDirection: "row", gap: 10 },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  root: { flex: 1 },
  titleButton: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
});
