import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import Modal from "../../components/common/Modal";
import { useAuth } from "./useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "./schemas/registerSchema";

type RegisterModalProps = {
  onClose: () => void;
  onLogIn: () => void;
};

const RegisterModal = ({ onClose, onLogIn }: RegisterModalProps) => {
  const { signUp } = useAuth();

  const [apiError, setApiError] = useState("");
  const [avatar, setAvatar] = useState<File | undefined>();
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onBlur",
  });

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

      onClose();
    } catch {
      setApiError("Registration failed. Please try again.");
    }
  };

  const getInputClass = (hasError: boolean, isTouched: boolean | undefined) => {
    return `w-full rounded-xl border bg-[#1D2133] px-4 py-3 pr-10 text-sm text-white outline-none transition ${
      hasError
        ? "border-red-500"
        : isTouched
          ? "border-green-500"
          : "border-transparent"
    }`;
  };

  return (
    <Modal onClose={onClose}>
      <div className="relative w-120 rounded-[28px] border border-white/15 bg-[#020A1D] p-8 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-xl text-white/70 hover:text-white"
          aria-label="Close registration modal"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold">Sign up</h2>

        <p className="mt-1 text-sm text-white/60">
          Create your Kino XII account
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 space-y-3"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Avatar{" "}
              <span className="font-normal text-white/50">(optional)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/20 bg-[#1D2133] p-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl">
                  +
                </div>
              )}

              <div>
                <p className="text-sm font-medium">
                  {avatar ? avatar.name : "Upload avatar"}
                </p>

                <p className="mt-1 text-xs text-white/50">JPG, PNG or WEBP</p>
              </div>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <p className="mt-1 min-h-4 text-xs text-red-500">{avatarError}</p>
          </div>
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium"
            >
              Username
            </label>

            <div className="relative">
              <input
                id="username"
                type="text"
                {...register("username")}
                placeholder="Enter your username"
                className={getInputClass(
                  Boolean(errors.username),
                  touchedFields.username,
                )}
              />

              {touchedFields.username && !errors.username && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  ✓
                </span>
              )}

              {errors.username && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                  !
                </span>
              )}
            </div>

            <p className="mt-1 min-h-4 text-xs text-red-500">
              {errors.username?.message ?? ""}
            </p>
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-medium"
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

            <p className="mt-1 min-h-4 text-xs text-red-500">
              {errors.email?.message ?? ""}
            </p>
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="register-password"
                type="password"
                {...register("password")}
                placeholder="Enter your password"
                className={getInputClass(
                  Boolean(errors.password),
                  touchedFields.password,
                )}
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

            <p className="mt-1 min-h-4 text-xs text-red-500">
              {errors.password?.message ?? ""}
            </p>
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirm password
            </label>

            <div className="relative">
              <input
                id="confirm-password"
                type="password"
                {...register("confirmPassword")}
                placeholder="Repeat your password"
                className={getInputClass(
                  Boolean(errors.confirmPassword),
                  touchedFields.confirmPassword,
                )}
              />

              {touchedFields.confirmPassword && !errors.confirmPassword && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  ✓
                </span>
              )}

              {errors.confirmPassword && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                  !
                </span>
              )}
            </div>

            <p className="mt-1 min-h-4 text-xs text-red-500">
              {errors.confirmPassword?.message ?? ""}
            </p>
          </div>

          <p className="min-h-5 text-sm text-red-500">{apiError}</p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#FF3217] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>

          <p className="text-center text-sm text-white/60">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onLogIn}
              className="font-semibold text-[#FF3217]"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </Modal>
  );
};

export default RegisterModal;
