import { useComingSoon } from "../../features/auth/movies/useComingSoon";
import ComingSoonCard from "./ComingSoonCard";

const ComingSoon = () => {
  const { data, isLoading, isError } = useComingSoon();

  if (isLoading) {
    return <p className="px-15 py-10">Loading movies...</p>;
  }

  if (isError) {
    return (
      <p className="px-15 py-10 text-red-500">
        Failed to load coming soon movies.
      </p>
    );
  }

  const movies = data?.data ?? [];

  return (
    <section className="px-15 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold uppercase">Coming Soon...</h2>

        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-[#FF3217]"
        >
          See all
        </button>
      </div>

      <div className="flex gap-4 overflow-hidden">
        {movies.map((movie) => (
          <ComingSoonCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};

export default ComingSoon;
