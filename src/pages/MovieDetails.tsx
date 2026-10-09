import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useParams } from "react-router-dom";

import MovieHero from "../components/movie/MovieHero";
import MovieInfo from "../components/movie/MovieInfo";
import MovieSessions from "../components/movie/MovieSessions";
import { useMovie } from "../features/auth/movies/useMovie";
import { recordRecentlyViewed } from "../features/movies/recentlyViewed";
import { nextSevenDates } from "../utils/sessionFilters";

const MovieDetails = ({ movieSlug }: { movieSlug?: string }) => {
  const { slug = "" } = useParams<{ slug: string }>();

  const activeSlug = movieSlug ?? slug;
  const {
    data: movie,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useMovie(activeSlug);

  const [selectedDate, setSelectedDate] = useState("");
  const recordedSlug = useRef<string | null>(null);

  useEffect(() => {
    // Count each opened route once, including cached details. Background
    // refetches and Strict Mode must not reorder history as new views.
    if (recordedSlug.current !== activeSlug) recordedSlug.current = null;
    if (!movie || isLoading || isError || recordedSlug.current === activeSlug)
      return;
    recordRecentlyViewed(movie);
    recordedSlug.current = activeSlug;
  }, [activeSlug, movie, isLoading, isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020817] px-4 pt-44 text-white sm:px-8 sm:pt-32 lg:px-15">
        <p>Loading movie...</p>
      </div>
    );
  }

  if (isError || !movie) {
    const notFound = isAxiosError(error) && error.response?.status === 404;
    return (
      <div
        role="alert"
        className="min-h-screen bg-[#020817] px-4 pt-44 text-white sm:px-8 sm:pt-32 lg:px-15"
      >
        <p>
          {notFound
            ? "Movie not found."
            : "Unable to load this movie. Please try again."}
        </p>
        <button
          type="button"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="mt-3 cursor-pointer underline disabled:opacity-50"
        >
          {isFetching ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  const dates = nextSevenDates();
  const activeDate = dates.includes(selectedDate) ? selectedDate : dates[0];

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <MovieHero movie={movie} />

      <section className="grid min-w-0 grid-cols-1 gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20 lg:px-15 *:min-w-0 *:wrap-break-word">
        <MovieSessions
          slug={movie.slug}
          minAge={movie.ageRating.minAge}
          dates={dates}
          selectedDate={activeDate}
          onSelectDate={setSelectedDate}
        />

        <MovieInfo movie={movie} />
      </section>
    </main>
  );
};

export default MovieDetails;
