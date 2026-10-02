import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import Modal from "../../components/common/Modal";
import { useAuth } from "./useAuth";
import { loginSchema, type LoginFormData } from "./schemas/loginSchema";

type LoginModalProps = {
  onClose: () => void;
  onSignUp: () => void;
};

const LoginModal = ({ onClose, onSignUp }: LoginModalProps) => {
  const { signIn } = useAuth();

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");

    try {
      await signIn(data);
      onClose();
    } catch {
      setApiError("Invalid email or password");
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="relative w-120 rounded-2xl bg-white p-8 text-black">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl"
          aria-label="Close login modal"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold">Log In</h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-black"
            >
              Email
            </label>

            <div className="relative">
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="example@gmail.com"
                className={`w-full rounded-xl border bg-[#1D2133] px-4 py-3 pr-10 text-sm text-white outline-none transition ${
                  errors.email
                    ? "border-red-500"
                    : touchedFields.email
                      ? "border-green-500"
                      : "border-transparent"
                }`}
              />

              {touchedFields.email && !errors.email && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  ✓
                </span>
              )}

              {errors.email && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                  !
                </span>
              )}
            </div>

            <p className="mt-2 min-h-4 text-xs text-red-500">
              {errors.email?.message ?? ""}
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className={`mb-2 block text-sm font-medium ${
                errors.password ? "text-red-500" : "text-black"
              }`}
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                className={`w-full rounded-xl border bg-[#1D2133] px-4 py-3 pr-10 text-sm text-white outline-none transition ${
                  errors.password
                    ? "border-red-500"
                    : touchedFields.password
                      ? "border-green-500"
                      : "border-transparent"
                }`}
              />
              {touchedFields.password && !errors.password && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  ✓
                </span>
              )}
              {errors.password && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                  !
                </span>
              )}
            </div>
            <p className="mt-2 min-h-4 text-xs text-red-500">
              {errors.password?.message ?? ""}
            </p>
          </div>
          <p className="min-h-5 text-sm text-red-500">{apiError}</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-red-500 px-4 py-3 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
          <p className="text-center text-sm">
            Don't have an account?{" "}
            <button type="button" onClick={onSignUp} className="font-semibold">
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </Modal>
  );
};

export default LoginModal;
