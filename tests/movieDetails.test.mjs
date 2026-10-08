import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let server, client, nextSevenDates, DatePicker, MovieInfo, MovieSessions, MovieDetails, useMovieSessions, AuthContext;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  ({ apiClient: client } = await server.ssrLoadModule('/src/api/client.ts'));
  ({ nextSevenDates } = await server.ssrLoadModule('/src/utils/sessionFilters.ts'));
  ({ default: DatePicker } = await server.ssrLoadModule('/src/components/movie/DatePicker.tsx'));
  ({ default: MovieInfo } = await server.ssrLoadModule('/src/components/movie/MovieInfo.tsx'));
  ({ default: MovieSessions } = await server.ssrLoadModule('/src/components/movie/MovieSessions.tsx'));
  ({ default: MovieDetails } = await server.ssrLoadModule('/src/pages/MovieDetails.tsx'));
  ({ useMovieSessions } = await server.ssrLoadModule('/src/features/auth/movies/useMovieSessions.ts'));
  ({ AuthContext } = await server.ssrLoadModule('/src/features/auth/AuthContext.ts'));
  globalThis.localStorage = { getItem: () => null };
});
after(async () => { await server?.close(); delete globalThis.localStorage; });

const dates = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'];
const movie = { id: 42, slug: 'api-film', title: 'API Film', synopsis: 'API synopsis', director: 'API Director', cast: 'API Cast',
  posterUrl: '/poster.webp', backdropUrl: '/backdrop.webp', runtimeMinutes: 123, fromPrice: 14.5,
  releaseDate: '2026-09-01', isComingSoon: false, availableDates: ['2026-10-07', '2026-11-20'],
  ageRating: { code: '12+', minAge: 12, description: 'API note' }, formats: [{ id: 1, name: 'IMAX' }],
  genres: [{ id: 7, name: 'API Genre One' }, { id: 9, name: 'API Genre Two' }] };
const group = { venue: { id: 1, name: 'API Venue', city: 'Tbilisi' }, sessions: [
  { id: 8, time: '19:30', price: 14.5, seatsLeft: 4, isSoldOut: false, hall: { id: 2, name: 'B' },
    venue: { id: 1, name: 'API Venue' }, format: { name: 'IMAX' }, language: { name: 'Georgian' } },
] };
const makeQuery = () => new QueryClient({ defaultOptions: { queries: { retry: false, retryOnMount: false } } });
const render = (component, query, props = {}) => renderToStaticMarkup(
  React.createElement(QueryClientProvider, { client: query },
    React.createElement(AuthContext.Provider, { value: { user: null, isLoading: false } },
      React.createElement(MemoryRouter, null, React.createElement(component, props)))));
const sessionProps = date => ({ slug: movie.slug, minAge: 12, dates, selectedDate: date, onSelectDate() {} });

test('movie details distinguish 404 from network/server errors and Retry recovers the same movie query', async () => {
  const queryKey = ['movie', movie.slug, null];
  for (const status of [404, 500, undefined]) {
    const query = makeQuery();
    const failure = { isAxiosError: true, response: status ? { status } : undefined };
    await assert.rejects(query.fetchQuery({ queryKey, queryFn: async () => { throw failure; } }));
    let tree;
    function Capture() { tree = MovieDetails({ movieSlug: movie.slug }); return tree; }
    const html = render(Capture, query);
    assert.equal(html.includes('Movie not found.'), status === 404);
    assert.equal(html.includes('Unable to load this movie.'), status !== 404);
    assert(html.includes('Retry'));
    let calls = 0;
    client.defaults.adapter = async config => {
      calls++;
      assert.equal(config.url, `/movies/${movie.slug}`);
      return { data: { data: movie }, status: 200, headers: {}, config };
    };
    React.Children.toArray(tree.props.children).find(child => child.type === 'button').props.onClick();
    await query.fetchQuery({ queryKey });
    assert.equal(calls, 1);
    assert.deepEqual(query.getQueryData(queryKey), movie);
    query.clear();
  }
});

test('the selector generates exactly today plus six calendar days without mutating the base date', () => {
  const base = new Date(2026, 9, 5, 23, 59);
  const original = base.getTime();
  assert.deepEqual(nextSevenDates(base), dates);
  assert.equal(base.getTime(), original);
});

test('the seven-day window handles month, year and leap-day boundaries', () => {
  assert.deepEqual(nextSevenDates(new Date(2026, 11, 29)), [
    '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04',
  ]);
  assert.deepEqual(nextSevenDates(new Date(2028, 1, 27)), [
    '2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02', '2028-03-03', '2028-03-04',
  ]);
});

test('local dates stay consecutive across positive/negative UTC offsets and spring/fall DST changes', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['Asia/Tbilisi', 'America/New_York', 'Pacific/Auckland']) {
      process.env.TZ = timezone;
      for (const hour of [0, 23]) {
        assert.deepEqual(nextSevenDates(new Date(2026, 2, 7, hour, 30)), [
          '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13',
        ], timezone);
        assert.deepEqual(nextSevenDates(new Date(2026, 9, 31, hour, 30)), [
          '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06',
        ], timezone);
      }
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('date buttons retain weekday/day display, expose selection, and pass the exact API date to the existing query', async () => {
  let selectedDate = dates[0];
  const picker = DatePicker({ dates, selectedDate, onSelect: date => { selectedDate = date; } });
  const buttons = picker.props.children;
  assert.equal(buttons.length, 7);
  assert.equal(buttons[0].props['aria-pressed'], true);
  assert.equal(buttons[1].props['aria-pressed'], false);
  buttons[3].props.onClick();
  assert.equal(selectedDate, '2026-10-08');
  const html = renderToStaticMarkup(picker);
  assert(html.includes('Mon') && html.includes('>5</span>'));
  assert(html.includes('Monday, October 5, 2026'));
  assert(!html.includes('Today'));

  const query = makeQuery();
  let result;
  client.defaults.adapter = async config => {
    assert.equal(config.url, '/movies/api-film/sessions');
    assert.deepEqual(config.params, { date: selectedDate });
    return { data: { data: [group] }, status: 200, headers: {}, config };
  };
  function Harness() { result = useMovieSessions(movie.slug, selectedDate); return null; }
  render(Harness, query);
  await result.refetch();
  assert.deepEqual(query.getQueryData(['movie-sessions', movie.slug, selectedDate]), [group]);
  query.clear();
});

test('different dates and movie slugs retain separate TanStack Query cache entries', async () => {
  const query = makeQuery();
  let result;
  let activeSlug = movie.slug;
  let selectedDate = dates[0];
  const calls = [];
  client.defaults.adapter = async config => {
    calls.push([config.url, config.params.date]);
    return { data: { data: config.params.date === dates[0] ? [group] : [] }, status: 200, headers: {}, config };
  };
  function Harness() { result = useMovieSessions(activeSlug, selectedDate); return null; }
  render(Harness, query);
  await result.refetch();
  selectedDate = dates[1];
  render(Harness, query);
  await result.refetch();
  activeSlug = 'other-film';
  render(Harness, query);
  await result.refetch();
  assert.deepEqual(calls, [['/movies/api-film/sessions', dates[0]], ['/movies/api-film/sessions', dates[1]], ['/movies/other-film/sessions', dates[1]]]);
  assert.deepEqual(query.getQueryData(['movie-sessions', movie.slug, dates[0]]), [group]);
  assert.deepEqual(query.getQueryData(['movie-sessions', movie.slug, dates[1]]), []);
  assert.deepEqual(query.getQueryData(['movie-sessions', 'other-film', dates[1]]), []);
  query.clear();
});

test('genres come from the movie response in the existing Details metadata list', () => {
  const html = renderToStaticMarkup(React.createElement(MovieInfo, { movie }));
  assert(html.includes('Genres') && html.includes('API Genre One, API Genre Two'));
  assert(html.includes('API Director') && html.includes('API Cast'));
  assert(!renderToStaticMarkup(React.createElement(MovieInfo, { movie: { ...movie, genres: [] } })).includes('Genres'));
});

test('Movie Details starts at today and renders all seven days even when availableDates is sparse or empty', (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 5, 10).getTime() });
  const query = makeQuery();
  query.setQueryData(['movie-sessions', movie.slug, dates[0]], []);
  query.setQueryData(['movie-sessions', movie.slug, '2026-10-07'], [group]);
  for (const availableDates of [movie.availableDates, []]) {
    query.setQueryData(['movie', movie.slug, null], { ...movie, availableDates });
    const html = render(MovieDetails, query, { movieSlug: movie.slug });
    assert.equal((html.match(/aria-pressed=/g) ?? []).length, 7);
    assert(html.includes('aria-pressed="true" aria-label="Monday, October 5, 2026"'));
    assert(html.includes('Sunday, October 11, 2026'));
    assert(html.includes('No sessions available for this date.'));
    assert(!html.includes('API Venue'));
  }
  query.clear();
});

test('new dates show loading then an empty state without the previous date’s sessions or changing selection', () => {
  const query = makeQuery();
  query.setQueryData(['movie-sessions', movie.slug, dates[0]], [group]);
  const loaded = render(MovieSessions, query, sessionProps(dates[0]));
  for (const text of ['API Venue', 'Hall B', 'IMAX', 'Georgian', '19:30', '14.5']) assert(loaded.includes(text));
  const loading = render(MovieSessions, query, sessionProps(dates[1]));
  assert(loading.includes('Loading sessions...') && !loading.includes('API Venue'));
  for (const response of [[], [{ ...group, sessions: [] }]]) {
    query.setQueryData(['movie-sessions', movie.slug, dates[1]], response);
    const empty = render(MovieSessions, query, sessionProps(dates[1]));
    assert(empty.includes('No sessions available for this date.') && !empty.includes('API Venue'));
    assert(empty.includes('aria-pressed="true" aria-label="Tuesday, October 6, 2026"'));
  }
  query.clear();
});

test('failed session requests offer Retry and hide cached session groups until recovery', async () => {
  const query = makeQuery();
  const queryKey = ['movie-sessions', movie.slug, dates[0]];
  query.setQueryData(queryKey, [group]);
  await assert.rejects(query.fetchQuery({ queryKey, queryFn: async () => { throw new Error('Offline'); } }));
  const failed = render(MovieSessions, query, sessionProps(dates[0]));
  assert(failed.includes('Failed to load sessions.') && failed.includes('Retry'));
  assert(!failed.includes('API Venue'));
  query.setQueryData(queryKey, [group]);
  assert(render(MovieSessions, query, sessionProps(dates[0])).includes('API Venue'));
  query.clear();
});

test('Coming Soon details respect the API empty sessions response without fabricating cards', (context) => {
  context.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 5, 10).getTime() });
  const query = makeQuery();
  query.setQueryData(['movie', movie.slug, null], { ...movie, isComingSoon: true, availableDates: [] });
  query.setQueryData(['movie-sessions', movie.slug, dates[0]], []);
  const html = render(MovieDetails, query, { movieSlug: movie.slug });
  assert(html.includes('No sessions available for this date.'));
  assert(!html.includes('API Venue') && !html.includes('19:30'));
  query.clear();
});
