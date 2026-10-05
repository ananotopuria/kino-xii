import { useEffect, useEffectEvent, useState } from "react";
import { useAuth } from "./useAuth";

// The booking flow's pending action is consumed before execution. Attempt IDs
// also prevent a late response from a dismissed dialog approving a newer action.
export const createAuthReplay = <Action,>() => {
  let nextId = 0;
  let pending: { id: number; action: Action; approved: boolean } | null = null;
  return {
    request(action: Action) {
      pending = { id: ++nextId, action, approved: false };
      return pending.id;
    },
    approve(id: number) {
      if (pending?.id !== id) return false;
      pending.approved = true;
      return true;
    },
    take() {
      if (!pending?.approved) return null;
      const action = pending.action;
      pending = null;
      return action;
    },
    cancel() { pending = null; },
  };
};

export const useAuthReplay = <Action,>(run: (action: Action) => void | Promise<void>, ready = true) => {
  const { user, isLoading } = useAuth();
  const [replay] = useState(() => createAuthReplay<Action>());
  const [dialog, setDialog] = useState<{ id: number; modal: "login" | "signup" | null } | null>(null);
  const resume = useEffectEvent(async () => {
    if (!user || isLoading || !ready) return;
    const action = replay.take();
    if (action !== null) await run(action);
  });
  useEffect(() => { void resume(); }, [user, isLoading, ready, dialog]);

  return {
    authModal: dialog?.modal ?? null,
    requestLogin: (action: Action) => setDialog({ id: replay.request(action), modal: "login" }),
    setAuthModal: (modal: "login" | "signup") => setDialog((current) => current && ({ ...current, modal })),
    cancelAuth: () => { replay.cancel(); setDialog(null); },
    clearPendingAuth: replay.cancel,
    authenticated: () => {
      if (dialog && replay.approve(dialog.id)) setDialog({ ...dialog, modal: null });
    },
  };
};
