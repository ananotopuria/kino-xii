import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

let server, history, stored;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  history = await server.ssrLoadModule('/src/features/movies/recentlyViewed.ts');
});
beforeEach(() => {
  stored = new Map();
  globalThis.localStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
  // Change the serialized value so the store also resets after fallback tests.
  stored.set(history.RECENTLY_VIEWED_KEY, '[]');
  history.getRecentlyViewed();
  stored.clear();
  history.getRecentlyViewed();
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const movie = (id, overrides = {}) => ({
  id, slug: `film-${id}`, title: `Film ${id}`, posterUrl: `/poster-${id}.webp`, runtimeMinutes: 120,
  genres: [{ id: 1, slug: 'drama', name: 'Drama' }, { id: 2, slug: 'action', name: 'Action' }],
  ageRating: { code: '12+', minAge: 12, description: 'Age twelve and above' },
  synopsis: 'Do not persist full details', availableDates: ['2030-01-01'],
  isNotified: true, fromPrice: 10, ...overrides,
});

test('records newest first and persists only card fields, without authentication or an API request', () => {
  history.recordRecentlyViewed(movie(1));
  history.recordRecentlyViewed(movie(2));
  const saved = JSON.parse(stored.get(history.RECENTLY_VIEWED_KEY));
  assert.deepEqual(saved.map(item => item.id), [2, 1]);
  assert.deepEqual(saved[0], {
    id: 2, slug: 'film-2', title: 'Film 2', posterUrl: '/poster-2.webp', runtimeMinutes: 120,
    genres: [{ name: 'Drama' }], ageRating: { code: '12+' },
  });
  assert.deepEqual(history.parseRecentlyViewed(JSON.stringify(saved)), saved);
  assert.equal(stored.size, 1);
});

test('reopening a movie moves it to the front and refreshes card data without duplicates', () => {
  history.recordRecentlyViewed(movie(1));
  history.recordRecentlyViewed(movie(2));
  history.recordRecentlyViewed(movie(1, { title: 'Updated title' }));
  history.recordRecentlyViewed(movie(1, { title: 'Updated title' }));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [1, 2]);
  assert.equal(history.getRecentlyViewed()[0].title, 'Updated title');
  history.recordRecentlyViewed(movie(1, { slug: 'renamed-film' }));
  assert.equal(history.getRecentlyViewed().length, 2);
  history.recordRecentlyViewed(movie(3, { slug: 'renamed-film' }));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [3, 2]);
});

test('retains only the bounded number of newest movies when writing and reading', () => {
  for (let id = 1; id <= history.RECENTLY_VIEWED_LIMIT + 3; id++) history.recordRecentlyViewed(movie(id));
  assert.equal(history.getRecentlyViewed().length, history.RECENTLY_VIEWED_LIMIT);
  assert.equal(history.getRecentlyViewed().at(-1).id, 4);
  assert.equal(JSON.parse(stored.get(history.RECENTLY_VIEWED_KEY)).length, history.RECENTLY_VIEWED_LIMIT);
  const oversized = Array.from({ length: 20 }, (_, index) => movie(index + 1));
  assert.equal(history.parseRecentlyViewed(JSON.stringify(oversized)).length, history.RECENTLY_VIEWED_LIMIT);
});

test('malformed storage is ignored; invalid entries are skipped and duplicates are removed', () => {
  for (const raw of [null, '', '{broken', 'null', '{}', '42', '"string"']) {
    assert.deepEqual(history.parseRecentlyViewed(raw), []);
  }
  const malformed = [null, 42, {}, movie(3, { id: '3' }), movie(4, { slug: '' }),
    movie(5, { genres: null }), movie(6, { genres: [null] }), movie(7, { ageRating: null }),
    movie(8, { runtimeMinutes: -1 }), movie(9, { title: {} }), movie(10, { posterUrl: [] })];
  const parsed = history.parseRecentlyViewed(JSON.stringify([movie(1), ...malformed, movie(1), movie(2)]));
  assert.deepEqual(parsed.map(item => item.id), [1, 2]);
  stored.set(history.RECENTLY_VIEWED_KEY, '{broken');
  assert.doesNotThrow(() => history.recordRecentlyViewed(movie(11)));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [11]);
});

test('restores persisted history and supplies a stable snapshot until storage changes', () => {
  stored.set(history.RECENTLY_VIEWED_KEY, JSON.stringify([movie(4), movie(3)]));
  const first = history.getRecentlyViewed();
  assert.deepEqual(first.map(item => item.id), [4, 3]);
  assert.equal(history.getRecentlyViewed(), first);
  stored.set(history.RECENTLY_VIEWED_KEY, JSON.stringify([movie(5)]));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [5]);
  stored.clear();
  assert.deepEqual(history.getRecentlyViewed(), []);
});

test('storage read/write failures never interrupt viewing and retain in-memory history', () => {
  history.recordRecentlyViewed(movie(1));
  globalThis.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.doesNotThrow(() => history.recordRecentlyViewed(movie(2)));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [2, 1]);
  globalThis.localStorage.getItem = () => { throw new Error('Storage blocked'); };
  assert.doesNotThrow(() => history.recordRecentlyViewed(movie(3)));
  assert.deepEqual(history.getRecentlyViewed().map(item => item.id), [3, 2, 1]);
});

test('subscribers receive same-tab and cross-tab updates, and can unsubscribe', () => {
  const target = new EventTarget();
  globalThis.window = target;
  try {
    let updates = 0;
    const unsubscribe = history.subscribeToRecentlyViewed(() => { updates++; });
    history.recordRecentlyViewed(movie(1));
    assert.equal(updates, 1);
    const storageEvent = key => Object.assign(new Event('storage'), { key });
    target.dispatchEvent(storageEvent('token'));
    assert.equal(updates, 1);
    stored.set(history.RECENTLY_VIEWED_KEY, JSON.stringify([movie(2)]));
    target.dispatchEvent(storageEvent(history.RECENTLY_VIEWED_KEY));
    assert.equal(updates, 2);
    assert.equal(history.getRecentlyViewed()[0].id, 2);
    target.dispatchEvent(storageEvent(null));
    assert.equal(updates, 3);
    unsubscribe();
    history.recordRecentlyViewed(movie(3));
    target.dispatchEvent(storageEvent(history.RECENTLY_VIEWED_KEY));
    assert.equal(updates, 3);
  } finally {
    delete globalThis.window;
  }
});

test('recent cards render stored metadata and navigate by slug for guests and signed-in users', async () => {
  const { RecentlyViewedCard } = await server.ssrLoadModule('/src/components/home/RecentlyViewed.tsx');
  const { AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts');
  const recent = movie(1, { slug: 'film/one' });
  const render = user => renderToStaticMarkup(React.createElement(AuthContext.Provider, { value: { user } },
    React.createElement(MemoryRouter, null, React.createElement(RecentlyViewedCard, { movie: recent }))));
  const guest = render(null);
  assert.equal(render({ id: 42 }), guest);
  assert(guest.includes('href="/movies/film%2Fone"'));
  assert(guest.includes('src="/poster-1.webp"'));
  assert(guest.includes('Film 1') && guest.includes('Drama · 120 min') && guest.includes('12+'));
  assert(!guest.includes('Buy Ticket') && !guest.includes('Notify Me'));
  assert(!guest.includes('Do not persist full details'));
});

test('empty history renders no section or placeholder', async () => {
  const { default: RecentlyViewed } = await server.ssrLoadModule('/src/components/home/RecentlyViewed.tsx');
  assert.equal(renderToStaticMarkup(React.createElement(RecentlyViewed)), '');
});
