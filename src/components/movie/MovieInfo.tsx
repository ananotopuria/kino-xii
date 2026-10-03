import type { MovieDetails } from "../../types/movie";

type MovieInfoProps = {
  movie: MovieDetails;
};

const MovieInfo = ({ movie }: MovieInfoProps) => {
  return (
    <aside>
      <h2 className="text-2xl font-bold">Details</h2>

      <div className="mt-6 space-y-5 text-sm">
        <div>
          <p className="text-xs uppercase text-white/40">Director</p>
          <p className="mt-1">{movie.director}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-white/40">Main Cast</p>
          <p className="mt-1">{movie.cast}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-white/40">Duration</p>
          <p className="mt-1">{movie.runtimeMinutes} minutes</p>
        </div>

        <div>
          <p className="text-xs uppercase text-white/40">Release Date</p>
          <p className="mt-1">{movie.releaseDate}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-white/40">Formats</p>
          <p className="mt-1">
            {movie.formats.map((format) => format.name).join(", ")}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase text-white/40">From</p>
          <p className="mt-1">₾{movie.fromPrice}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-orange-950/30 p-4">
        <p className="text-xs font-semibold uppercase text-orange-400">
          Rating Note
        </p>

        <p className="mt-2 text-xs leading-5 text-orange-300">
          {movie.ageRating.code} · {movie.ageRating.description}
        </p>
      </div>
    </aside>
  );
};

export default MovieInfo;
