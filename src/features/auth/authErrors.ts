import { isAxiosError } from "axios";

export type AuthField = "username" | "email" | "password" | "confirmPassword" | "avatar";
export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const fields: Record<string, AuthField> = {
  username: "username", email: "email", password: "password",
  password_confirmation: "confirmPassword", avatar: "avatar",
};
const messages = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );

// https://api.kinoxii.redberryinternship.ge/docs: POST /login, POST /register.
export function getAuthErrors(error: unknown, form: "login" | "register") {
  const fieldErrors: AuthFieldErrors = {};
  const fallback = "Unable to connect. Please try again.";
  if (!isAxiosError(error) || !error.response) return { fieldErrors, general: fallback };
  const { status, data } = error.response;
  if (status >= 500) return { fieldErrors, general: "The server is temporarily unavailable. Please try again." };
  if (status < 400 || !data || typeof data !== "object") return { fieldErrors, general: fallback };

  const general: string[] = [];
  if (status === 422 && data.errors && typeof data.errors === "object") {
    for (const [key, value] of Object.entries(data.errors)) {
      const text = messages(value).join(" ");
      if (!text) continue;
      const field = Object.hasOwn(fields, key) ? fields[key] : undefined;
      if (field && (form === "register" || field === "email" || field === "password")) {
        fieldErrors[field] = text;
      } else {
        general.push(text);
      }
    }
  }
  general.unshift(...messages(data.message));
  return { fieldErrors, general: [...new Set(general)].join(" ") || (Object.keys(fieldErrors).length ? "" : fallback) };
}
