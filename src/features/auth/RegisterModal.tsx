import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Upload } from "lucide-react";

import Modal from "../../components/common/Modal";
import { useAuth } from "./useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "./schemas/registerSchema";
import { validateAvatar } from "../../utils/formValidation";
import { useAuthFormFeedback } from "./useAuthFormFeedback";

type RegisterModalProps = {
  onClose: () => void;
  onLogIn: () => void;
  onSuccess?: () => void;
};

const RegisterModal = ({ onClose, onLogIn, onSuccess }: RegisterModalProps) => {
  const { signUp } = useAuth();

  const { serverErrors, apiError, clearFieldError, showError, submit } =
    useAuthFormFeedback("register");
  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors: clientErrors, isSubmitting, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onTouched",
  });

  const errors = {
    ...clientErrors,
    ...Object.fromEntries(
      Object.entries(serverErrors).map(([field, message]) => [
        field,
        { message },
      ]),
    ),
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearFieldError("avatar");
    const validation = validateAvatar(file);
    if (validation !== true) {
      setAvatarError(validation);
      setAvatar(undefined);
      setAvatarPreview("");
      event.target.value = "";
      return;
    }

    setAvatarError("");
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (avatarError) return;

    try {
      await signUp({
        username: data.username,
        email: data.email,
        password: data.password,
        passwordConfirmation: data.confirmPassword,
        avatar,
      });

      (onSuccess ?? onClose)();
    } catch (error) {
      showError(error);
    }
  };

  const getInputClass = (hasError: boolean, isTouched: boolean | undefined) => {
    return `
      h-10 w-full rounded-xl border
      bg-[#1E2031] px-4 pr-10
      text-xs font-semibold text-white
      outline-none transition
      placeholder:text-[#A9A9A9]
      ${
        hasError
          ? "border-[#EC3013] text-[#EC3013]"
          : isTouched
            ? "border-transparent"
            : "border-transparent"
      }
    `;
  };

  const renderStatus = (hasError: boolean, isTouched: boolean | undefined) => {
    if (hasError) {
      return (
        <span
          className="
            absolute right-3 top-1/2
            flex h-4 w-4 -translate-y-1/2
            items-center justify-center
            rounded-full border border-[#EC3013]
            text-[10px] font-bold text-[#EC3013]
          "
        >
          !
        </span>
      );
    }

    if (isTouched) {
      return (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#22C55E]">
          ✓
        </span>
      );
    }

    return null;
  };

  return (
    <Modal onClose={onClose}>
      <div
        className="
          relative w-[min(476px,calc(100vw-32px))] max-h-[calc(100dvh-32px)] overflow-y-auto wrap-break-word
          rounded-[28px]
          border border-[#2A2C3D]
          bg-[#070C1C]
          p-5 text-white sm:p-8
        "
      >
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-start justify-between bg-[#070C1C]">
          <div>
            <h2 className="text-xl font-extrabold leading-none">Sign up</h2>

            <p className="mt-2 text-xs text-[#A9A9A9]">Welcome to Kino XII</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration modal"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl leading-none text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={submit(handleSubmit(onSubmit))}
          noValidate
          className="mt-6"
        >
          {/* AVATAR */}
          <div>
            <label className="flex w-fit cursor-pointer items-center gap-3">
              <div
                className="
                  flex h-10 w-10 shrink-0
                  items-center justify-center
                  overflow-hidden rounded-lg
                  bg-[#1E2031]
                "
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Upload size={16} className="text-[#A9A9A9]" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-white">
                  Upload avatar (optional)
                </p>

                <p className="mt-1 text-[10px] text-[#A9A9A9]">
                  JPG, PNG or WEBP, maximum 2 MB
                </p>
              </div>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <p className="mt-1 min-h-4 text-xs text-[#EC3013]">
              {avatarError || serverErrors.avatar}
            </p>
          </div>

          {/* USERNAME */}
          <div className="mt-3">
            <label
              htmlFor="username"
              className={`mb-2 block text-xs font-semibold ${
                errors.username ? "text-[#EC3013]" : "text-white"
              }`}
            >
              Username
            </label>

            <div className="relative">
              <input
                id="username"
                type="text"
                {...register("username", {
                  onChange: () => clearFieldError("username"),
                })}
                placeholder="User"
                className={getInputClass(
                  Boolean(errors.username),
                  touchedFields.username,
                )}
              />

              {renderStatus(Boolean(errors.username), touchedFields.username)}
            </div>

            <p className="mt-1 min-h-4 text-xs text-[#EC3013]">
              {errors.username?.message ?? ""}
            </p>
          </div>

          {/* EMAIL */}
          <div className="mt-2">
            <label
              htmlFor="register-email"
              className={`mb-2 block text-xs font-semibold ${
                errors.email ? "text-[#EC3013]" : "text-white"
              }`}
            >
              Email
            </label>

            <div className="relative">
              <input
                id="register-email"
                type="email"
                {...register("email", {
                  onChange: () => clearFieldError("email"),
                })}
                placeholder="example@gmail.com"
                className={getInputClass(
                  Boolean(errors.email),
                  touchedFields.email,
                )}
              />

              {renderStatus(Boolean(errors.email), touchedFields.email)}
            </div>

            <p className="mt-1 min-h-4 text-xs text-[#EC3013]">
              {errors.email?.message ?? ""}
            </p>
          </div>

          {/* PASSWORDS */}
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* PASSWORD */}
            <div>
              <label
                htmlFor="register-password"
                className={`mb-2 block text-xs font-semibold ${
                  errors.password ? "text-[#EC3013]" : "text-white"
                }`}
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="register-password"
                  type="password"
                  {...register("password", {
                    onChange: () => clearFieldError("password"),
                  })}
                  placeholder="••••••••"
                  className={getInputClass(
                    Boolean(errors.password),
                    touchedFields.password,
                  )}
                />

                {renderStatus(Boolean(errors.password), touchedFields.password)}
              </div>

              <p className="mt-1 min-h-4 text-xs text-[#EC3013]">
                {errors.password?.message ?? ""}
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label
                htmlFor="confirm-password"
                className={`mb-2 block text-xs font-semibold ${
                  errors.confirmPassword ? "text-[#EC3013]" : "text-white"
                }`}
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirm-password"
                  type="password"
                  {...register("confirmPassword", {
                    onChange: () => clearFieldError("confirmPassword"),
                  })}
                  placeholder="••••••••"
                  className={getInputClass(
                    Boolean(errors.confirmPassword),
                    touchedFields.confirmPassword,
                  )}
                />

                {renderStatus(
                  Boolean(errors.confirmPassword),
                  touchedFields.confirmPassword,
                )}
              </div>

              <p className="mt-1 min-h-4 text-xs text-[#EC3013]">
                {errors.confirmPassword?.message ?? ""}
              </p>
            </div>
          </div>

          {/* API ERROR */}
          <p className="mt-1 min-h-4 text-xs text-[#EC3013]">{apiError}</p>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting || Boolean(avatarError)}
            className="
              mt-4 w-full rounded-full
              bg-[#505261]
              px-5.5 py-3.25
              text-sm font-extrabold text-[#A9A9A9]
              transition
              hover:bg-[#EC3013]
               hover:text-white
              disabled:cursor-not-allowed
              disabled:bg-[#505261]
              disabled:text-[#A9A9A9]
              cursor-pointer
            "
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>

          {/* FOOTER */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-sm">
            <span className="text-[#A9A9A9]">Already have an account?</span>

            <button
              type="button"
              onClick={onLogIn}
              className="cursor-pointer font-extrabold text-[#EC3013]"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RegisterModal;
