import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ProfileFields, User } from "../../types/auth";
import { useProfile } from "../../features/profile/useProfile";
import { useFilterOptions } from "../../features/auth/filters/useFilterOptions";
import { bookingError } from "../../utils/booking";
import { normalizeProfileFields, profileFieldsFromUser, profileFormState, validateAvatar } from "../../utils/formValidation";

type Props = { user: User; requestLogin: (retry: () => Promise<void>) => void };
const control = "h-11 w-full rounded-xl border border-[#2a2c3d] bg-[#1e2031] px-4 text-sm outline-none focus:border-white/60 disabled:opacity-60";

const ProfileForm = ({ user, requestLogin }: Props) => {
  const options = useFilterOptions();
  const save = useProfile();
  const [fields, setFields] = useState(() => profileFieldsFromUser(user));
  const [baseline, setBaseline] = useState(() => profileFieldsFromUser(user));
  const [avatar, setAvatar] = useState<{ file: File; preview: string } | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [edited, setEdited] = useState<Record<string, boolean>>({});
  const form = profileFormState({ ...fields, avatar: avatar?.file }, baseline, avatarError);
  const errors = { ...Object.fromEntries(Object.entries(form.errors).filter(([name]) => edited[name])), ...serverErrors };
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  useEffect(() => () => { if (avatar) URL.revokeObjectURL(avatar.preview); }, [avatar]);

  const clearFieldError = (name: keyof ProfileFields) => {
    setServerErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
    setEdited((current) => ({ ...current, [name]: true }));
    setSaved(false); setNotice("");
  };
  const changeField = (name: Exclude<keyof ProfileFields, "avatar">, value: string) => {
    setFields((current) => ({ ...current, [name]: value }));
    clearFieldError(name);
  };

  const submit = async (request: ProfileFields) => {
    if (locked.current || !profileFormState(request, baseline, avatarError).canSave) return;
    locked.current = true;
    setServerErrors({}); setNotice(""); setSaved(false);
    try {
      const updated = await save.mutateAsync(normalizeProfileFields(request));
      const next = profileFieldsFromUser(updated);
      setFields(next);
      setBaseline(next);
      setAvatar(null);
      setAvatarError(""); setEdited({}); setServerErrors({});
      if (upload.current) upload.current.value = "";
      setSaved(true);
    } catch (error) {
      const failure = bookingError(error);
      setServerErrors(failure.errors ?? {});
      setNotice(failure.message ?? "Unable to save your profile. Please try again.");
      if (failure.status === 401) requestLogin(() => submit(request));
    } finally { locked.current = false; }
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit({ ...fields, avatar: avatar?.file });
  };
  const fieldErrors = (name: string) => errors[name]?.length ? <div id={`profile-${name}-error`} role="alert" className="mt-2 space-y-1 text-xs text-[#ff725a]">{errors[name].map((message, index) => <p key={index}>{message}</p>)}</div> : null;
  const ratings = options.data?.ageRatings;
  const allRatings = user.age !== null && ratings?.length && ratings.every((rating) => user.age! >= rating.minAge);

  return <section aria-labelledby="profile-heading" className="rounded-2xl border border-[#2a2c3d] bg-[#070c1c] p-5 sm:p-8">
    <h1 id="profile-heading" className="text-2xl font-extrabold">My Profile</h1>
    <p className="mt-2 text-sm text-[#a9a9a9]">Manage your personal information and cinema preferences.</p>
    {!user.profileComplete && <p role="status" className="mt-6 rounded-xl bg-amber-400/10 p-4 text-sm text-amber-300">Complete your profile to book tickets. Add your full name, mobile number and date of birth.</p>}
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-6">
      <fieldset disabled={save.isPending} className="space-y-6 disabled:opacity-70">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            {avatar?.preview || user.avatar ? <img src={avatar?.preview ?? user.avatar!} alt="Your avatar" className="size-20 rounded-xl object-cover" /> : <span className="flex size-20 items-center justify-center rounded-xl bg-[#2a2c3d] text-2xl font-semibold" aria-label="No avatar">{user.username.slice(0, 2).toUpperCase()}</span>}
            <div className="space-y-2">
              <label htmlFor="profile-avatar" className="block text-sm font-semibold">Profile photo</label>
              <input ref={upload} id="profile-avatar" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-invalid={Boolean(errors.avatar)} aria-describedby="avatar-help profile-avatar-error" className="block w-full max-w-64 text-xs file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:font-semibold file:text-white" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                clearFieldError("avatar");
                const result = validateAvatar(file);
                const message = result === true ? "" : result;
                setAvatarError(message);
                if (message) { event.target.value = ""; setAvatar(null); return; }
                setAvatar({ file, preview: URL.createObjectURL(file) });
              }} />
              <p id="avatar-help" className="text-xs text-[#a9a9a9]">JPG, JPEG, PNG or WebP. Maximum 2MB.</p>
            </div>
          </div>
          {fieldErrors("avatar")}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-fullName" className="mb-2.5 block text-xs font-semibold">Full name *</label>
            <input id="profile-fullName" autoComplete="name" required className={control} value={fields.fullName} onChange={(event) => changeField("fullName", event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby="profile-fullName-error" />
            {fieldErrors("fullName")}
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-2.5 block text-xs font-semibold">Email</label>
            <input id="profile-email" type="email" readOnly value={user.email} className={`${control} text-[#a9a9a9]`} aria-describedby="email-help" />
            <p id="email-help" className="mt-2 text-xs text-[#a9a9a9]">Email cannot be changed.</p>
          </div>
          <div>
            <label htmlFor="profile-mobileNumber" className="mb-2.5 block text-xs font-semibold">Mobile number *</label>
            <input id="profile-mobileNumber" type="tel" autoComplete="tel-national" required placeholder="599 123 456" className={control} value={fields.mobileNumber} onChange={(event) => changeField("mobileNumber", event.target.value)} aria-invalid={Boolean(errors.mobileNumber)} aria-describedby="profile-mobileNumber-error" />
            {fieldErrors("mobileNumber")}
          </div>
          <div>
            <label htmlFor="profile-dateOfBirth" className="mb-2.5 block text-xs font-semibold">Date of birth *</label>
            <input id="profile-dateOfBirth" type="date" autoComplete="bday" required className={`${control} scheme-dark`} value={fields.dateOfBirth} onChange={(event) => changeField("dateOfBirth", event.target.value)} aria-invalid={Boolean(errors.dateOfBirth)} aria-describedby="profile-dateOfBirth-error" />
            {fieldErrors("dateOfBirth")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-preferredVenueId" className="mb-2.5 block text-xs font-semibold">Preferred venue</label>
            <select id="profile-preferredVenueId" className={control} value={fields.preferredVenueId} disabled={!options.data} onChange={(event) => changeField("preferredVenueId", event.target.value)} aria-invalid={Boolean(errors.preferredVenueId)} aria-describedby="profile-preferredVenueId-error">
              <option value="">{options.isPending ? "Loading venues..." : "No preference"}</option>
              {!options.data && user.preferredVenue && <option value={user.preferredVenue.id}>{user.preferredVenue.name}</option>}
              {options.data?.venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}</option>)}
            </select>
            {fieldErrors("preferredVenueId")}
            {options.isError && <p role="alert" className="mt-2 text-xs text-[#ff725a]">{bookingError(options.error).message ?? "Unable to load venues."} <button type="button" onClick={() => void options.refetch()} className="underline">Retry</button></p>}
          </div>
        </div>
      </fieldset>
      {user.age !== null && <p className="rounded-xl bg-[#4ade80]/10 p-4 text-sm text-[#4ade80]">{allRatings ? `You are ${user.age}, you can buy tickets for all age ratings` : `You are ${user.age}${ratings?.length ? `, you can buy tickets for age ratings ${ratings.filter((rating) => user.age! >= rating.minAge).map((rating) => rating.code).join(", ")}` : "."}`}</p>}
      {notice && <p role="alert" className="text-sm text-[#ff725a]">{notice}</p>}
      {saved && <p role="status" className="text-sm text-[#4ade80]">Profile saved.</p>}
      <button type="submit" disabled={save.isPending || !form.canSave} className="cursor-pointer rounded-full bg-[#ec3013] px-6 py-3 text-sm font-extrabold hover:bg-[#d92b11] disabled:cursor-wait disabled:opacity-50">{save.isPending ? "Saving..." : "Save changes"}</button>
    </form>
  </section>;
};

export default ProfileForm;
