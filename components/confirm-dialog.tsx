import { AlertDialog, Host, Text, TextButton } from "@expo/ui/jetpack-compose";
import { useCallback } from "react";

export interface ConfirmRequest {
  confirmLabel: string;
  destructive?: boolean;
  message?: string;
  onConfirm: () => void;
  title: string;
}

export interface ConfirmDialogProps {
  onClose: () => void;
  request: ConfirmRequest | null;
}

const DANGER_COLOR = "#B3261E";
const HIDDEN_HOST = { height: 1, position: "absolute", width: 1 } as const;

// Material 3 alert dialog. iOS uses a SwiftUI confirmation dialog
// (confirm-dialog.ios.tsx).
export function ConfirmDialog({ onClose, request }: ConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    onClose();
    request?.onConfirm();
  }, [onClose, request]);

  if (!request) {
    return null;
  }

  return (
    <Host style={HIDDEN_HOST}>
      <AlertDialog onDismissRequest={onClose}>
        <AlertDialog.Title>
          <Text>{request.title}</Text>
        </AlertDialog.Title>
        {request.message ? (
          <AlertDialog.Text>
            <Text>{request.message}</Text>
          </AlertDialog.Text>
        ) : null}
        <AlertDialog.ConfirmButton>
          <TextButton onClick={handleConfirm}>
            <Text color={request.destructive ? DANGER_COLOR : undefined}>
              {request.confirmLabel}
            </Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={onClose}>
            <Text>Cancel</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
