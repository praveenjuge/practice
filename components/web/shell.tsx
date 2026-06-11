import { UserButton } from "@clerk/expo/web";
import { Text } from "@expo/ui";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { usePalette } from "./palette";
import { HoverPressable } from "./pointer";

export const WIDE_BREAKPOINT = 900;

export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
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
        <HoverPressable
          onPress={() => router.replace("/")}
          style={styles.titleButton}
        >
          <Text
            textStyle={{ color: palette.text, fontSize: 19, fontWeight: "700" }}
          >
            {title}
          </Text>
        </HoverPressable>
        <UserButton />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
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
