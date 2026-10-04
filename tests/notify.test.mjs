import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, notifyMovie, useNotifyMovie, ComingSoonCard, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ notifyMovie } = await server.ssrLoadModule('/src/api/movies.ts'));
  ({ useNotifyMovie } = await server.ssrLoadModule('/src/features/auth/movies/useNotifyMovie.ts'));
  ({ default: ComingSoonCard } = await server.ssrLoadModule('/src/components/home/ComingSoonCard.tsx'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  globalThis.localStorage = { getItem: () => 'test-token' };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const movie = {
  id: 42, slug: 'coming-film', title: 'Coming Film', releaseDate: '2030-01-01',
  posterUrl: '/poster.webp', genres: [], runtimeMinutes: 100, ageRating: { code: '12+' },
  isComingSoon: true, isNotified: false,
};
const success = config => ({ data: { data: { movieId: movie.id, subscribed: true } }, status: 201, headers: {}, config });

test('notify POST uses an encoded slug, no body, and existing bearer authentication; repeats succeed', async () => {
  let calls = 0;
  client.defaults.adapter = async config => {
    calls++;
    assert.equal(config.method, 'post');
    assert.equal(config.url, '/movies/coming%2Ffilm/notify');
    assert.equal(config.data, undefined);
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    return success(config);
  };
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await notifyMovie('coming/film'), { movieId: 42, subscribed: true });
  }
  assert.equal(calls, 2);
});

const captureMutation = query => {
  let mutation;
  function Harness() { mutation = useNotifyMovie(); return null; }
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query }, React.createElement(Harness)));
  return mutation;
};

test('successful mutations update subscription state without replacing movie details or suppressing repeat requests', async () => {
  const query = new QueryClient();
  const other = { ...movie, id: 43, slug: 'other-film' };
  const details = { ...movie, synopsis: 'Keep this synopsis', availableDates: [] };
  query.setQueryData(['movies', 'coming-soon'], { data: [movie, other] });
  query.setQueryData(['movie', movie.slug], details);
  let calls = 0;
  client.defaults.adapter = async config => { calls++; return success(config); };
  const mutation = captureMutation(query);
  await mutation.mutateAsync(movie.slug);
  await mutation.mutateAsync(movie.slug);
  assert.equal(calls, 2);
  assert.deepEqual(query.getQueryData(['movies', 'coming-soon']), { data: [{ ...movie, isNotified: true }, other] });
  assert.deepEqual(query.getQueryData(['movie', movie.slug]), { ...details, isNotified: true });
  query.clear();
});

test('401, 404 and API/network errors remain catchable, do not retry automatically, and preserve movie data', async () => {
  const query = new QueryClient();
  query.setQueryData(['movie', movie.slug], movie);
  query.setQueryData(['movies', 'coming-soon'], { data: [movie] });
  const mutation = captureMutation(query);
  for (const status of [401, 404, 500, undefined]) {
    let calls = 0;
    const failure = { isAxiosError: true, response: status ? { status, data: { message: 'API refusal' } } : undefined };
    client.defaults.adapter = async () => { calls++; throw failure; };
    await assert.rejects(mutation.mutateAsync(movie.slug), error => error === failure);
    assert.equal(calls, 1);
    assert.deepEqual(query.getQueryData(['movie', movie.slug]), movie);
    assert.deepEqual(query.getQueryData(['movies', 'coming-soon']), { data: [movie] });
  }
  query.clear();
});

test('existing card uses API coming-soon and subscribed flags without disabling an existing subscription', () => {
  const query = new QueryClient();
  const render = value => renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: null } }, React.createElement(ComingSoonCard, { movie: value }))));
  assert(render(movie).includes('Notify Me'));
  const subscribed = render({ ...movie, isNotified: true });
  assert(subscribed.includes('Notified'));
  assert(!subscribed.includes('disabled=""'));
  assert(!render({ ...movie, isComingSoon: false }).includes('<button'));
  query.clear();
});
