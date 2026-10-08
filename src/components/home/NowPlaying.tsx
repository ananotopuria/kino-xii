import { Link } from "react-router-dom";
import { useNowPlaying } from "../../features/auth/movies/useNowPlaying";
import MovieCard from "./MovieCard";

const NowPlaying = () => {
  const { data, isLoading, isError, isFetching, refetch } = useNowPlaying();

  if (isLoading) {
    return <p className="px-4 py-10 sm:px-8 lg:px-15">Loading movies...</p>;
  }

  if (isError) {
    return <div role="alert" className="px-4 py-10 text-red-500 sm:px-8 lg:px-15">
      <p>Unable to load now playing movies.</p>
      <button type="button" disabled={isFetching} onClick={() => void refetch()} className="mt-2 cursor-pointer underline disabled:opacity-50">{isFetching ? "Retrying..." : "Retry"}</button>
    </div>;
  }

  const movies = data?.data ?? [];

  return (
    <section className="px-4 py-10 sm:px-8 lg:px-15">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">Now Playing</h2>

        <Link
          to="/sessions"
          className="cursor-pointer text-sm font-medium text-[#FF3217]"
        >
          See all
        </Link>
      </div>

      {movies.length === 0 ? <p role="status" className="text-sm text-white/60">No movies are playing right now. Please check back soon.</p> : <div role="region" aria-label="Now playing movies" tabIndex={0} className="flex gap-4 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-white">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>}
    </section>
  );
};

export default NowPlaying;
