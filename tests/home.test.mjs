import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, api, client, Hero, NowPlaying;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  api = await server.ssrLoadModule('/src/api/movies.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ default: Hero } = await server.ssrLoadModule('/src/components/home/Hero.tsx'));
  ({ default: NowPlaying } = await server.ssrLoadModule('/src/components/home/NowPlaying.tsx'));
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const movie = (id) => ({
  id, slug: `film/${id}`, title: `API Film ${id}`, synopsis: `API synopsis ${id}`,
  backdropUrl: `/backdrop-${id}.webp`, posterUrl: `/poster-${id}.webp`,
  runtimeMinutes: 123, fromPrice: 14.5, ageRating: { code: '12+', description: 'API rating note' },
  genres: [{ name: 'Drama' }], formats: [{ id: 1, name: 'API Format' }],
});
const render = (component, query) => renderToStaticMarkup(
  React.createElement(QueryClientProvider, { client: query },
    React.createElement(MemoryRouter, null, React.createElement(component))),
);
const queryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });

test('featured and now-playing use their API endpoints and preserve synopsis and prices', async () => {
  const signal = new AbortController().signal;
  const calls = [];
  const payload = { data: [movie(1)] };
  client.defaults.adapter = async config => {
    calls.push(config);
    return { data: payload, status: 200, headers: {}, config };
  };
  assert.deepEqual(await api.getFeaturedMovies(signal), payload);
  assert.deepEqual(await api.getNowPlaying(), payload);
  assert.equal(calls[0].url, '/movies/featured');
  assert.equal(calls[0].method, 'get');
  assert.equal(calls[0].signal, signal);
  assert.equal(calls[1].url, '/movies/now-playing');
});

test('hero limits previews to four API films, exposes one active slide, and uses actual slugs', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'featured'], { data: [1, 2, 3, 4, 5].map(movie) });
  const html = render(Hero, query);
  assert(html.includes('API Film 1') && html.includes('API synopsis 1'));
  assert(html.includes('src="/backdrop-1.webp"') && html.includes('API Format'));
  assert(html.includes('href="/movies/film%2F1"'));
  assert(html.includes('Featured movie 1 of 4'));
  assert.equal((html.match(/inert=""/g) ?? []).length, 3);
  assert(!html.includes('API Film 5') && !html.includes('the-odyssey'));
  query.clear();
});

test('hero handles one film and missing backdrop without fabricated content', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'featured'], { data: [{ ...movie(2), backdropUrl: null }] });
  const html = render(Hero, query);
  assert(html.includes('Featured movie 1 of 1'));
  assert(html.includes('src="/poster-2.webp"'));
  assert(!html.includes('inert=""'));
  query.clear();
});

test('hero provides distinct loading, empty, and retryable error states without fake films', async () => {
  const query = queryClient();
  const loading = render(Hero, query);
  assert(loading.includes('Loading featured movies...') && loading.includes('min-h-170'));
  assert(!loading.includes('Buy tickets'));
  query.setQueryData(['movies', 'featured'], { data: [] });
  const empty = render(Hero, query);
  assert(empty.includes('No featured movies available right now.'));
  assert(empty.includes('href="/sessions"') && !empty.includes('Buy tickets'));
  await assert.rejects(query.fetchQuery({ queryKey: ['movies', 'featured'], queryFn: async () => { throw new Error('Offline'); } }));
  const error = render(Hero, query);
  assert(error.includes('Unable to load featured movies.') && error.includes('Retry'));
  assert(!error.includes('Buy tickets'));
  query.clear();
});

test('Now Playing exposes details links, Sessions See All, real synopsis, and unchanged lari price', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'now-playing'], { data: [movie(7)] });
  const html = render(NowPlaying, query);
  assert(html.includes('href="/movies/film%2F7"') && html.includes('Buy Ticket'));
  assert(html.includes('href="/sessions"') && html.includes('See all'));
  assert(html.includes('API synopsis 7'));
  assert(html.includes('₾14.5') && !html.includes('€'));
  query.clear();
});
