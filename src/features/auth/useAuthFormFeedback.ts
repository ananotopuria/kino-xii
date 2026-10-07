import { useRef, useState, type BaseSyntheticEvent } from "react";
import { getAuthErrors, type AuthField, type AuthFieldErrors } from "./authErrors";

export function useAuthFormFeedback(form: "login" | "register") {
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [apiError, setApiError] = useState("");
  const locked = useRef(false);

  const clearFieldError = (field: AuthField) => {
    setServerErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setApiError("");
  };
  const showError = (error: unknown) => {
    const result = getAuthErrors(error, form);
    setServerErrors(result.fieldErrors);
    setApiError(result.general);
  };
  // Lock before RHF's asynchronous resolver, including repeated Enter submissions.
  const submit = (validateAndSubmit: (event?: BaseSyntheticEvent) => Promise<void>) =>
    async (event: BaseSyntheticEvent) => {
      event.preventDefault();
      if (locked.current) return;
      locked.current = true;
      setServerErrors({});
      setApiError("");
      try {
        await validateAndSubmit(event);
      } finally {
        locked.current = false;
      }
    };

  return { serverErrors, apiError, clearFieldError, showError, submit };
}
