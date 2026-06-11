import { Column, Host, Row, Spacer, Text } from "@expo/ui";
import { Modal, StyleSheet, View } from "react-native";
import { FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton } from "./pointer";

// The RN Modal stays (invisible chrome: backdrop + centering only); the card
// content is universal.
export function DeleteDialog({
  habitName,
  onCancel,
  onConfirm,
}: {
  habitName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const palette = usePalette();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.backdrop}>
        <Host
          matchContents
          style={[
            styles.card,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
              boxShadow: palette.shadow,
            },
          ]}
        >
          <Column spacing={14}>
            <Text
              textStyle={{
                color: palette.text,
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              Delete habit?
            </Text>
            <Text
              textStyle={{
                color: palette.secondary,
                fontSize: FONT_SUBHEAD,
                lineHeight: 22,
              }}
            >
              {`This removes ${habitName} and all of its streak history.`}
            </Text>
            <Row spacing={12}>
              <Spacer flexible />
              <AppButton label="Cancel" onPress={onCancel} variant="outlined" />
              <AppButton destructive label="Delete" onPress={onConfirm} />
            </Row>
          </Column>
        </Host>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 24,
    width: "90%",
  },
});
