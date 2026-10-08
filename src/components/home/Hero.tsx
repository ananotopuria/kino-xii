import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useFeaturedMovies } from "../../features/auth/movies/useFeaturedMovies";
import type { MovieWithSynopsis } from "../../types/movie";

const FeaturedPreview = ({ movies }: { movies: MovieWithSynopsis[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (movies.length < 2 || hovered || focused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % movies.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [movies.length, hovered, focused, activeIndex]);

  return (
    <section
      aria-label="Featured movies"
      className="relative min-h-170 overflow-hidden bg-[#020817]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      {movies.map((movie, index) => (
        <img
          key={movie.id}
          src={movie.backdropUrl || movie.posterUrl}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-[#020817] via-transparent to-transparent" />

      {/* Overlapping cells reserve the tallest slide's space to prevent rotation layout shifts. */}
      <div className="relative z-10 grid min-h-170 items-center px-4 pt-44 pb-24 sm:px-8 sm:pt-25 lg:px-15">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            aria-hidden={index !== activeIndex}
            inert={index !== activeIndex}
            className={`col-start-1 row-start-1 min-w-0 max-w-155 wrap-break-word transition-opacity duration-700 motion-reduce:transition-none ${index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#FF3217]">
              Featured · Now Playing
            </p>
            <h1 className="text-5xl font-extrabold uppercase leading-none text-white">
              {movie.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span
                title={movie.ageRating.description}
                className="rounded-full bg-[#FF3217]/20 px-3 py-1 text-[#FF3217]"
              >
                {movie.ageRating.code}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-white backdrop-blur-sm">
                <Clock3 size={16} aria-hidden="true" />
                {movie.runtimeMinutes} min
              </span>
              {movie.formats.map((format) => (
                <span
                  key={format.id}
                  className="rounded-full bg-white/15 px-3 py-1 text-white"
                >
                  {format.name}
                </span>
              ))}
            </div>
            {movie.synopsis && (
              <p className="mt-5 max-w-140 text-sm leading-6 text-white/75">
                {movie.synopsis}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to={`/movies/${encodeURIComponent(movie.slug)}`}
                className="rounded-full bg-[#FF3217] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#E82B13]"
              >
                Buy tickets
              </Link>
              <Link
                to="/sessions"
                className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                All sessions
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-4 bottom-8 left-4 z-10 flex items-center gap-5 sm:right-8 sm:left-8 lg:right-15 lg:left-15">
        <div
          className="flex min-w-0 flex-1 gap-1"
          role="img"
          aria-label={`Featured movie ${activeIndex + 1} of ${movies.length}`}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className={`h-0.75 flex-1 transition-colors duration-700 motion-reduce:transition-none ${index === activeIndex ? "bg-[#FF3217]" : "bg-white/60"}`}
            />
          ))}
        </div>
        {movies.length > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Previous featured movie"
              onClick={() =>
                setActiveIndex(
                  (index) => (index - 1 + movies.length) % movies.length,
                )
              }
              className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next featured movie"
              onClick={() =>
                setActiveIndex((index) => (index + 1) % movies.length)
              }
              className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

const Hero = () => {
  const featured = useFeaturedMovies();
  const movies = featured.data?.data.slice(0, 4) ?? [];

  if (featured.isPending) {
    return (
      <section
        aria-label="Featured movies"
        aria-busy="true"
        className="relative flex min-h-170 items-center bg-[#020817] px-15 pt-25 pb-24"
      >
        <span role="status" className="sr-only">
          Loading featured movies...
        </span>
        <div
          aria-hidden="true"
          className="w-full max-w-155 animate-pulse space-y-5 motion-reduce:animate-none"
        >
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-14 w-3/4 rounded bg-white/15" />
          <div className="h-6 w-1/2 rounded bg-white/10" />
          <div className="h-24 rounded bg-white/10" />
          <div className="h-12 w-72 rounded-full bg-white/15" />
        </div>
      </section>
    );
  }

  if (featured.isError || movies.length === 0) {
    return (
      <section
        aria-label="Featured movies"
        className="flex min-h-170 items-center bg-[#020817] px-15 pt-25 pb-24 text-white"
      >
        <div role={featured.isError ? "alert" : "status"} className="max-w-155">
          <h1 className="text-2xl font-extrabold">
            {featured.isError
              ? "Unable to load featured movies."
              : "No featured movies available right now."}
          </h1>
          <p className="mt-4 text-sm text-white/60">
            {featured.isError
              ? "Please try again or browse all sessions."
              : "Browse all sessions to find your next film."}
          </p>
          <div className="mt-7 flex gap-3">
            {featured.isError && (
              <button
                type="button"
                disabled={featured.isFetching}
                onClick={() => void featured.refetch()}
                className="cursor-pointer rounded-full bg-[#FF3217] px-6 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-50"
              >
                {featured.isFetching ? "Retrying..." : "Retry"}
              </button>
            )}
            <Link
              to="/sessions"
              className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold"
            >
              All sessions
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Restart only when the featured list changes, not on every background refetch.
  return (
    <FeaturedPreview
      key={movies.map((movie) => movie.id).join(",")}
      movies={movies}
    />
  );
};

export default Hero;
