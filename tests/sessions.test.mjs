import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, Sessions, useSessions, AuthContext, clearSessionsFilters, sessionsQuery, readSessionsParams, availableFormats;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ default: Sessions } = await server.ssrLoadModule('/src/pages/Sessions.tsx'));
  ({ useSessions } = await server.ssrLoadModule('/src/features/auth/movies/useSessions.ts'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  ({ clearSessionsFilters, sessionsQuery, readSessionsParams, availableFormats } = await server.ssrLoadModule('/src/utils/sessionFilters.ts'));
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });
const params = { date: '2026-10-08', venues: ['galleria'], formats: ['max'], languages: ['english'], bands: ['evening'], search: 'API Film', sort: 'price_desc', page: 3 };
const standard = { id: 1, slug: 'standard', name: 'Standard' };
const max = { id: 2, slug: 'max', name: 'MAX' };
const options = { venues: [{ id: 1, slug: 'galleria', name: 'Galleria', city: 'Tbilisi', formats: [max] }, { id: 2, slug: 'vake', name: 'Vake', city: 'Tbilisi', formats: [standard] }], formats: [standard, max], languages: [{ slug: 'english', name: 'English' }], timeBands: [{ id: 'evening', label: 'Evening' }], sorts: [{ id: 'price_desc', label: 'Price descending' }] };
const session = { id: 8, time: '19:30', price: 14.5, seatsLeft: 37, isSoldOut: false, hall: { name: 'B' }, venue: { name: 'Galleria' }, format: max, language: { name: 'English' } };
const response = { data: [{ movie: { id: 42, slug: 'api-film', title: 'API Film', posterUrl: '/poster.webp', runtimeMinutes: 123, ageRating: { code: '12+', minAge: 12 } }, sessions: [session] }], meta: { currentPage: 3, lastPage: 4, totalSessions: 77 } };
const makeQuery = () => {
  const query = new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
  query.setQueryData(['filter-options'], options);
  return query;
};
const render = (query, selected = params, component = Sessions) => renderToStaticMarkup(
  React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: null, isLoading: false } },
      React.createElement(MemoryRouter, { initialEntries: ['/sessions?' + sessionsQuery(selected)] }, React.createElement(component)))));

test('clear preserves date, search and sort; resets sidebar filters and pagination without mutating input', () => {
  const before = structuredClone(params);
  const cleared = clearSessionsFilters(params);
  assert.deepEqual(cleared, { ...params, venues: [], formats: [], languages: [], bands: [], page: 1 });
  assert.deepEqual(params, before);
  const url = sessionsQuery(cleared);
  assert.deepEqual([...url.keys()], ['date', 'search', 'sort', 'page']);
  assert.equal(url.get('date'), '2026-10-08');
  assert.deepEqual(readSessionsParams(url), cleared);
  assert(!sessionsQuery(clearSessionsFilters({ ...params, search: '' })).has('search'));
});

test('venue changes narrow formats, combining venues unions formats and clearing restores all options', () => {
  assert.deepEqual(availableFormats(options, ['galleria']), [max]);
  assert.deepEqual(availableFormats(options, ['vake']), [standard]);
  assert.deepEqual(availableFormats(options, ['galleria', 'vake']), [standard, max]);
  assert.deepEqual(availableFormats(options, clearSessionsFilters(params).venues), [standard, max]);
});

test('initial requests and a changed filter combination show skeletons without previous-query cards', () => {
  const query = makeQuery();
  const initial = render(query);
  assert(initial.includes('aria-label="Loading sessions"'));
  assert(initial.includes('motion-reduce:animate-none'));
  query.setQueryData(['sessions', params], response);
  assert(render(query).includes('37 left'));
  const changed = render(query, { ...params, date: '2026-10-09', page: 1 });
  assert(changed.includes('aria-label="Loading sessions"'));
  assert(!changed.includes('37 left') && !changed.includes('Showing 77 sessions'));
  query.clear();
});

test('unnormalized venue/format pairs cannot display cached results before cleanup', () => {
  const query = makeQuery();
  const invalid = { ...params, venues: ['vake'] };
  query.setQueryData(['sessions', invalid], response);
  const html = render(query, invalid);
  assert(html.includes('aria-label="Loading sessions"') && !html.includes('37 left'));
  query.clear();
});

test('failed refresh hides cached cards, totals and pagination and exposes Retry; empty success is distinct', async () => {
  const query = makeQuery();
  const queryKey = ['sessions', params];
  query.setQueryData(queryKey, response);
  await assert.rejects(query.fetchQuery({ queryKey, queryFn: async () => { throw new Error('Offline'); } }));
  const failed = render(query);
  assert(failed.includes('Failed to load sessions.') && failed.includes('Retry'));
  assert(!failed.includes('37 left') && !failed.includes('Showing 77 sessions') && !failed.includes('Sessions pagination'));
  assert(!failed.includes('No sessions match'));
  query.setQueryData(queryKey, { data: [], meta: { ...response.meta, totalSessions: 0, lastPage: 1 } });
  assert(render(query).includes('No sessions match your filters.'));
  query.clear();
});

test('refetch uses every current URL filter and renders seatsLeft directly from the response', async () => {
  const query = makeQuery();
  let result;
  let fail = true;
  const calls = [];
  client.defaults.adapter = async config => {
    assert.equal(config.url, '/sessions');
    calls.push(config.params.toString());
    if (fail) throw new Error('Offline');
    return { data: response, status: 200, headers: {}, config };
  };
  function Harness() { result = useSessions(params); return null; }
  render(query, params, Harness);
  await result.refetch();
  fail = false;
  await result.refetch();
  assert.deepEqual(calls, [sessionsQuery(params).toString(), sessionsQuery(params).toString()]);
  const html = render(query);
  assert(html.includes('37 left') && html.includes('ticket-green.svg'));
  assert(html.includes('Showing 77 sessions'));
  query.setQueryData(['sessions', params], { ...response, data: [{ ...response.data[0], sessions: [{ ...session, seatsLeft: 4 }] }] });
  assert(render(query).includes('4 left') && render(query).includes('ticket-red.svg'));
  query.setQueryData(['sessions', params], { ...response, data: [{ ...response.data[0], sessions: [{ ...session, isSoldOut: true }] }] });
  const soldOut = render(query);
  assert(soldOut.includes('Sold out') && !soldOut.includes('37 left'));
  assert.match(soldOut, /<button type="button" disabled=""[^>]*>/);
  query.clear();
});

test('cached sessions stay hidden until filter options are available for normalization', () => {
  const query = makeQuery();
  query.removeQueries({ queryKey: ['filter-options'] });
  query.setQueryData(['sessions', params], response);
  const html = render(query);
  assert(html.includes('aria-label="Loading sessions"') && !html.includes('37 left'));
  query.clear();
});
