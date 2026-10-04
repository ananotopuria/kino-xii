import { Link } from "react-router-dom";
import type { RecentlyViewedMovie } from "../../features/movies/recentlyViewed";
import { useRecentlyViewed } from "../../features/movies/useRecentlyViewed";

export const RecentlyViewedCard = ({ movie }: { movie: RecentlyViewedMovie }) => (
  <Link
    to={`/movies/${encodeURIComponent(movie.slug)}`}
    className="flex h-22 w-82.5 shrink-0 items-center gap-3 rounded-2xl bg-[#1E2031] p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
  >
    <img
      src={movie.posterUrl}
      alt={movie.title}
      className="h-17 w-22 shrink-0 rounded-lg object-cover"
    />
    <div className="min-w-0">
      <h3 className="truncate text-sm font-extrabold uppercase text-white">
        {movie.title}
      </h3>
      <p className="mt-1 truncate text-xs leading-4 text-[#A9A9A9]">
        {movie.genres[0]?.name ?? "Film"} · {movie.runtimeMinutes} min
      </p>
      <span className="mt-1 inline-block rounded-full bg-[#EC3013]/10 px-2 py-0.5 text-xs font-semibold leading-4 text-[#EC3013]">
        {movie.ageRating.code}
      </span>
    </div>
  </Link>
);

const RecentlyViewed = () => {
  const movies = useRecentlyViewed();
  if (movies.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="border-b border-[#2A2C3D] px-15 py-10">
      <h2 id="recently-viewed-heading" className="mb-5 text-2xl font-extrabold text-white">
        Recently viewed
      </h2>
      <div className="flex gap-5 overflow-x-auto">
        {movies.map((movie) => <RecentlyViewedCard key={movie.id} movie={movie} />)}
      </div>
    </section>
  );
};

export default RecentlyViewed;
