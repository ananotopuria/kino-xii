import { Link } from "react-router-dom";
import { useNowPlaying } from "../../features/auth/movies/useNowPlaying";
import MovieCard from "./MovieCard";

const NowPlaying = () => {
  const { data, isLoading, isError } = useNowPlaying();

  if (isLoading) {
    return <p className="px-15 py-10">Loading movies...</p>;
  }

  if (isError) {
    return <p className="px-15 py-10 text-red-500">Failed to load movies.</p>;
  }

  const movies = data?.data ?? [];

  return (
    <section className="px-15 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">Now Playing</h2>

        <Link
          to="/sessions"
          className="cursor-pointer text-sm font-medium text-[#FF3217]"
        >
          See all
        </Link>
      </div>

      <div className="flex gap-4 overflow-hidden">
        {movies.slice(0, 6).map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};

export default NowPlaying;
