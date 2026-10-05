import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server, validation;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  validation = await server.ssrLoadModule('/src/utils/formValidation.ts');
});
after(async () => { await server?.close(); });

const today = new Date(2026, 9, 5, 23, 59);
const profile = { fullName: 'Jane Dolidze', mobileNumber: '599123456', dateOfBirth: '1998-05-12', preferredVenueId: '9' };
const checkout = { fullName: profile.fullName, email: 'jane@example.test', mobileNumber: profile.mobileNumber,
  cardNumber: '4242 4242 4242 4242', expiry: '12/99', cvv: '123' };

test('both forms require a name of 3–50 characters without adding alphabet or word-count restrictions', () => {
  for (const name of ['', '  ', 'Jo', 'x'.repeat(51)]) assert.notEqual(validation.validateFullName(name), true);
  for (const name of ['Ana', 'ანა', "O’Connor-Smith", 'x'.repeat(50)]) assert.equal(validation.validateFullName(name), true);
});

test('checkout rejects missing and malformed email and accepts valid email', () => {
  for (const email of ['', 'plain-text', 'jane@', '@example.test', 'jane example@test.com']) {
    assert.notEqual(validation.checkoutValidators.email(email), true);
  }
  assert.equal(validation.checkoutValidators.email(checkout.email), true);
});

test('both forms reject wrong phone length, non-digits and a non-Georgian prefix', () => {
  for (const number of ['', '59912345', '5991234567', '499123456', '+995599123456', '599-123-456', '59912345x']) {
    assert.notEqual(validation.validateMobileNumber(number), true);
    assert.notEqual(validation.checkoutValidators.mobileNumber(number), true);
    assert(validation.profileFormState({ ...profile, mobileNumber: number }, profile, '', today).errors.mobileNumber);
  }
  assert.notEqual(validation.validateMobileNumber('499123456'), validation.validateMobileNumber('59912345'));
});

test('spaces are removed from phone/card payloads without silently discarding invalid characters', () => {
  assert.equal(validation.validateMobileNumber('599 123 456'), true);
  assert.equal(validation.normalizeSpacedDigits('599 123 456'), '599123456');
  assert.equal(validation.normalizeSpacedDigits('599-123-456'), '599-123-456');
  assert.equal(validation.normalizeProfileFields({ ...profile, mobileNumber: '599 123 456' }).mobileNumber, '599123456');
  assert.deepEqual(validation.normalizeCheckoutFields({ ...checkout, mobileNumber: '599 123 456' }), {
    ...checkout, mobileNumber: '599123456', cardNumber: '4242424242424242',
  });
});

test('checkout requires exactly 16 card digits but deliberately does not require a checksum', () => {
  for (const card of ['', '1'.repeat(15), '1'.repeat(17), '4242-4242-4242-4242', '424242424242424X']) {
    assert.notEqual(validation.checkoutValidators.cardNumber(card), true);
  }
  assert.equal(validation.checkoutValidators.cardNumber(checkout.cardNumber), true);
  assert.equal(validation.checkoutValidators.cardNumber('1'.repeat(16)), true);
});

test('expiry requires MM/YY and a real month', () => {
  for (const expiry of ['', '00/30', '13/30', '1/30', '10/2030', '10-30', 'AA/30', '10/3A']) {
    assert.notEqual(validation.validateExpiry(expiry, today), true);
  }
});

test('expiry accepts the entire current month, rejects past months and handles year boundaries', () => {
  assert.notEqual(validation.validateExpiry('09/26', today), true);
  assert.equal(validation.validateExpiry('10/26', today), true);
  assert.equal(validation.validateExpiry('11/26', today), true);
  assert.equal(validation.validateExpiry('12/26', new Date(2026, 11, 31, 23, 59)), true);
  assert.notEqual(validation.validateExpiry('12/26', new Date(2027, 0, 1)), true);
  assert.equal(validation.validateExpiry('01/27', new Date(2027, 0, 1)), true);
  // React Hook Form passes all form values as the validator's second argument.
  assert.equal(validation.checkoutValidators.expiry('12/99', checkout), true);
});

test('checkout requires exactly three CVV digits', () => {
  for (const cvv of ['', '12', '1234', '12a', '1 2 3']) assert.notEqual(validation.checkoutValidators.cvv(cvv), true);
  assert.equal(validation.checkoutValidators.cvv('012'), true);
});

test('a valid checkout satisfies all registered validators', () => {
  for (const [name, validate] of Object.entries(validation.checkoutValidators)) {
    assert.equal(validate(checkout[name]), true, name);
  }
});

test('profile DOB rejects under-12 and future dates; the twelfth birthday is accepted', () => {
  assert.notEqual(validation.validateDateOfBirth('2014-10-06', today), true);
  assert.notEqual(validation.validateDateOfBirth('2030-01-01', today), true);
  assert.equal(validation.validateDateOfBirth('2014-10-05', today), true);
  assert.equal(validation.validateDateOfBirth('2014-10-04', today), true);
});

test('DOB uses real calendar dates, including leap years and leap-day birthdays', () => {
  for (const dob of ['', 'not-a-date', '2000-13-01', '2000-00-01', '2000-04-31', '2001-02-29', '0000-01-01']) {
    assert.notEqual(validation.validateDateOfBirth(dob, today), true);
  }
  assert.equal(validation.validateDateOfBirth('2000-02-29', today), true);
  assert.notEqual(validation.validateDateOfBirth('2012-02-29', new Date(2024, 1, 28)), true);
  assert.equal(validation.validateDateOfBirth('2012-02-29', new Date(2024, 1, 29)), true);
});

test('valid unchanged profiles and formatting-only edits cannot save', () => {
  const state = validation.profileFormState(profile, profile, '', today);
  assert.deepEqual(state, { errors: {}, dirty: false, canSave: false });
  assert.equal(validation.profileFormState({ ...profile, mobileNumber: '599 123 456', fullName: ' Jane Dolidze ' }, profile, '', today).canSave, false);
});

test('invalid changes cannot save; valid changes enable Save, and reverting disables it', () => {
  for (const change of [{ fullName: 'Jo' }, { mobileNumber: '499123456' }, { dateOfBirth: '2020-01-01' }]) {
    const state = validation.profileFormState({ ...profile, ...change }, profile, '', today);
    assert.equal(state.dirty, true);
    assert.equal(state.canSave, false);
  }
  assert.equal(validation.profileFormState({ ...profile, fullName: 'Jane Smith' }, profile, '', today).canSave, true);
  assert.equal(validation.profileFormState(profile, profile, '', today).canSave, false);
});

test('venue-only and avatar-only changes count; invalid avatars block other valid changes', () => {
  const avatar = new File(['image'], 'avatar.webp', { type: 'image/webp' });
  for (const preferredVenueId of ['10', '']) {
    assert.equal(validation.profileFormState({ ...profile, preferredVenueId }, profile, '', today).canSave, true);
  }
  assert.equal(validation.profileFormState({ ...profile, avatar }, profile, '', today).canSave, true);
  assert.equal(validation.profileFormState({ ...profile, fullName: 'Jane Smith' }, profile, 'Invalid avatar', today).canSave, false);
  const invalid = new File(['image'], 'avatar.svg', { type: 'image/svg+xml' });
  assert.equal(validation.profileFormState({ ...profile, avatar: invalid }, profile, '', today).canSave, false);
  assert.equal(validation.validateAvatar(new File([new Uint8Array(2 * 1024 * 1024)], 'avatar.jpg', { type: 'image/jpeg' })), true);
  assert.notEqual(validation.validateAvatar(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'avatar.png', { type: 'image/png' })), true);
});

test('the API response becomes the clean baseline after save, including avatar and venue changes', () => {
  const response = { ...profile, fullName: 'Jane Smith', mobileNumber: '599987654', preferredVenue: { id: 10 },
    avatar: '/saved.webp', profileComplete: false, age: 22 };
  const saved = validation.profileFieldsFromUser(response);
  assert.equal(saved.preferredVenueId, '10');
  assert.equal(saved.avatar, undefined);
  assert.deepEqual(validation.profileFormState(saved, saved, '', today), { errors: {}, dirty: false, canSave: false });
  assert.equal(response.profileComplete, false);
  assert.equal(response.age, 22);
});
