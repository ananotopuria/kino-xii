import { string } from "yup";
import type { ProfileFields, User } from "../types/auth";
import type { CheckoutFields } from "../types/booking";

// Contract: https://api.kinoxii.redberryinternship.ge/docs (PUT /profile, POST /orders).
// Remove formatting spaces only; letters, punctuation and country codes stay invalid.
export const normalizeSpacedDigits = (value: string) => value.replace(/\s/g, "");
type Validation = true | string;
export type FieldErrors = Record<string, string[]>;

export const validateFullName = (value: string): Validation => {
  const name = value.trim();
  if (!name) return "Full name is required.";
  if ([...name].length < 3 || [...name].length > 50) return "Full name must be between 3 and 50 characters.";
  return true;
};
export const validateMobileNumber = (value: string): Validation => {
  const number = normalizeSpacedDigits(value);
  if (!number) return "Mobile number is required.";
  if (!/^\d{9}$/.test(number)) return "Mobile number must contain 9 digits.";
  if (!number.startsWith("5")) return "Georgian mobile numbers must start with 5.";
  return true;
};
const emailFormat = string().email();
export const validateEmail = (value: string): Validation =>
  !value.trim() ? "Email is required." : emailFormat.isValidSync(value.trim()) ? true : "Enter a valid email address.";

export const validateExpiry = (value: string, today = new Date()): Validation => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return "Enter expiry as MM/YY with a month from 01 to 12.";
  const [month, year] = value.split("/").map(Number);
  // A card remains valid throughout its expiry month.
  return (2000 + year) * 12 + month >= today.getFullYear() * 12 + today.getMonth() + 1
    ? true : "Card expiry must not be in the past.";
};

export const validateDateOfBirth = (value: string, today = new Date()): Validation => {
  if (!value) return "Date of birth is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a valid date of birth.";
  const [year, month, day] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return "Enter a valid date of birth.";
  const birthday = year * 10000 + month * 100 + day;
  const cutoff = (today.getFullYear() - 12) * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return birthday <= cutoff ? true : "You must be at least 12 years old.";
};

export const checkoutValidators: Record<keyof CheckoutFields, (value: string) => Validation> = {
  fullName: validateFullName,
  email: validateEmail,
  mobileNumber: validateMobileNumber,
  cardNumber: (value) => /^\d{16}$/.test(normalizeSpacedDigits(value)) ? true : "Card number must contain 16 digits.",
  expiry: (value) => validateExpiry(value),
  cvv: (value) => /^\d{3}$/.test(value) ? true : "CVV must contain 3 digits.",
};

export const normalizeCheckoutFields = (fields: CheckoutFields): CheckoutFields => ({
  ...fields, fullName: fields.fullName.trim(), email: fields.email.trim(),
  mobileNumber: normalizeSpacedDigits(fields.mobileNumber), cardNumber: normalizeSpacedDigits(fields.cardNumber),
});

export const profileFieldsFromUser = (user: User): ProfileFields => ({
  fullName: user.fullName ?? "", mobileNumber: user.mobileNumber ?? "",
  dateOfBirth: user.dateOfBirth ?? "", preferredVenueId: user.preferredVenue?.id.toString() ?? "",
});
export const normalizeProfileFields = (fields: ProfileFields): ProfileFields => ({
  ...fields, fullName: fields.fullName.trim(), mobileNumber: normalizeSpacedDigits(fields.mobileNumber),
});

export const validateAvatar = (file: File): Validation =>
  !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)
    ? "Choose a JPG, JPEG, PNG or WebP image."
    : file.size > 2 * 1024 * 1024 ? "Choose an image no larger than 2MB." : true;

export const profileFormState = (fields: ProfileFields, baseline: ProfileFields, avatarError = "", today = new Date()) => {
  const errors: FieldErrors = {};
  const results = {
    fullName: validateFullName(fields.fullName), mobileNumber: validateMobileNumber(fields.mobileNumber),
    dateOfBirth: validateDateOfBirth(fields.dateOfBirth, today),
    avatar: avatarError || (fields.avatar ? validateAvatar(fields.avatar) : true),
  };
  for (const [name, result] of Object.entries(results)) if (result !== true) errors[name] = [result];
  const next = normalizeProfileFields(fields);
  const previous = normalizeProfileFields(baseline);
  const dirty = Boolean(fields.avatar) || (["fullName", "mobileNumber", "dateOfBirth", "preferredVenueId"] as const)
    .some((name) => next[name] !== previous[name]);
  return { errors, dirty, canSave: dirty && Object.keys(errors).length === 0 };
};
