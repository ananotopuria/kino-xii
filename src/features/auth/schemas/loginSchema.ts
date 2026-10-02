import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),

  password: yup
    .string()
    .required("Password is required")
    .min(3, "Password must be at least 3 characters"),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
