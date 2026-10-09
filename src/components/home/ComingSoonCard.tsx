import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { MdOutlineNotificationsActive } from "react-icons/md";

import LoginModal from "../../features/auth/LoginModal";
import RegisterModal from "../../features/auth/RegisterModal";
import { useAuth } from "../../features/auth/useAuth";
import { useNotifyMovie } from "../../features/auth/movies/useNotifyMovie";
import { useAuthReplay } from "../../features/auth/useAuthReplay";

import type { Movie } from "../../types/movie";

type ComingSoonCardProps = {
  movie: Movie;
};

const ComingSoonCard = ({ movie }: ComingSoonCardProps) => {
  const { user } = useAuth();
  const notify = useNotifyMovie();

  const auth = useAuthReplay<string>(async (slug) => {
    if (slug === movie.slug) await subscribe();
  });

  const { authModal, setAuthModal, cancelAuth: closeAuth } = auth;

  const [notice, setNotice] = useState("");
  const locked = useRef(false);

  async function subscribe() {
    if (!movie.isComingSoon || locked.current) return;

    if (!user) {
      auth.requestLogin(movie.slug);
      return;
    }

    locked.current = true;
    setNotice("");

    try {
      await notify.mutateAsync(movie.slug);
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          auth.requestLogin(movie.slug);
          return;
        }

        setNotice(
          error.response?.data?.message ??
            (error.response?.status === 404
              ? "This movie is no longer available."
              : "Unable to subscribe. Please try again."),
        );
      } else {
        setNotice("Unable to subscribe. Please try again.");
      }
    } finally {
      locked.current = false;
    }
  }

  const releaseDate = new Date(movie.releaseDate)
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    })
    .toUpperCase();

  const isNotified = movie.isNotified || notify.isSuccess;

  return (
    <>
      <article
        inert={Boolean(authModal)}
        className="flex w-[min(395px,90vw)] shrink-0 gap-3 rounded-[20px] bg-[#1E2031] p-3"
      >
        {/* Movie image */}
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-30 w-47.5 min-w-0 shrink-0 rounded-[14px] object-cover max-sm:w-[42%]"
        />

        {/* Movie information */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#EC3013]">
              IN CINEMAS {releaseDate}
            </p>

            <h3 className="mt-1 line-clamp-2 text-xs font-semibold text-white">
              {movie.title}
            </h3>

            <p className="mt-1 text-[10px] text-white/60">
              {movie.genres[0]?.name ?? "Film"} · {movie.runtimeMinutes} min
            </p>

            <span className="mt-1 inline-flex rounded-full bg-[#EC3013]/10 px-2 py-1 text-[10px] font-semibold text-[#EC3013]">
              {movie.ageRating.code}
            </span>
          </div>

          {/* Notify button */}
          <div className="mt-3">
            {movie.isComingSoon && (
              <button
                type="button"
                onClick={() => void subscribe()}
                disabled={notify.isPending || isNotified}
                aria-busy={notify.isPending}
                className="inline-flex w-fit cursor-pointer items-center justify-center gap-1.5 rounded-full border border-white/60 px-3 py-1 text-[10px] font-semibold text-white transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MdOutlineNotificationsActive size={14} aria-hidden="true" />

                {notify.isPending
                  ? "Subscribing..."
                  : isNotified
                    ? "Notified"
                    : "Notify Me"}
              </button>
            )}

            {/* Error message */}
            {notice && (
              <p
                role="alert"
                className="mt-2 text-[10px] font-medium text-[#EC3013]"
              >
                {notice}
              </p>
            )}
          </div>
        </div>
      </article>

      {/* Login modal */}
      {authModal === "login" && (
        <LoginModal
          onClose={closeAuth}
          onSuccess={auth.authenticated}
          onSignUp={() => setAuthModal("signup")}
        />
      )}

      {/* Register modal */}
      {authModal === "signup" && (
        <RegisterModal
          onClose={closeAuth}
          onSuccess={auth.authenticated}
          onLogIn={() => setAuthModal("login")}
        />
      )}
    </>
  );
};

export default ComingSoonCard;
