import type { MovieDetails } from "../../types/movie";

type MovieHeroProps = {
  movie: MovieDetails;
};

const MovieHero = ({ movie }: MovieHeroProps) => {
  return (
    <section
      className="relative min-h-140 bg-cover bg-center"
      style={{
        backgroundImage: `url(${movie.backdropUrl})`,
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex min-h-140 items-end gap-8 px-15 pb-10 pt-32">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-91.25 w-62.5 rounded-xl object-cover"
        />

        <div className="max-w-xl pb-4">
          <span className="text-xs font-semibold uppercase text-[#EC3013]">
            {movie.isComingSoon ? "Coming Soon" : "Now Playing"}
          </span>

          <h1 className="mt-4 text-4xl font-bold uppercase">{movie.title}</h1>

          <p className="mt-4 text-sm leading-6 text-white/90">
            {movie.synopsis}
          </p>

          <div className="mt-5 flex items-center gap-3 text-xs">
            <span className="rounded-full bg-[#EC3013]/20 px-3 py-1 text-[#EC3013]">
              {movie.ageRating.code}
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1">
              {movie.runtimeMinutes} Min
            </span>

            {movie.formats.map((format) => (
              <span
                key={format.id}
                className="rounded-full bg-white/15 px-3 py-1"
              >
                {format.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovieHero;
