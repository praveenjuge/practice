import { Button, ConfirmationDialog, Host, Text } from "@expo/ui/swift-ui";
import { useCallback } from "react";
import type { ConfirmDialogProps } from "./confirm-dialog";

// The dialog points at this invisible anchor; bottom centre makes it rise
// from the bottom like an action sheet.
const HIDDEN_HOST = {
  alignSelf: "center",
  bottom: 24,
  height: 1,
  position: "absolute",
  width: 1,
} as const;

// SwiftUI confirmation dialog (the iOS action sheet for destructive
// choices). The Android version is confirm-dialog.tsx.
export function ConfirmDialog({ onClose, request }: ConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    onClose();
    request?.onConfirm();
  }, [onClose, request]);
  const handlePresentedChange = useCallback(
    (isPresented: boolean) => {
      if (!isPresented) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Host style={HIDDEN_HOST}>
      <ConfirmationDialog
        isPresented={request !== null}
        onIsPresentedChange={handlePresentedChange}
        title={request?.title ?? ""}
        titleVisibility="visible"
      >
        <ConfirmationDialog.Trigger>
          <Text> </Text>
        </ConfirmationDialog.Trigger>
        <ConfirmationDialog.Actions>
          <Button
            label={request?.confirmLabel ?? "OK"}
            onPress={handleConfirm}
            role={request?.destructive ? "destructive" : "default"}
          />
          {/* biome-ignore lint/a11y/useValidAriaRole: SwiftUI button role, not ARIA */}
          <Button label="Cancel" onPress={onClose} role="cancel" />
        </ConfirmationDialog.Actions>
        {request?.message ? (
          <ConfirmationDialog.Message>
            <Text>{request.message}</Text>
          </ConfirmationDialog.Message>
        ) : null}
      </ConfirmationDialog>
    </Host>
  );
}
