import { useEffect, useEffectEvent, useRef, useState } from "react";
import { isAxiosError } from "axios";
import LoginModal from "../../features/auth/LoginModal";
import RegisterModal from "../../features/auth/RegisterModal";
import { useAuth } from "../../features/auth/useAuth";
import { useNotifyMovie } from "../../features/auth/movies/useNotifyMovie";
import type { Movie } from "../../types/movie";

type ComingSoonCardProps = {
  movie: Movie;
};

const ComingSoonCard = ({ movie }: ComingSoonCardProps) => {
  const { user } = useAuth();
  const notify = useNotifyMovie();
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const [notice, setNotice] = useState("");
  const pendingSlug = useRef<string | null>(null);
  const locked = useRef(false);

  const subscribe = async () => {
    if (!movie.isComingSoon || locked.current) return;
    locked.current = true;
    setNotice("");
    try {
      await notify.mutateAsync(movie.slug);
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          pendingSlug.current = movie.slug;
          setAuthModal("login");
          return;
        }
        setNotice(error.response?.data?.message ?? (error.response?.status === 404
          ? "This movie is no longer available."
          : "Unable to subscribe. Please try again."));
      } else {
        setNotice("Unable to subscribe. Please try again.");
      }
    } finally {
      locked.current = false;
    }
  };

  const resume = useEffectEvent(async () => {
    if (!user || !pendingSlug.current) return;
    const slug = pendingSlug.current;
    pendingSlug.current = null;
    if (slug === movie.slug) await subscribe();
  });
  useEffect(() => { void resume(); }, [user]);

  const closeAuth = () => {
    pendingSlug.current = null;
    setAuthModal(null);
  };

  const releaseDate = new Date(movie.releaseDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
    <article inert={Boolean(authModal)} className="flex w-117.5 shrink-0 gap-3 rounded-[20px] bg-[#1E2031] p-3">
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

          {movie.isComingSoon && <button
            type="button"
            onClick={() => void subscribe()}
            disabled={notify.isPending}
            aria-busy={notify.isPending}
            aria-live="polite"
            className="cursor-pointer rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            {movie.isNotified || notify.isSuccess ? "Notified" : "Notify Me"}
          </button>}
        </div>
        {notice && <p role="alert" className="mt-2 text-xs font-semibold text-[#EC3013]">{notice}</p>}
      </div>
    </article>
    {authModal === "login" && <LoginModal onClose={closeAuth} onSuccess={() => setAuthModal(null)} onSignUp={() => setAuthModal("signup")} />}
    {authModal === "signup" && <RegisterModal onClose={closeAuth} onSuccess={() => setAuthModal(null)} onLogIn={() => setAuthModal("login")} />}
    </>
  );
};

export default ComingSoonCard;
