import { useState } from "react";
import { useParams } from "react-router-dom";

import MovieHero from "../components/movie/MovieHero";
import MovieInfo from "../components/movie/MovieInfo";
import MovieSessions from "../components/movie/MovieSessions";
import { useMovie } from "../features/auth/movies/useMovie";

const MovieDetails = ({ movieSlug }: { movieSlug?: string }) => {
  const { slug = "" } = useParams<{ slug: string }>();

  const { data: movie, isLoading, isError } = useMovie(movieSlug ?? slug);

  const [selectedDate, setSelectedDate] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020817] pt-32 text-white">
        <p className="px-15">Loading movie...</p>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-[#020817] pt-32 text-white">
        <p className="px-15">Movie not found.</p>
      </div>
    );
  }

  const activeDate = selectedDate || movie.availableDates[0] || "";

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <MovieHero movie={movie} />

      <section className="grid grid-cols-[1fr_320px] gap-20 px-15 py-10">
        <MovieSessions
          slug={movie.slug}
          minAge={movie.ageRating.minAge}
          dates={movie.availableDates}
          selectedDate={activeDate}
          onSelectDate={setSelectedDate}
        />

        <MovieInfo movie={movie} />
      </section>
    </main>
  );
};

export default MovieDetails;
