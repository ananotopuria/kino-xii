import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import Modal from "../../components/common/Modal";
import { useAuth } from "./useAuth";
import { loginSchema, type LoginFormData } from "./schemas/loginSchema";
import { useAuthFormFeedback } from "./useAuthFormFeedback";

type LoginModalProps = {
  onClose: () => void;
  onSignUp: () => void;
  onSuccess?: () => void;
};

const LoginModal = ({ onClose, onSignUp, onSuccess }: LoginModalProps) => {
  const { signIn } = useAuth();
  const { serverErrors, apiError, clearFieldError, showError, submit } = useAuthFormFeedback("login");

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors, isSubmitting, touchedFields },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
  });

  const errors = {
    ...clientErrors,
    ...Object.fromEntries(Object.entries(serverErrors).map(([field, message]) => [field, { message }])),
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data);
      (onSuccess ?? onClose)();
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div
        className="
          relative w-100.75 rounded-[28px]
          border border-[#2A2C3D]
          bg-[#070C1C] p-8
          text-white
          shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)]
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold leading-none">Log in</h2>

            <p className="mt-2 text-xs leading-[1.3] text-[#A9A9A9]">
              Welcome back to Kino XII
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close login modal"
            className="cursor-pointer text-2xl leading-none text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit(handleSubmit(onSubmit))} className="mt-6" noValidate>
          <div className="space-y-6">
            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className={`mb-2.5 block text-xs font-semibold ${
                  errors.email ? "text-[#EC3013]" : "text-white"
                }`}
              >
                Email
              </label>

              <div className="relative">
                <input
                  id="email"
                  type="email"
                  {...register("email", { onChange: () => clearFieldError("email") })}
                  placeholder="example@gmail.com"
                  className={`
                    h-10 w-full rounded-xl border
                    bg-[#1E2031] px-4 pr-11
                    text-xs font-semibold
                    outline-none
                    placeholder:text-[#A9A9A9]
                    ${
                      errors.email
                        ? "border-[#EC3013] text-[#EC3013]"
                        : "border-transparent text-white"
                    }
                  `}
                />

                {touchedFields.email && !errors.email && (
                  <span
                    className="
                      absolute right-4 top-1/2
                      -translate-y-1/2
                      text-base font-semibold text-[#22C55E]
                    "
                  >
                    ✓
                  </span>
                )}

                {errors.email && (
                  <span
                    className="
                      absolute right-4 top-1/2
                      flex h-4 w-4 -translate-y-1/2
                      items-center justify-center
                      rounded-full border border-[#EC3013]
                      text-[10px] font-bold text-[#EC3013]
                    "
                  >
                    !
                  </span>
                )}
              </div>

              <p className="mt-2 min-h-4 text-xs font-semibold text-[#EC3013]">
                {errors.email?.message ?? ""}
              </p>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className={`mb-2.5 block text-xs font-semibold ${
                  errors.password ? "text-[#EC3013]" : "text-white"
                }`}
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type="password"
                  {...register("password", { onChange: () => clearFieldError("password") })}
                  placeholder="••••••••"
                  className={`
                    h-10 w-full rounded-xl border
                    bg-[#1E2031] px-4 pr-11
                    text-xs font-semibold
                    outline-none
                    placeholder:text-[#A9A9A9]
                    ${
                      errors.password
                        ? "border-[#EC3013] text-[#EC3013]"
                        : "border-transparent text-white"
                    }
                  `}
                />

                {touchedFields.password && !errors.password && (
                  <span
                    className="
                      absolute right-4 top-1/2
                      -translate-y-1/2
                      text-base font-semibold text-[#22C55E]
                    "
                  >
                    ✓
                  </span>
                )}

                {errors.password && (
                  <span
                    className="
                      absolute right-4 top-1/2
                      flex h-4 w-4 -translate-y-1/2
                      items-center justify-center
                      rounded-full border border-[#EC3013]
                      text-[10px] font-bold text-[#EC3013]
                    "
                  >
                    !
                  </span>
                )}
              </div>

              <p className="mt-2 min-h-4 text-xs font-semibold text-[#EC3013]">
                {errors.password?.message ?? ""}
              </p>
            </div>
          </div>

          {apiError && (
            <p className="mt-2 text-xs font-semibold text-[#EC3013]">
              {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="
              mt-6 flex w-full cursor-pointer
              items-center justify-center
              rounded-full bg-[#EC3013]
              px-5.5 py-3.25
              text-sm font-extrabold text-white
              transition
              hover:bg-[#d92b11]
              disabled:cursor-not-allowed
              disabled:bg-[#505261]
              disabled:text-[#A9A9A9]
            "
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.25 text-sm">
            <span className="text-[#A9A9A9]">Don't have an account?</span>

            <button
              type="button"
              onClick={onSignUp}
              className="cursor-pointer font-extrabold text-[#EC3013]"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LoginModal;
