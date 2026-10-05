import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, RouterProvider, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, AuthContext, createAuthReplay, useBooking, Profile;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  ({ createAuthReplay } = await server.ssrLoadModule('/src/features/auth/useAuthReplay.ts'));
  ({ useBooking } = await server.ssrLoadModule('/src/features/auth/movies/useBooking.ts'));
  ({ default: Profile } = await server.ssrLoadModule('/src/pages/Profile.tsx'));
  globalThis.localStorage = { getItem: () => 'test-token' };
  const stored = new Map();
  globalThis.sessionStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key), clear: () => stored.clear() };
});
after(async () => { await server?.close(); delete globalThis.localStorage; delete globalThis.sessionStorage; });

const user = { id: 4, username: 'viewer', email: 'viewer@example.test', age: 25, profileComplete: true };
const session = { id: 42, date: '2030-01-01', time: '19:30', price: 12, seatsLeft: 20, isSoldOut: false,
  venue: { name: 'Venue' }, hall: { name: 'B' }, format: { name: '2D' }, language: { name: 'English' },
  movie: { title: 'Film', slug: 'film', ageRating: { minAge: 12 } } };
const options = { maxSeatsPerOrder: 6, ticketTypes: [{ id: 7, slug: 'adult', name: 'Adult', priceRatio: 1, blockedFromRatingAge: null }] };
const map = { sessionId: 42, sections: [{ name: 'Circle', rows: [{ label: 'J', seats: [
  { id: 11, code: 'J1', label: '1', state: 'held', isMine: true },
] }] }] };
const hold = { holdId: 'test-hold', sessionId: 42, expiresAt: '2099-01-01T12:08:00Z', isLive: true, subtotal: 12,
  seats: [{ seatId: 11, code: 'J1', ticketType: { slug: 'adult', name: 'Adult' }, price: 12 }] };

function capture(account, probe, initialEntry = '/sessions') {
  const query = new QueryClient();
  const router = createMemoryRouter([{ path: '*', element: React.createElement(probe) }], { initialEntries: [initialEntry] });
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: account, isLoading: false } },
      React.createElement(RouterProvider, { router }))));
  return { router, dispose() { query.clear(); router.dispose(); sessionStorage.clear(); } };
}

test('auth replay waits for success and preserves the exact booking action through login/register switching, once', () => {
  const replay = createAuthReplay();
  const action = { id: 42, origin: '/movies/film?date=2030-01-01' };
  const attempt = replay.request(action);
  assert.equal(replay.take(), null);
  // Switching the existing dialogs leaves this pending action untouched.
  assert(replay.approve(attempt));
  assert.equal(replay.take(), action);
  assert.equal(replay.take(), null);
  assert.equal(replay.approve(attempt), false);
});

test('cancelled authentication and late success cannot replay or approve a newer booking action', () => {
  const replay = createAuthReplay();
  const cancelled = replay.request({ id: 42 });
  replay.cancel();
  assert.equal(replay.approve(cancelled), false);
  assert.equal(replay.take(), null);
  const current = replay.request({ id: 43 });
  assert.equal(replay.approve(cancelled), false);
  assert.equal(replay.take(), null);
  replay.approve(current);
  assert.deepEqual(replay.take(), { id: 43 });
});

test('a 401 retry requires another successful authentication, without an automatic replay loop', () => {
  const replay = createAuthReplay();
  const action = { kind: 'hold' };
  replay.approve(replay.request(action));
  assert.equal(replay.take(), action);
  const retry = replay.request(action);
  assert.equal(replay.take(), null);
  replay.approve(retry);
  assert.equal(replay.take(), action);
  assert.equal(replay.take(), null);
});

test('hold creation is blocked before any POST for guests and incomplete profiles, even with selected seats', async () => {
  let calls = 0;
  client.defaults.adapter = async config => { calls++; return { data: { data: hold }, status: 201, headers: {}, config }; };
  for (const account of [null, { ...user, profileComplete: false }, { ...user, profileComplete: undefined }]) {
    let booking;
    const view = capture(account, function Probe() { booking = useBooking({ session, map, options }); return null; }, '/sessions/42');
    assert.equal(booking.selection.length, 1);
    await booking.proceed();
    assert.equal(calls, 0);
    view.dispose();
  }
});

test('eligible users still create/replace holds, return to seats, and submit the original order contract', async () => {
  const calls = [];
  client.defaults.adapter = async config => {
    calls.push({ method: config.method, url: config.url, body: JSON.parse(config.data) });
    return { data: { data: config.url === '/orders' ? { reference: 'KX-TEST' } : hold }, status: 201, headers: {}, config };
  };
  let booking;
  const view = capture(user, function Probe() { booking = useBooking({ session, map, options }); return null; }, '/sessions/42');
  await booking.proceed();
  booking.backToSeats();
  await booking.proceed();
  const fields = { fullName: 'Viewer', email: user.email, mobileNumber: '599123456', cardNumber: '4242424242424242', expiry: '09/30', cvv: '123' };
  await booking.pay(fields);
  assert.deepEqual(calls, [
    { method: 'post', url: '/sessions/42/holds', body: { seats: [{ seatId: 11, ticketType: 'adult' }] } },
    { method: 'post', url: '/sessions/42/holds', body: { seats: [{ seatId: 11, ticketType: 'adult' }] } },
    { method: 'post', url: '/orders', body: { ...fields, holdId: hold.holdId } },
  ]);
  view.dispose();
});

test('profile return link appears only after backend profileComplete becomes true and points to the intended session', () => {
  for (const profileComplete of [false, true]) {
    const query = new QueryClient();
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query },
      React.createElement(AuthContext.Provider, { value: { user: { ...user, profileComplete }, isLoading: false } },
        React.createElement(MemoryRouter, { initialEntries: [{ pathname: '/profile', state: { returnTo: '/sessions/42' } }] },
          React.createElement(Profile)))));
    assert.equal(html.includes('Continue your booking'), profileComplete);
    if (profileComplete) assert(html.includes('href="/sessions/42"'));
    query.clear();
  }
});
