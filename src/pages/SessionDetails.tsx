import { useCallback, useEffect, useRef } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Modal from "../components/common/Modal";
import SeatSelection from "../components/sessions/SeatSelection";
import { useSession, useSessionSeats } from "../features/auth/movies/useSession";
import { useFilterOptions } from "../features/auth/filters/useFilterOptions";
import { useAuth } from "../features/auth/useAuth";
import MovieDetails from "./MovieDetails";

const SessionDetails = () => {
  const { sessionId = "" } = useParams();
  const id = /^\d+$/.test(sessionId) ? Number(sessionId) : NaN;
  const validId = Number.isSafeInteger(id) && id > 0;
  const session = useSession(id);
  const seats = useSessionSeats(id);
  const options = useFilterOptions();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useRef<HTMLDivElement>(null);
  const origin = (location.state as { sessionOrigin?: string } | null)?.sessionOrigin;
  const movieSlug = session.data?.movie.slug;
  const close = useCallback(() => {
    if (origin) navigate(-1);
    else navigate(movieSlug ? `/movies/${movieSlug}` : "/sessions", { replace: true });
  }, [navigate, origin, movieSlug]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  const notFound = !validId || (isAxiosError(session.error) && session.error.response?.status === 404);
  const error = session.isError || seats.isError || options.isError;
  const loading = !notFound && (session.isPending || seats.isPending || options.isPending || authLoading);
  const retry = () => {
    void session.refetch();
    void seats.refetch();
    void options.refetch();
  };

  return (
    <>
      <div inert aria-hidden="true">
        {movieSlug ? <MovieDetails movieSlug={movieSlug} /> : <div className="min-h-screen bg-[#070c1c]" />}
      </div>
      <Modal onClose={close}>
        <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="session-title" tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], [tabindex='0']") ?? []);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
              event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault(); first.focus();
            }
          }}
          className="relative max-h-[calc(100dvh-32px)] w-[min(1146px,calc(100vw-32px))] overflow-y-auto rounded-[28px] bg-[#070c1c] p-5 text-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] outline-none sm:p-8">
          <button type="button" onClick={close} className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:rounded-full focus:bg-[#2a2c3d] focus:px-3 focus:py-2">Close seat selection</button>
          <header className="mb-8">
            <h1 id="session-title" className="text-xl font-extrabold leading-tight uppercase">{session.data?.movie.title ?? "Seat selection"}</h1>
            {session.data && <p className="mt-2 text-xs leading-[1.3] text-[#a9a9a9]">
              {session.data.venue.name} · Hall {session.data.hall.name} · {new Date(`${session.data.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · {session.data.time} · {session.data.format.name} · {session.data.language.name}
            </p>}
          </header>
          {notFound ? <p role="alert" className="py-12 text-sm text-red-400">Session not found.</p> : error ? (
            <p role="alert" className="py-12 text-sm text-red-400">Unable to load session seats. <button type="button" onClick={retry} className="cursor-pointer underline">Try again</button></p>
          ) : loading ? <p role="status" className="py-12 text-sm text-[#a9a9a9]">Loading session seats...</p> : null}
          {!notFound && !loading && session.data && seats.data && options.data && (
            <SeatSelection key={`${id}-${user?.id ?? "guest"}`} session={session.data} map={seats.data} options={options.data} disabled={error || seats.isFetching} />
          )}
        </div>
      </Modal>
    </>
  );
};

export default SessionDetails;
