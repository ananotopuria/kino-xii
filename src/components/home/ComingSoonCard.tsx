import type { Movie } from "../../types/movie";

type ComingSoonCardProps = {
  movie: Movie;
};

const ComingSoonCard = ({ movie }: ComingSoonCardProps) => {
  const releaseDate = new Date(movie.releaseDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="flex w-117.5 shrink-0 gap-3 rounded-[20px] bg-[#1E2031] p-3">
      <img
        src={movie.posterUrl}
        alt={movie.title}
        className="h-34 w-25 shrink-0 rounded-[14px] object-cover"
      />

      <div className="flex flex-1 flex-col justify-between py-1">
        <div>
          <h3 className="text-lg font-extrabold text-white">{movie.title}</h3>

          <p className="mt-1 text-xs text-white/60">
            {movie.genres[0]?.name ?? "Film"} · {movie.runtimeMinutes} min
          </p>

          <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500">
            {movie.ageRating.code}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white">{releaseDate}</p>

          <button
            type="button"
            className="cursor-pointer rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Notify Me
          </button>
        </div>
      </div>
    </article>
  );
};

export default ComingSoonCard;
