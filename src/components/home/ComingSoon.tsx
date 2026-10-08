import { useState } from "react";
import { useComingSoon } from "../../features/auth/movies/useComingSoon";
import ComingSoonCard from "./ComingSoonCard";

const ComingSoon = () => {
  const { data, isLoading, isError, isFetching, refetch } = useComingSoon();
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return <p className="px-4 py-10 sm:px-8 lg:px-15">Loading movies...</p>;
  }

  if (isError) {
    return (
      <div role="alert" className="px-4 py-10 text-red-500 sm:px-8 lg:px-15">
        <p>Unable to load coming soon movies.</p>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="mt-2 cursor-pointer underline disabled:opacity-50"
        >
          {isFetching ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  const movies = data?.data ?? [];

  return (
    <section className="px-4 py-10 sm:px-8 lg:px-15">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">Coming Soon...</h2>

        {movies.length > 0 && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="coming-soon-movies"
            onClick={() => setExpanded((value) => !value)}
            className="cursor-pointer text-sm font-medium text-[#FF3217]"
          >
            {expanded ? "Show less" : "See all"}
          </button>
        )}
      </div>

      {movies.length === 0 ? (
        <p role="status" className="text-sm text-white/60">
          No upcoming movies have been announced yet. Please check back soon.
        </p>
      ) : (
        <div
          id="coming-soon-movies"
          role="region"
          aria-label="Coming soon movies"
          tabIndex={0}
          className={`flex gap-4 pb-2 focus-visible:outline-2 focus-visible:outline-white ${
            expanded ? "flex-wrap" : "hide-scrollbar overflow-x-auto"
          }`}
        >
          {movies.map((movie) => (
            <ComingSoonCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ComingSoon;
