import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, api, client, Hero, NowPlaying, ComingSoon, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  api = await server.ssrLoadModule('/src/api/movies.ts');
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ default: Hero } = await server.ssrLoadModule('/src/components/home/Hero.tsx'));
  ({ default: NowPlaying } = await server.ssrLoadModule('/src/components/home/NowPlaying.tsx'));
  ({ default: ComingSoon } = await server.ssrLoadModule('/src/components/home/ComingSoon.tsx'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
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
    React.createElement(AuthContext.Provider, { value: { user: null, isLoading: false } },
      React.createElement(MemoryRouter, null, React.createElement(component)))),
);
const queryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });

for (const catalogue of ['now-playing', 'coming-soon']) {
  test(`${catalogue} distinguishes loading/empty/error and Retry refetches its own endpoint`, async () => {
    const query = queryClient();
    const Component = catalogue === 'now-playing' ? NowPlaying : ComingSoon;
    const queryKey = catalogue === 'now-playing' ? ['movies', catalogue] : ['movies', catalogue, null];
    assert(render(Component, query).includes('Loading movies...'));
    query.setQueryData(queryKey, { data: [] });
    const empty = render(Component, query);
    assert(empty.includes(catalogue === 'now-playing' ? 'No movies are playing' : 'No upcoming movies'));
    await assert.rejects(query.fetchQuery({ queryKey, queryFn: async () => { throw new Error('Offline'); } }));
    let tree;
    function Capture() { tree = Component(); return tree; }
    const failed = render(Capture, query);
    assert(failed.includes('Unable to load') && failed.includes('Retry'));
    let calls = 0;
    client.defaults.adapter = async config => {
      calls++;
      assert.equal(config.url, `/movies/${catalogue}`);
      return { data: { data: [movie(99)] }, status: 200, headers: {}, config };
    };
    const retry = React.Children.toArray(tree.props.children).find(child => child.type === 'button');
    retry.props.onClick();
    await query.fetchQuery({ queryKey });
    assert.equal(calls, 1);
    assert(render(Component, query).includes('API Film 99'));
    query.clear();
  });
}

test('catalogue rows retain every returned movie, including titles beyond the first six', () => {
  const query = queryClient();
  const movies = Array.from({ length: 9 }, (_, index) => movie(index + 1));
  query.setQueryData(['movies', 'now-playing'], { data: movies });
  query.setQueryData(['movies', 'coming-soon', null], { data: movies });
  for (const Component of [NowPlaying, ComingSoon]) {
    const html = render(Component, query);
    assert.equal((html.match(/<article/g) ?? []).length, 9);
    assert(html.includes('API Film 9'));
  }
  query.clear();
});

test('Coming Soon expands and collapses in place while retaining movie cards and Notify Me', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'coming-soon', null], { data: [1, 2, 3].map(id => ({
    ...movie(id), isComingSoon: true, releaseDate: '2030-01-01',
  })) });
  function findToggle(node) {
    if (!React.isValidElement(node)) return;
    if (node.props['aria-controls'] === 'coming-soon-movies') return node;
    return React.Children.toArray(node.props.children).map(findToggle).find(Boolean);
  }
  for (const clicks of [0, 1, 2]) {
    let remaining = clicks;
    function Capture() {
      const tree = ComingSoon();
      // Exercise the real handler through React's render-phase state updates,
      // without introducing a DOM or browser dependency for this toggle.
      if (remaining > 0) { remaining--; findToggle(tree).props.onClick(); }
      return tree;
    }
    const html = render(Capture, query);
    assert(html.includes(`aria-expanded="${clicks === 1}"`));
    assert(html.includes(clicks === 1 ? 'Show less' : 'See all'));
    assert.equal((html.match(/<article/g) ?? []).length, 3);
    assert.equal((html.match(/Notify Me/g) ?? []).length, 3);
    assert(!html.includes('href="/coming-soon"'));
  }
  query.clear();
});

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

function findElement(node, predicate) {
  if (!React.isValidElement(node)) return;
  if (predicate(node)) return node;
  return React.Children.toArray(node.props.children).map(child => findElement(child, predicate)).find(Boolean);
}

test('hero previous/next wrap and keep the active slide and progress synchronized', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'featured'], { data: [1, 2, 3].map(movie) });
  for (const [direction, clicks, expected] of [['Previous', 1, 3], ['Next', 1, 2], ['Next', 3, 1]]) {
    let remaining = clicks;
    function Capture() {
      const preview = Hero();
      const tree = preview.type(preview.props);
      if (remaining > 0) {
        remaining--;
        findElement(tree, node => node.props['aria-label'] === `${direction} featured movie`).props.onClick();
      }
      return tree;
    }
    const html = render(Capture, query);
    assert(html.includes(`Featured movie ${expected} of 3`));
    const active = html.match(/<div aria-hidden="false"[\s\S]*?<\/h1>/)?.[0];
    assert(active?.includes(`API Film ${expected}`));
    assert.equal((html.match(/inert=""/g) ?? []).length, 2);
  }
  query.clear();
});

test('Now Playing pointer and keyboard activation expand exactly one card and preserve movie links', () => {
  const query = queryClient();
  query.setQueryData(['movies', 'now-playing'], { data: [1, 2, 3].map(movie) });
  for (const interaction of ['initial', 'mouse', 'focus', 'touch']) {
    let activated = false;
    function Capture() {
      const tree = NowPlaying();
      if (!activated && interaction !== 'initial') {
        activated = true;
        const card = findElement(tree, node => node.props.movie?.id === 3);
        const article = card.type(card.props);
        if (interaction === 'focus') article.props.onFocus();
        else article.props.onPointerEnter({ pointerType: interaction });
      }
      return tree;
    }
    const html = render(Capture, query);
    const activeId = ['mouse', 'focus'].includes(interaction) ? 3 : 1;
    assert.equal((html.match(/lg:w-117.5/g) ?? []).length, 1);
    assert(html.includes(`srcSet="/backdrop-${activeId}.webp"`));
    assert.equal((html.match(/<article/g) ?? []).length, 3);
    for (const id of [1, 2, 3]) assert(html.includes(`href="/movies/film%2F${id}"`));
  }
  query.clear();
});
