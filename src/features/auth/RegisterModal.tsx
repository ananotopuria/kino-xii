import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Upload } from "lucide-react";

import Modal from "../../components/common/Modal";
import { useAuth } from "./useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "./schemas/registerSchema";

type RegisterModalProps = {
  onClose: () => void;
  onLogIn: () => void;
  onSuccess?: () => void;
};

const RegisterModal = ({ onClose, onLogIn, onSuccess }: RegisterModalProps) => {
  const { signUp } = useAuth();

  const [apiError, setApiError] = useState("");
  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, touchedFields, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
  });

  const [username, email, password, confirmPassword] = useWatch({
    control,
    name: ["username", "email", "password", "confirmPassword"],
  });

  const isFormFilled =
    Boolean(username) &&
    Boolean(email) &&
    Boolean(password) &&
    Boolean(confirmPassword);

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Avatar must be JPG, PNG or WEBP");
      event.target.value = "";
      return;
    }

    setAvatarError("");
    setAvatar(file);

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RegisterFormData) => {
    setApiError("");

    try {
      await signUp({
        username: data.username,
        email: data.email,
        password: data.password,
        passwordConfirmation: data.confirmPassword,
        avatar,
      });

      (onSuccess ?? onClose)();
    } catch {
      setApiError("Registration failed. Please try again.");
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
          relative w-119
          rounded-[28px]
          border border-[#2A2C3D]
          bg-[#070C1C]
          p-8 text-white
        "
      >
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold leading-none">Sign up</h2>

            <p className="mt-2 text-xs text-[#A9A9A9]">Welcome to Kino XII</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration modal"
            className="cursor-pointer text-2xl leading-none text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
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
                  JPG, PNG or WEBP
                </p>
              </div>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <p className="mt-1 min-h-4 text-xs text-[#EC3013]">{avatarError}</p>
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
                {...register("username")}
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
                {...register("email")}
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
          <div className="mt-2 grid grid-cols-2 gap-3">
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
                  {...register("password")}
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
                  {...register("confirmPassword")}
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
            disabled={
              isSubmitting || !isFormFilled || !isValid || Boolean(avatarError)
            }
            className="
              mt-4 w-full rounded-full
              bg-[#EC3013]
              px-5.5 py-3.25
              text-sm font-extrabold text-white
              transition
              hover:bg-[#d92b11]
              disabled:cursor-not-allowed
              disabled:bg-[#505261]
              disabled:text-[#A9A9A9]
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
