import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ProfileFields, User } from "../../types/auth";
import { useProfile } from "../../features/profile/useProfile";
import { useFilterOptions } from "../../features/auth/filters/useFilterOptions";
import { bookingError } from "../../utils/booking";
import {
  normalizeProfileFields,
  profileFieldsFromUser,
  profileFormState,
  validateAvatar,
} from "../../utils/formValidation";

type Props = {
  user: User;
  requestLogin: (retry: () => Promise<void>) => void;
};

const control =
  "h-10 w-full rounded-xl border border-transparent bg-[#1E2031] px-4 text-sm text-white outline-none transition placeholder:text-[#A9A9A9] focus:border-white/40 disabled:opacity-60";

const ProfileForm = ({ user, requestLogin }: Props) => {
  const options = useFilterOptions();
  const save = useProfile();

  const [fields, setFields] = useState(() => profileFieldsFromUser(user));
  const [baseline, setBaseline] = useState(() => profileFieldsFromUser(user));

  const [avatar, setAvatar] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  const [avatarError, setAvatarError] = useState("");
  const [avatarExpanded, setAvatarExpanded] = useState(false);

  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>(
    {},
  );

  const [edited, setEdited] = useState<Record<string, boolean>>({});

  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);

  const upload = useRef<HTMLInputElement>(null);
  const locked = useRef(false);

  useEffect(() => {
    return () => {
      if (avatar) URL.revokeObjectURL(avatar.preview);
    };
  }, [avatar]);

  const form = profileFormState(
    { ...fields, avatar: avatar?.file },
    baseline,
    avatarError,
  );

  const errors = {
    ...Object.fromEntries(
      Object.entries(form.errors).filter(([name]) => edited[name]),
    ),
    ...serverErrors,
  };

  const clearFieldError = (name: keyof ProfileFields) => {
    setServerErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });

    setEdited((current) => ({
      ...current,
      [name]: true,
    }));

    setSaved(false);
    setNotice("");
  };

  const changeField = (
    name: Exclude<keyof ProfileFields, "avatar">,
    value: string,
  ) => {
    setFields((current) => ({
      ...current,
      [name]: value,
    }));

    clearFieldError(name);
  };

  const submit = async (request: ProfileFields) => {
    if (
      locked.current ||
      !profileFormState(request, baseline, avatarError).canSave
    ) {
      return;
    }

    locked.current = true;
    setServerErrors({});
    setNotice("");
    setSaved(false);

    try {
      const updated = await save.mutateAsync(normalizeProfileFields(request));

      const next = profileFieldsFromUser(updated);

      setFields(next);
      setBaseline(next);
      setAvatar(null);
      setAvatarError("");
      setEdited({});
      setServerErrors({});

      if (upload.current) {
        upload.current.value = "";
      }

      setSaved(true);
    } catch (error) {
      const failure = bookingError(error);

      setServerErrors(failure.errors ?? {});
      setNotice(
        failure.message ?? "Unable to save your profile. Please try again.",
      );

      if (failure.status === 401) {
        requestLogin(() => submit(request));
      }
    } finally {
      locked.current = false;
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void submit({
      ...fields,
      avatar: avatar?.file,
    });
  };

  const fieldErrors = (name: string) =>
    errors[name]?.length ? (
      <div
        id={`profile-${name}-error`}
        role="alert"
        className="mt-2 space-y-1 text-xs text-[#FF725A]"
      >
        {errors[name].map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
    ) : null;

  const ratings = options.data?.ageRatings;

  const allRatings =
    user.age !== null &&
    Boolean(ratings?.length) &&
    ratings!.every((rating) => user.age! >= rating.minAge);

  return (
    <section
      aria-label="Personal information"
      className="w-full bg-transparent text-white"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-220 space-y-5"
      >
        <fieldset
          disabled={save.isPending}
          className="space-y-5 disabled:opacity-70"
        >
          {/* Full name */}
          <div>
            <label
              htmlFor="profile-fullName"
              className="mb-2 block text-xs font-semibold"
            >
              Full name
            </label>

            <input
              id="profile-fullName"
              autoComplete="name"
              required
              className={control}
              value={fields.fullName}
              onChange={(event) => changeField("fullName", event.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby="profile-fullName-error"
            />

            {fieldErrors("fullName")}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-xs font-semibold"
            >
              Email
            </label>

            <input
              id="profile-email"
              type="email"
              readOnly
              value={user.email}
              className={`${control} text-[#A9A9A9]`}
              aria-describedby="email-help"
            />

            <p id="email-help" className="mt-1.5 text-xs text-[#A9A9A9]">
              Set at registration and cannot be changed
            </p>
          </div>

          {/* Mobile number */}
          <div>
            <label
              htmlFor="profile-mobileNumber"
              className="mb-2 block text-xs font-semibold"
            >
              Mobile number
            </label>

            <input
              id="profile-mobileNumber"
              type="tel"
              autoComplete="tel-national"
              required
              placeholder="555 123 456"
              className={control}
              value={fields.mobileNumber}
              onChange={(event) =>
                changeField("mobileNumber", event.target.value)
              }
              aria-invalid={Boolean(errors.mobileNumber)}
              aria-describedby="profile-mobileNumber-error"
            />

            {fieldErrors("mobileNumber")}
          </div>

          {/* Date of birth */}
          <div>
            <label
              htmlFor="profile-dateOfBirth"
              className="mb-2 block text-xs font-semibold"
            >
              Date of birth
            </label>

            <input
              id="profile-dateOfBirth"
              type="date"
              autoComplete="bday"
              required
              className={`${control} scheme-dark`}
              value={fields.dateOfBirth}
              onChange={(event) =>
                changeField("dateOfBirth", event.target.value)
              }
              aria-invalid={Boolean(errors.dateOfBirth)}
              aria-describedby="profile-dateOfBirth-error"
            />

            {fieldErrors("dateOfBirth")}
          </div>

          {/* Preferred venue */}
          <div>
            <label
              htmlFor="profile-preferredVenueId"
              className="mb-2 block text-xs font-semibold"
            >
              Preferred Venue (Optional)
            </label>

            <select
              id="profile-preferredVenueId"
              className={`${control} scheme-dark`}
              value={fields.preferredVenueId}
              disabled={!options.data}
              onChange={(event) =>
                changeField("preferredVenueId", event.target.value)
              }
              aria-invalid={Boolean(errors.preferredVenueId)}
              aria-describedby="profile-preferredVenueId-error"
            >
              <option value="">
                {options.isPending
                  ? "Loading venues..."
                  : "Select preferred venue"}
              </option>

              {!options.data && user.preferredVenue && (
                <option value={user.preferredVenue.id}>
                  {user.preferredVenue.name}
                </option>
              )}

              {options.data?.venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} · {venue.city}
                </option>
              ))}
            </select>

            {fieldErrors("preferredVenueId")}

            {options.isError && (
              <p role="alert" className="mt-2 text-xs text-[#FF725A]">
                {bookingError(options.error).message ??
                  "Unable to load venues."}{" "}
                <button
                  type="button"
                  onClick={() => void options.refetch()}
                  className="cursor-pointer underline"
                >
                  Retry
                </button>
              </p>
            )}
          </div>

          {/* Optional avatar section */}
          <div className="border-t border-white/10 pt-5">
            <button
              type="button"
              aria-expanded={avatarExpanded}
              aria-controls="profile-avatar-section"
              onClick={() => setAvatarExpanded((value) => !value)}
              className="cursor-pointer text-sm font-semibold text-white/70 transition hover:text-white"
            >
              {avatarExpanded
                ? "Hide profile photo settings −"
                : "Change profile photo +"}
            </button>

            {avatarExpanded && (
              <div
                id="profile-avatar-section"
                className="mt-5 flex flex-wrap items-start gap-5"
              >
                {avatar?.preview || user.avatar ? (
                  <img
                    src={avatar?.preview ?? user.avatar!}
                    alt="Your avatar"
                    className="size-20 rounded-xl object-cover"
                  />
                ) : (
                  <span
                    className="flex size-20 items-center justify-center rounded-xl bg-[#2A2C3D] text-2xl font-semibold"
                    aria-label="No avatar"
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <label
                    htmlFor="profile-avatar"
                    className="block text-sm font-semibold"
                  >
                    Profile photo
                  </label>

                  <input
                    ref={upload}
                    id="profile-avatar"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    aria-invalid={Boolean(errors.avatar)}
                    aria-describedby="avatar-help profile-avatar-error"
                    className="block w-full max-w-64 text-xs file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-semibold file:text-white"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      clearFieldError("avatar");

                      const result = validateAvatar(file);
                      const message = result === true ? "" : result;

                      setAvatarError(message);

                      if (message) {
                        event.target.value = "";
                        setAvatar(null);
                        return;
                      }

                      setAvatar({
                        file,
                        preview: URL.createObjectURL(file),
                      });
                    }}
                  />

                  <p id="avatar-help" className="text-xs text-[#A9A9A9]">
                    JPG, JPEG, PNG or WebP. Maximum 2MB.
                  </p>

                  {fieldErrors("avatar")}
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {/* Age rating information */}
        {user.age !== null && (
          <p className="text-xs text-white/50">
            {allRatings
              ? `You are ${user.age}. You can buy tickets for all age ratings.`
              : `You are ${user.age}${
                  ratings?.length
                    ? `. Available age ratings: ${ratings
                        .filter((rating) => user.age! >= rating.minAge)
                        .map((rating) => rating.code)
                        .join(", ")}`
                    : "."
                }`}
          </p>
        )}

        {/* API error */}
        {notice && (
          <p role="alert" className="text-sm text-[#FF725A]">
            {notice}
          </p>
        )}

        {/* Save confirmation */}
        {saved && (
          <p role="status" className="text-sm text-[#4ADE80]">
            Profile saved.
          </p>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={save.isPending || !form.canSave}
          className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#EC3013] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#D92B11] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
};

export default ProfileForm;
