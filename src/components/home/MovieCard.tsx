import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { MovieWithSynopsis } from "../../types/movie";

type MovieCardProps = {
  movie: MovieWithSynopsis;
  active: boolean;
  onActivate: () => void;
};

const MovieCard = ({ movie, active, onActivate }: MovieCardProps) => {
  return (
    <article
      tabIndex={0}
      aria-label={movie.title}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onActivate();
      }}
      onFocus={onActivate}
      onTransitionEnd={(event) => {
        if (
          active &&
          event.target === event.currentTarget &&
          event.propertyName === "width"
        ) {
          const card = event.currentTarget;
          const row = card.parentElement;
          if (!row) return;
          const bounds = card.getBoundingClientRect();
          const viewport = row.getBoundingClientRect();
          const offset =
            bounds.left < viewport.left
              ? bounds.left - viewport.left
              : bounds.right > viewport.right
                ? bounds.right - viewport.right
                : 0;
          if (offset) row.scrollBy({ left: offset, behavior: "instant" });
        }
      }}
      className={`flex w-65 shrink-0 flex-col rounded-[20px] bg-[#1E2031] p-3 transition-[width] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-white ${active ? "lg:w-117.5" : "lg:w-65"}`}
    >
      <picture>
        {active && (
          <source
            media="(min-width: 1024px)"
            srcSet={movie.backdropUrl || movie.posterUrl}
          />
        )}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-75 w-full rounded-[14px] object-cover"
        />
      </picture>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="truncate text-base font-semibold text-white">
          {movie.title}
        </h3>

        <p className="mt-1 flex flex-wrap items-center gap-1 wrap-break-word text-xs text-white/60">
          {movie.genres[0]?.name ?? "Film"} ·{" "}
          <Clock3 size={12} aria-hidden="true" /> {movie.runtimeMinutes} min
        </p>

        <span className="mt-3 self-start rounded-full bg-red-950 px-2 py-1 text-xs font-semibold text-red-500">
          {movie.ageRating.code}
        </span>

        {movie.synopsis && (
          <p
            className={`mt-3 line-clamp-3 text-xs leading-5 text-white/60 ${active ? "" : "lg:hidden"}`}
            title={movie.synopsis}
          >
            {movie.synopsis}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="text-xs text-white">From ₾{movie.fromPrice}</p>

          <Link
            to={`/movies/${encodeURIComponent(movie.slug)}`}
            className="cursor-pointer rounded-full bg-[#FF3217] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#e82b13]"
          >
            Buy Ticket
          </Link>
        </div>
      </div>
    </article>
  );
};

export default MovieCard;
