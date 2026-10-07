import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createFormControl } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

let server, getAuthErrors, loginSchema, registerSchema, validateAvatar, useAuthFormFeedback, client, auth;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ getAuthErrors } = await server.ssrLoadModule('/src/features/auth/authErrors.ts'));
  ({ useAuthFormFeedback } = await server.ssrLoadModule('/src/features/auth/useAuthFormFeedback.ts'));
  ({ loginSchema } = await server.ssrLoadModule('/src/features/auth/schemas/loginSchema.ts'));
  ({ registerSchema } = await server.ssrLoadModule('/src/features/auth/schemas/registerSchema.ts'));
  ({ validateAvatar } = await server.ssrLoadModule('/src/utils/formValidation.ts'));
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  auth = await server.ssrLoadModule('/src/api/auth.ts');
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });
const failure = (status, data) => ({ isAxiosError: true, response: { status, data } });
const valid = { username: 'Ana', email: 'ana@example.test', password: 'abc', confirmPassword: 'abc' };

function form(schema, values, mode = 'onTouched') {
  const control = createFormControl({ resolver: yupResolver(schema), mode, defaultValues: values });
  control.subscribe({ formState: { errors: true, touchedFields: true, isSubmitting: true }, callback() {} });
  const inputs = Object.fromEntries(Object.keys(values).map(name => [name, control.register(name)]));
  return { ...control, inputs };
}

test('login preserves the exact 401 message and maps 422 fields', () => {
  assert.deepEqual(getAuthErrors(failure(401, { message: 'These credentials do not match our records.' }), 'login'), {
    fieldErrors: {}, general: 'These credentials do not match our records.',
  });
  assert.deepEqual(getAuthErrors(failure(422, { errors: { email: ['Email rejected'], password: ['Password rejected'] } }), 'login'), {
    fieldErrors: { email: 'Email rejected', password: 'Password rejected' }, general: '',
  });
});

test('registration maps duplicate username/email, avatar and both password fields without rewriting messages', () => {
  const errors = { username: ['The username has already been taken.'], email: ['The email has already been taken.'],
    avatar: ['The avatar must be an image.', 'The avatar must not be greater than 2048 kilobytes.'],
    password: ['The password confirmation does not match.'], password_confirmation: ['Confirmation is required.'] };
  const result = getAuthErrors(failure(422, { errors }), 'register');
  for (const [field, message] of Object.entries(errors)) {
    assert.equal(result.fieldErrors[field === 'password_confirmation' ? 'confirmPassword' : field], message.join(' '));
  }
});

test('unmapped and global validation messages appear in the general area', () => {
  const result = getAuthErrors(failure(422, { message: 'Please check your details.', errors: { account: ['Account unavailable'], email: ['Email rejected'] } }), 'register');
  assert.equal(result.general, 'Please check your details. Account unavailable');
  assert.equal(result.fieldErrors.email, 'Email rejected');
});

test('network, malformed, and server failures are recoverable general errors, without technical objects', () => {
  for (const error of [new Error('secret stack'), { isAxiosError: true }, failure(500, { message: 'SQL exception', errors: { email: ['internal'] } }), failure(502, '<html>Bad gateway</html>'), failure(422, { message: {}, errors: { email: [{}] } })]) {
    const result = getAuthErrors(error, 'login');
    assert.deepEqual(result.fieldErrors, {});
    assert.match(result.general, /Please try again/);
    assert.doesNotMatch(result.general, /SQL|stack|html|object/);
  }
});

test('login client validation blocks invalid input; failed login retains email and does not invoke success', async () => {
  for (const change of [{ email: '' }, { email: 'invalid' }, { password: '' }, { password: 'ab' }]) {
    const control = form(loginSchema, { email: valid.email, password: valid.password, ...change });
    let requests = 0;
    await control.handleSubmit(() => { requests++; })();
    assert.equal(requests, 0);
  }
  const control = form(loginSchema, { email: valid.email, password: valid.password });
  let success = false;
  client.defaults.adapter = async () => { throw failure(401, { message: 'Incorrect credentials' }); };
  await control.handleSubmit(async (data) => {
    try {
      await auth.login(data);
      success = true;
    } catch (error) {
      assert.equal(getAuthErrors(error, 'login').general, 'Incorrect credentials');
    }
  })();
  assert.equal(control.getValues('email'), valid.email);
  assert.equal(success, false);
});

test('registration required/minimum/matching rules block requests and accept three-character minimums', async () => {
  for (const change of [{ username: '' }, { username: 'ab' }, { email: 'bad' }, { password: '' }, { password: 'ab', confirmPassword: 'ab' }, { confirmPassword: '' }, { confirmPassword: 'mismatch' }]) {
    const control = form(registerSchema, { ...valid, ...change });
    let requests = 0;
    await control.handleSubmit(() => { requests++; })();
    assert.equal(requests, 0);
  }
  assert.equal(await registerSchema.isValid(valid), true);
});

test('onTouched waits for blur, then clears visible errors during editing; submit validates untouched fields', async () => {
  const control = form(registerSchema, { username: '', email: '', password: '', confirmPassword: '' });
  const input = control.inputs.username;
  await input.onChange({ type: 'change', target: { name: 'username', value: 'ab' } });
  assert.equal(control.getFieldState('username').error, undefined);
  await input.onBlur({ type: 'blur', target: { name: 'username', value: 'ab' } });
  assert(control.getFieldState('username').error);
  await input.onChange({ type: 'change', target: { name: 'username', value: 'Ana' } });
  assert.equal(control.getFieldState('username').error, undefined);
  await control.handleSubmit(() => assert.fail('invalid submission'))();
  assert(control.getFieldState('email').error);
  assert(control.getFieldState('password').error);
});

test('shared avatar validator accepts supported types through exactly 2 MB, rejects oversize and invalid types', () => {
  for (const [extension, type] of [['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']]) {
    assert.equal(validateAvatar(new File([new Uint8Array(2 * 1024 * 1024)], `avatar.${extension}`, { type })), true);
    assert.match(validateAvatar(new File([new Uint8Array(2 * 1024 * 1024 + 1)], `avatar.${extension}`, { type })), /2MB/);
  }
  assert.notEqual(validateAvatar(new File(['x'], 'avatar.svg', { type: 'image/svg+xml' })), true);
});

test('submission lock covers async validation, rejects duplicate requests and releases after failure', async () => {
  for (const kind of ['login', 'register']) {
    let feedback;
    renderToStaticMarkup(React.createElement(function Probe() { feedback = useAuthFormFeedback(kind); return null; }));
    let release, calls = 0;
    const event = { preventDefault() {} };
    const handler = feedback.submit(async () => { calls++; await new Promise(resolve => { release = resolve; }); });
    const first = handler(event);
    await handler(event);
    assert.equal(calls, 1);
    release(); await first;
    await assert.rejects(feedback.submit(async () => { throw new Error('failure'); })(event));
    await feedback.submit(async () => { calls++; })(event);
    assert.equal(calls, 2);
  }
});

test('successful registration and login preserve server-returned token/user and multipart confirmation/avatar', async () => {
  const response = { data: { token: 'returned-token', user: { id: 42, username: 'Ana', profileComplete: false } } };
  const avatar = new File(['image'], 'avatar.webp', { type: 'image/webp' });
  client.defaults.adapter = async config => {
    if (config.url === '/register') {
      assert.equal(config.data.get('password_confirmation'), valid.confirmPassword);
      assert.equal(config.data.get('avatar').name, 'avatar.webp');
    } else assert.deepEqual(JSON.parse(config.data), { email: valid.email, password: valid.password });
    return { status: 200, data: response, headers: {}, config };
  };
  assert.deepEqual(await auth.register({ ...valid, passwordConfirmation: valid.confirmPassword, avatar }), response);
  assert.deepEqual(await auth.login({ email: valid.email, password: valid.password }), response);
});

test('editing clears only the affected server field and general error; a new form starts clean', () => {
  let step = 0;
  renderToStaticMarkup(React.createElement(function Probe() {
    const feedback = useAuthFormFeedback('register');
    if (step++ === 0) feedback.showError(failure(422, { message: 'Check details', errors: { username: ['Taken'], email: ['Email taken'], avatar: ['Invalid image'] } }));
    else if (step === 2) {
      assert.equal(feedback.serverErrors.username, 'Taken');
      feedback.clearFieldError('username');
    } else {
      assert.deepEqual(feedback.serverErrors, { email: 'Email taken', avatar: 'Invalid image' });
      assert.equal(feedback.apiError, '');
    }
    return null;
  }));
  assert.equal(step, 3);
  renderToStaticMarkup(React.createElement(function FreshLogin() {
    const feedback = useAuthFormFeedback('login');
    assert.deepEqual(feedback.serverErrors, {});
    assert.equal(feedback.apiError, '');
    return null;
  }));
});
