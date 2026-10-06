import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SessionsFilters from "../components/sessions/SessionsFilters";
import SessionsSkeleton from "../components/sessions/SessionsSkeleton";
import SessionCard from "../components/movie/SessionCard";
import { useFilterOptions } from "../features/auth/filters/useFilterOptions";
import { useSessions } from "../features/auth/movies/useSessions";
import type { SessionFilterKey, SessionsParams } from "../types/sessions";
import {
  availableFormats,
  clearSessionsFilters,
  paginationItems,
  readSessionsParams,
  sessionsQuery,
} from "../utils/sessionFilters";

const Sessions = () => {
  const [query, setQuery] = useSearchParams();
  const filters = useFilterOptions();
  const params = readSessionsParams(query);
  const formats = filters.data
    ? availableFormats(filters.data, params.venues)
    : undefined;
  const validFormats = formats
    ? params.formats.filter((slug) =>
        formats.some((format) => format.slug === slug),
      )
    : params.formats;
  const needsFormatCleanup = validFormats.length !== params.formats.length;
  const normalized = sessionsQuery({
    ...params,
    formats: validFormats,
    page: needsFormatCleanup ? 1 : params.page,
  }).toString();
  const currentQuery = query.toString();

  // Normalize deep links before fetching, including incompatible venue/format pairs.
  useEffect(() => {
    if (currentQuery !== normalized) setQuery(normalized, { replace: true });
  }, [currentQuery, normalized, setQuery]);

  const sessions = useSessions(
    params,
    Boolean(filters.data) && currentQuery === normalized,
  );
  const update = (changes: Partial<SessionsParams>) => {
    const next = { ...params, ...changes, page: 1 };
    if (filters.data) {
      const supported = availableFormats(filters.data, next.venues);
      next.formats = next.formats.filter((slug) =>
        supported.some((format) => format.slug === slug),
      );
    }
    setQuery(sessionsQuery(next));
  };
  const toggle = (key: SessionFilterKey, value: string) =>
    update({
      [key]: params[key].includes(value)
        ? params[key].filter((item) => item !== value)
        : [...params[key], value],
    });
  const clear = () => setQuery(sessionsQuery(clearSessionsFilters(params)));
  const resultsReady =
    Boolean(filters.data) &&
    currentQuery === normalized &&
    !filters.isError &&
    sessions.isSuccess;
  const meta = resultsReady ? sessions.data.meta : undefined;
  const loading =
    filters.isLoading ||
    (!filters.isError &&
      Boolean(filters.data) &&
      (currentQuery !== normalized || sessions.isPending));

  return (
    <div className="min-h-screen bg-[#070c1c] px-4 pt-44 pb-24 text-white sm:px-8 sm:pt-40 lg:px-12.75 lg:pt-[117.5px] lg:pb-40">
      <div className="mx-auto max-w-[1626px]">
        <div className="mb-9">
          <h1 className="text-2xl font-extrabold leading-[1.1]">Sessions</h1>
          <p className="mt-1.5 text-sm leading-[1.3] text-[#a9a9a9]">
            Browse showtimes across all venues
          </p>
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12.75">
          <SessionsFilters
            options={filters.data}
            isLoading={filters.isLoading}
            isError={filters.isError}
            onRetry={() => {
              void filters.refetch();
            }}
            params={params}
            onToggle={toggle}
            onSelectDate={(date) => update({ date })}
            onClear={clear}
          />
          <section
            aria-label="Sessions results"
            aria-busy={loading || sessions.isFetching}
            className="min-w-0 flex-1"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 text-sm">
              <p aria-live="polite" className="font-semibold">
                {meta
                  ? `Showing ${meta.totalSessions} sessions`
                  : loading
                    ? "Loading sessions..."
                    : "Sessions"}
              </p>
              {filters.data && (
                <label className="flex min-w-0 items-center gap-2">
                  <span className="text-[#a9a9a9]">Sort:</span>
                  <span className="relative min-w-0">
                    <select
                      aria-label="Sort sessions"
                      value={params.sort}
                      onChange={(event) => update({ sort: event.target.value })}
                      className="max-w-full cursor-pointer appearance-none bg-transparent py-1 pr-6 font-extrabold outline-offset-4"
                    >
                      {filters.data.sorts.map((sort) => (
                        <option
                          className="bg-[#1e2031]"
                          key={sort.id}
                          value={sort.id}
                        >
                          {sort.label}
                        </option>
                      ))}
                    </select>
                    <img
                      src="/sessions/arrow.svg"
                      alt=""
                      className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2"
                    />
                  </span>
                </label>
              )}
            </div>
            {loading && <SessionsSkeleton />}
            {!loading && sessions.isError && (
              <p role="alert" className="text-sm text-red-400">
                Failed to load sessions.{" "}
                <button
                  type="button"
                  disabled={sessions.isFetching}
                  onClick={() => {
                    void sessions.refetch();
                  }}
                  className="cursor-pointer underline"
                >
                  {sessions.isFetching ? "Retrying..." : "Retry"}
                </button>
              </p>
            )}
            {resultsReady && sessions.data.data.length === 0 && (
              <p role="status" className="py-8 text-sm text-[#a9a9a9]">
                No sessions match your filters.
              </p>
            )}
            <div className="space-y-8">
              {resultsReady && sessions.data.data.map(({ movie, sessions: movieSessions }) => (
                <article
                  key={movie.id}
                  className="min-w-0 border-b border-[#2a2c3d] pb-8 last:border-0 last:pb-0"
                >
                  <Link
                    to={`/movies/${movie.slug}`}
                    className="mb-3.5 flex w-fit items-center gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="h-20 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-extrabold leading-tight">
                          {movie.title}
                        </h2>
                        <span className="rounded-full bg-[#ec3013]/10 px-2 py-1 text-xs font-semibold leading-none text-[#ec3013]">
                          {movie.ageRating.code}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-[1.3] text-[#a9a9a9]">
                        {movie.runtimeMinutes} min
                      </p>
                    </div>
                  </Link>
                  <div
                    role="region"
                    aria-label={`${movie.title} showtimes`}
                    tabIndex={0}
                    className="flex gap-3 overflow-x-auto pb-1 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    {movieSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        variant="listing"
                        minAge={movie.ageRating.minAge}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </div>
            {meta && meta.lastPage > 1 && (
              <nav
                aria-label="Sessions pagination"
                className="mt-13 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={meta.currentPage <= 1}
                  onClick={() =>
                    setQuery(
                      sessionsQuery({ ...params, page: meta.currentPage - 1 }),
                    )
                  }
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#1e2031] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <img src="/sessions/chevron.svg" alt="" />
                </button>
                {paginationItems(meta.currentPage, meta.lastPage).map((page) =>
                  typeof page === "number" ? (
                    <button
                      type="button"
                      key={page}
                      aria-label={`Page ${page}`}
                      aria-current={
                        page === meta.currentPage ? "page" : undefined
                      }
                      onClick={() =>
                        setQuery(sessionsQuery({ ...params, page }))
                      }
                      className={`size-10 cursor-pointer rounded-full text-sm ${page === meta.currentPage ? "bg-[#ec3013] text-white" : "text-[#a9a9a9] hover:bg-[#1e2031]"}`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={page}
                      className="flex size-10 items-center justify-center text-[#a9a9a9]"
                    >
                      …
                    </span>
                  ),
                )}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() =>
                    setQuery(
                      sessionsQuery({ ...params, page: meta.currentPage + 1 }),
                    )
                  }
                  className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#1e2031] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <img
                    src="/sessions/chevron.svg"
                    alt=""
                    className="rotate-180"
                  />
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
