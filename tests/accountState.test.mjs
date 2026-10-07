import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, restoreSession, AuthProvider, AuthContext, MovieHero, ProfileMenu, filterOptionsQuery;
const storage = new Map();
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ restoreSession } = await server.ssrLoadModule('/src/features/auth/restoreSession.ts'));
  ({ AuthProvider } = await server.ssrLoadModule('/src/features/auth/AuthProvider.tsx'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  ({ default: MovieHero } = await server.ssrLoadModule('/src/components/movie/MovieHero.tsx'));
  ({ default: ProfileMenu } = await server.ssrLoadModule('/src/components/layout/ProfileMenu.tsx'));
  ({ filterOptionsQuery } = await server.ssrLoadModule('/src/features/auth/filters/useFilterOptions.ts'));
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });
function provider() {
  let value;
  renderToStaticMarkup(React.createElement(function Probe() { const tree = AuthProvider({ children: null }); value = tree.props.value; return tree; }));
  return value;
}

test('/me 401 clears stale token, but network/500 retain it and offer a recoverable result', async () => {
  for (const status of [401, 500, undefined]) {
    storage.set('token', 'valid-until-server-says-otherwise');
    client.defaults.adapter = async () => { throw { isAxiosError: true, response: status ? { status } : undefined }; };
    assert.equal((await restoreSession()).kind, status === 401 ? 'guest' : 'unavailable');
    await provider().retryRestore();
    assert.equal(storage.has('token'), status !== 401);
  }
});

test('session restoration accepts only server-returned user and does not request /me without a token', async () => {
  let calls = 0;
  const user = { id: 4, username: 'viewer', profileComplete: true };
  client.defaults.adapter = async config => { calls++; return { data: { data: user }, status: 200, headers: {}, config }; };
  storage.clear();
  assert.equal((await restoreSession()).kind, 'guest');
  assert.equal(calls, 0);
  storage.set('token', 'token');
  assert.deepEqual(await restoreSession(), { kind: 'authenticated', user });
});

test('logout deduplicates simultaneous requests and clears local auth even when the API fails', async () => {
  let calls = 0, reject;
  client.defaults.adapter = async () => { calls++; return new Promise((_resolve, fail) => { reject = fail; }); };
  storage.set('token', 'token');
  const auth = provider();
  const first = auth.signOut();
  const second = auth.signOut();
  assert.equal(first, second);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  reject(new Error('offline'));
  await assert.rejects(first);
  assert.equal(storage.has('token'), false);
});

test('late /me cannot overwrite a new successful login', async () => {
  let resolveMe;
  storage.set('token', 'old-token');
  client.defaults.adapter = async config => config.url === '/me'
    ? new Promise(resolve => { resolveMe = () => resolve({ data: { data: { id: 1 } }, status: 200, headers: {}, config }); })
    : { data: { data: { token: 'new-token', user: { id: 2 } } }, status: 200, headers: {}, config };
  const auth = provider();
  const restoring = auth.retryRestore();
  await new Promise(resolve => setImmediate(resolve));
  await auth.signIn({ email: 'test@example.test', password: 'abc' });
  resolveMe(); await restoring;
  assert.equal(storage.get('token'), 'new-token');
});

test('detail status reflects Coming Soon and Now Playing API state', () => {
  for (const isComingSoon of [true, false]) {
    const html = renderToStaticMarkup(React.createElement(MovieHero, { movie: { title: 'Film', posterUrl: '/poster', formats: [], ageRating: { code: 'PG' }, isComingSoon } }));
    assert(html.includes(isComingSoon ? 'Coming Soon' : 'Now Playing'));
    assert(!html.includes(isComingSoon ? 'Now Playing' : 'Coming Soon'));
  }
});

test('closed account-menu trigger shows backend-driven green or yellow completion indicator', () => {
  for (const profileComplete of [true, false]) {
    const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { id: 4, username: 'viewer', profileComplete } } }, React.createElement(MemoryRouter, null, React.createElement(ProfileMenu))));
    assert(html.includes(profileComplete ? 'aria-label="Profile complete"' : 'aria-label="Profile incomplete"'));
    assert(html.includes(profileComplete ? 'bg-[#4ade80]' : 'bg-[#facc15]'));
  }
});

test('startup and consumers share one indefinitely cached filter configuration and deduplicate requests', async () => {
  const query = new QueryClient();
  let calls = 0;
  client.defaults.adapter = async config => { calls++; return { data: { data: { maxSeatsPerOrder: 6 } }, status: 200, headers: {}, config }; };
  await Promise.all([query.prefetchQuery(filterOptionsQuery), query.fetchQuery(filterOptionsQuery)]);
  await query.fetchQuery(filterOptionsQuery);
  assert.equal(calls, 1);
  assert.equal(query.getQueryCache().getAll().length, 1);
  assert.equal(filterOptionsQuery.staleTime, Infinity);
  assert.equal(filterOptionsQuery.gcTime, Infinity);
  query.clear();
});

test('logout pending label remains visible on the account trigger even when its menu is closed', () => {
  const html = renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user: { id: 4, username: 'viewer', profileComplete: true }, isSigningOut: true } }, React.createElement(MemoryRouter, null, React.createElement(ProfileMenu))));
  assert.match(html, /role="status"[^>]*>Logging out\.\.\./);
});
