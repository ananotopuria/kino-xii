import type { Movie } from "../../types/movie";

type MovieCardProps = {
  movie: Movie;
};

const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <article className="w-65 shrink-0 rounded-[20px] bg-[#1E2031] p-3">
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="h-75 w-full rounded-[14px] object-cover"
      />

      <div className="mt-3">
        <h3 className="truncate text-base font-semibold text-white">
          {movie.title}
        </h3>

        <p className="mt-1 text-xs text-white/60">
          {movie.genres[0]?.name ?? "Film"} · {movie.runtimeMinutes} min
        </p>

        <span className="mt-3 inline-block rounded-full bg-red-950 px-2 py-1 text-xs font-semibold text-red-500">
          {movie.ageRating.code}
        </span>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-white">From € {movie.fromPrice}</p>

          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#FF3217] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#e82b13]"
          >
            Buy Ticket
          </button>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
