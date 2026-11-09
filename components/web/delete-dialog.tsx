import { Column, Host, Row, Spacer, Text } from "@expo/ui";
import { Modal, StyleSheet, View } from "react-native";
import { FONT_SUBHEAD, usePalette } from "./palette";
import { AppButton } from "./pointer";

// RN views draw the chrome (backdrop, card box); the card content is
// universal. Web Host no longer applies box styles like padding itself.
export function DeleteDialog({
  message,
  onCancel,
  onConfirm,
  title,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  const palette = usePalette();
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.panel,
              borderColor: palette.border,
              boxShadow: palette.shadow,
            },
          ]}
        >
          <Host matchContents>
            <Column spacing={14}>
              <Text
                textStyle={{
                  color: palette.text,
                  fontSize: 20,
                  fontWeight: "700",
                }}
              >
                {title}
              </Text>
              <Text
                textStyle={{
                  color: palette.secondary,
                  fontSize: FONT_SUBHEAD,
                  lineHeight: 22,
                }}
              >
                {message}
              </Text>
              <Row spacing={12}>
                <Spacer flexible />
                <AppButton
                  label="Cancel"
                  onPress={onCancel}
                  variant="outlined"
                />
                <AppButton destructive label="Delete" onPress={onConfirm} />
              </Row>
            </Column>
          </Host>
        </View>
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
