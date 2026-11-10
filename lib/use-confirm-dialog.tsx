import { useCallback, useState } from "react";
import {
  ConfirmDialog,
  type ConfirmRequest,
} from "../components/confirm-dialog";

/** A native confirm dialog: render `dialog` once, call `confirm` to ask. */
export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = useCallback(() => setRequest(null), []);
  return {
    confirm: setRequest,
    dialog: <ConfirmDialog onClose={close} request={request} />,
  };
}
