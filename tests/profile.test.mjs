import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, profileApi, ticketsApi, syncRefundedOrder, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  client = (await server.ssrLoadModule('/src/api/client.ts')).apiClient;
  profileApi = await server.ssrLoadModule('/src/api/profile.ts');
  ticketsApi = await server.ssrLoadModule('/src/api/tickets.ts');
  ({ syncRefundedOrder } = await server.ssrLoadModule('/src/utils/tickets.ts'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const user = { id: 4, username: 'viewer', email: 'viewer@example.test', fullName: 'API Viewer', mobileNumber: '599123456', dateOfBirth: '1990-01-01', age: 15, avatar: '/returned-avatar.webp', preferredVenue: { id: 9, name: 'API Venue', city: 'Tbilisi' }, profileComplete: true };
const order = { id: 2, reference: 'KX-REFERENCE', status: 'paid', totalPrice: 27, isUpcoming: true, isRefundable: true, cardLastFour: '4242', session: { id: 8, startsAt: '2030-01-01T19:30:00Z', date: '2030-01-01', time: '19:30', movie: { title: 'API Film', posterUrl: '/poster.png', ageRating: { code: '12+' } }, venue: { name: 'API Venue' }, hall: { name: 'B' }, format: { name: 'IMAX' }, language: { name: 'English' } }, tickets: [{ id: 3, seatCode: 'E7', ticketType: { slug: 'adult', name: 'Adult' }, price: 27 }] };

test('profile sends multipart PUT with exact fields, no email, and returns the API user', async () => {
  const avatar = new File(['image'], 'avatar.webp', { type: 'image/webp' });
  const fields = { fullName: 'Viewer Name', mobileNumber: '599 123 456', dateOfBirth: '2000-01-01', preferredVenueId: '9', avatar, email: 'ignored@example.test' };
  client.defaults.adapter = async config => {
    assert.equal(config.method, 'put'); assert.equal(config.url, '/profile');
    assert(config.data instanceof FormData);
    assert.deepEqual([...config.data.keys()], ['fullName', 'mobileNumber', 'dateOfBirth', 'preferredVenueId', 'avatar']);
    assert.equal(config.data.get('mobileNumber'), '599 123 456');
    assert.equal(config.data.get('avatar').name, 'avatar.webp');
    assert.equal(config.data.get('preferredVenueId'), '9');
    return { data: { data: user }, status: 200, headers: {}, config };
  };
  assert.deepEqual(await profileApi.updateProfile(fields), user);
});

test('tickets use the server filter and refund uses the encoded reference, returning the updated order', async () => {
  const calls = [];
  const updated = { ...order, status: 'refunded', isUpcoming: false, isRefundable: false };
  client.defaults.adapter = async config => {
    calls.push(config);
    return { data: { data: config.method === 'get' ? [order] : updated }, status: 200, headers: {}, config };
  };
  const signal = new AbortController().signal;
  assert.deepEqual(await ticketsApi.getTickets('upcoming', signal), [order]);
  await ticketsApi.getTickets('past');
  assert.equal(calls[0].params.filter, 'upcoming'); assert.equal(calls[0].signal, signal);
  assert.equal(calls[1].params.filter, 'past');
  assert.deepEqual(await ticketsApi.refundOrder('KX/REFERENCE'), updated);
  assert.equal(calls[2].method, 'post'); assert.equal(calls[2].url, '/orders/KX%2FREFERENCE/refund');
});

test('API validation and refund refusal messages remain unchanged for 401, 403 and 422', async () => {
  const { bookingError } = await server.ssrLoadModule('/src/utils/booking.ts');
  for (const status of [401, 403, 422]) {
    const data = { message: 'Exact backend refusal', errors: { mobileNumber: ['Georgian mobile numbers must start with 5', 'Exact second validation message'] } };
    client.defaults.adapter = async () => { throw { isAxiosError: true, response: { status, data } }; };
    for (const run of [() => ticketsApi.refundOrder(order.reference), () => profileApi.updateProfile({ ...user, preferredVenueId: '9' })]) {
      await assert.rejects(run, error => { assert.deepEqual(bookingError(error), { ...data, status }); return true; });
    }
  }
});

test('refund reconciles both caches from server flags, preserves other users and invalidates both tabs', async () => {
  const query = new QueryClient();
  const other = { ...order, id: 3, reference: 'KX-OTHER' };
  const updated = { ...order, status: 'refunded', refundedAt: '2026-10-04T12:00:00Z', isUpcoming: false, isRefundable: false };
  query.setQueryData(['tickets', user.id, 'upcoming'], [order, other]);
  query.setQueryData(['tickets', user.id, 'past'], []);
  query.setQueryData(['tickets', 999, 'upcoming'], [order]);
  await syncRefundedOrder(query, user.id, updated);
  assert.deepEqual(query.getQueryData(['tickets', user.id, 'upcoming']), [other]);
  assert.deepEqual(query.getQueryData(['tickets', user.id, 'past']), [updated]);
  assert.deepEqual(query.getQueryData(['tickets', 999, 'upcoming']), [order]);
  for (const filter of ['upcoming', 'past']) assert(query.getQueryState(['tickets', user.id, filter]).isInvalidated);
  query.clear();
});

test('refund does not fabricate an incomplete Past cache when it has never been fetched', async () => {
  const query = new QueryClient();
  query.setQueryData(['tickets', user.id, 'upcoming'], [order]);
  await syncRefundedOrder(query, user.id, { ...order, status: 'refunded', isUpcoming: false, isRefundable: false });
  assert.equal(query.getQueryData(['tickets', user.id, 'past']), undefined);
  assert.deepEqual(query.getQueryData(['tickets', user.id, 'upcoming']), []);
  query.clear();
});

test('ticket UI trusts API eligibility even when session dates suggest otherwise', async () => {
  const { default: Card } = await server.ssrLoadModule('/src/components/profile/TicketCard.tsx');
  const render = value => renderToStaticMarkup(React.createElement(Card, { order: value, onRefund() {} }));
  const available = render({ ...order, session: { ...order.session, date: '2000-01-01' } });
  assert(available.includes('API Film') && available.includes('E7') && available.includes('KX-REFERENCE') && available.includes('27'));
  assert(!available.includes('disabled=""'));
  const unavailable = render({ ...order, isRefundable: false });
  assert(unavailable.includes('disabled=""') && unavailable.includes('within 2 hours'));
  const refunded = render({ ...order, status: 'refunded', isUpcoming: false, isRefundable: false });
  assert(refunded.includes('TOTAL REFUNDED') && !refunded.includes('<button'));
});

const renderWithUser = (component, account, query, props = {}) => renderToStaticMarkup(
  React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: account, isAuthenticated: Boolean(account), isLoading: false, updateUser() {}, signOut() {} } },
      React.createElement(MemoryRouter, null, React.createElement(component, props)))));

test('profile prefills API data, locks email, and derives the notice from API age rather than birth date', async () => {
  const { default: Form } = await server.ssrLoadModule('/src/components/profile/ProfileForm.tsx');
  const query = new QueryClient();
  query.setQueryData(['filter-options'], { venues: [user.preferredVenue], ageRatings: [{ code: '12+', minAge: 12 }, { code: '18+', minAge: 18 }] });
  const html = renderWithUser(Form, user, query, { user, requestLogin() {} });
  assert(html.includes('value="API Viewer"') && html.includes('value="599123456"') && html.includes('returned-avatar.webp'));
  assert(/id="profile-email"[^>]*readOnly=""/.test(html));
  assert(html.includes('You are 15, you can buy tickets for age ratings 12+'));
  assert(!html.includes('you can buy tickets for all age ratings'));
  assert(!html.includes('Complete your profile to book tickets'));
  assert(/<button type="submit" disabled=""/.test(html), 'unchanged profile must not be saved');
  const incomplete = { ...user, profileComplete: false };
  assert(renderWithUser(Form, incomplete, query, { user: incomplete, requestLogin() {} }).includes('Complete your profile to book tickets'));
  query.clear();
});

test('navbar indicator follows profileComplete and profile hides private UI from guests', async () => {
  const { default: Menu } = await server.ssrLoadModule('/src/components/layout/ProfileMenu.tsx');
  const { default: Profile } = await server.ssrLoadModule('/src/pages/Profile.tsx');
  const query = new QueryClient();
  assert(renderWithUser(Menu, { ...user, profileComplete: false }, query).includes('Profile incomplete'));
  assert(!renderWithUser(Menu, user, query).includes('Profile incomplete'));
  const guest = renderWithUser(Profile, null, query);
  assert(guest.includes('Log in to manage your profile and tickets'));
  assert(!guest.includes('profile-fullName') && !guest.includes('KX-REFERENCE'));
  query.clear();
});
