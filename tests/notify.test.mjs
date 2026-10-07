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

const captureMutation = (query, ownerId = 4) => {
  let mutation;
  function Harness() { mutation = useNotifyMovie(); return null; }
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query }, React.createElement(AuthContext.Provider, { value: { user: { id: ownerId } } }, React.createElement(Harness))));
  return mutation;
};

test('successful mutations update subscription state without replacing movie details or suppressing repeat requests', async () => {
  const query = new QueryClient();
  const other = { ...movie, id: 43, slug: 'other-film' };
  const details = { ...movie, synopsis: 'Keep this synopsis', availableDates: [] };
  query.setQueryData(['movies', 'coming-soon', 4], { data: [movie, other] });
  query.setQueryData(['movie', movie.slug, 4], details);
  let calls = 0;
  client.defaults.adapter = async config => { calls++; return success(config); };
  const mutation = captureMutation(query);
  await mutation.mutateAsync(movie.slug);
  await mutation.mutateAsync(movie.slug);
  assert.equal(calls, 2);
  assert.deepEqual(query.getQueryData(['movies', 'coming-soon', 4]), { data: [{ ...movie, isNotified: true }, other] });
  assert.deepEqual(query.getQueryData(['movie', movie.slug, 4]), { ...details, isNotified: true });
  query.clear();
});

test('401, 404 and API/network errors remain catchable, do not retry automatically, and preserve movie data', async () => {
  const query = new QueryClient();
  query.setQueryData(['movie', movie.slug, 4], movie);
  query.setQueryData(['movies', 'coming-soon', 4], { data: [movie] });
  const mutation = captureMutation(query);
  for (const status of [401, 404, 500, undefined]) {
    let calls = 0;
    const failure = { isAxiosError: true, response: status ? { status, data: { message: 'API refusal' } } : undefined };
    client.defaults.adapter = async () => { calls++; throw failure; };
    await assert.rejects(mutation.mutateAsync(movie.slug), error => error === failure);
    assert.equal(calls, 1);
    assert.deepEqual(query.getQueryData(['movie', movie.slug, 4]), movie);
    assert.deepEqual(query.getQueryData(['movies', 'coming-soon', 4]), { data: [movie] });
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

test('a late notification response updates only its initiating account, preserving other accounts and public caches', async () => {
  const query = new QueryClient();
  for (const owner of [4, 5, null]) {
    query.setQueryData(['movies', 'coming-soon', owner], { data: [movie] });
    query.setQueryData(['movie', movie.slug, owner], movie);
  }
  query.setQueryData(['movies', 'now-playing'], { data: [{ id: 99 }] });
  let finish;
  client.defaults.adapter = config => new Promise(resolve => { finish = () => resolve(success(config)); });
  const pending = captureMutation(query, 4).mutateAsync(movie.slug);
  await new Promise(resolve => setImmediate(resolve));
  captureMutation(query, 5);
  finish(); await pending;
  assert.equal(query.getQueryData(['movies', 'coming-soon', 4]).data[0].isNotified, true);
  for (const owner of [5, null]) {
    assert.equal(query.getQueryData(['movies', 'coming-soon', owner]).data[0].isNotified, false);
    assert.equal(query.getQueryData(['movie', movie.slug, owner]).isNotified, false);
  }
  assert.deepEqual(query.getQueryData(['movies', 'now-playing']), { data: [{ id: 99 }] });
  query.clear();
});

test('Notify Me rejects rapid duplicate clicks while its request is pending', async () => {
  const query = new QueryClient();
  let click, calls = 0, finish;
  function findButton(node) {
    if (!React.isValidElement(node)) return;
    if (node.type === 'button' && node.props['aria-busy'] !== undefined) return node;
    return React.Children.toArray(node.props.children).map(findButton).find(Boolean);
  }
  client.defaults.adapter = config => { calls++; return new Promise(resolve => { finish = () => resolve(success(config)); }); };
  renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: { id: 4 } } }, React.createElement(function Probe() {
      const tree = ComingSoonCard({ movie });
      click = findButton(tree).props.onClick;
      return tree;
    }))));
  click(); click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  finish();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(query.getMutationCache().getAll()[0].state.status, 'success');
  query.clear();
});
