import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Modal from "../components/common/Modal";
import BookingFlow from "../components/sessions/BookingFlow";
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
  const { isLoading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dialog = useRef<HTMLDivElement>(null);
  const origin = (location.state as { sessionOrigin?: string } | null)?.sessionOrigin;
  const movieSlug = session.data?.movie.slug;
  const close = useCallback(() => {
    if (authOpen) return;
    if (origin) navigate(-1);
    else navigate(movieSlug ? `/movies/${movieSlug}` : "/sessions", { replace: true });
  }, [navigate, origin, movieSlug, authOpen]);

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
            if (authOpen || event.key !== "Tab") return;
            const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href], [tabindex='0']") ?? []);
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
          <button type="button" onClick={close} disabled={authOpen} aria-label="Close booking" className="absolute top-3 right-3 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl leading-none text-[#a9a9a9] hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed">×</button>
          {(notFound || loading || !session.data || !seats.data || !options.data) && <h1 id="session-title" className="mb-8 text-xl font-extrabold">Seat selection</h1>}
          {notFound ? <p role="alert" className="py-12 text-sm text-red-400">Session not found.</p> : error ? (
            <p role="alert" className="py-12 text-sm text-red-400">Unable to load session seats. <button type="button" onClick={retry} className="cursor-pointer underline">Try again</button></p>
          ) : loading ? <p role="status" className="py-12 text-sm text-[#a9a9a9]">Loading session seats...</p> : null}
          {!notFound && !loading && session.data && seats.data && options.data && (
            <BookingFlow key={id} session={session.data} map={seats.data} options={options.data} disabled={error || seats.isFetching} onAuthVisibility={setAuthOpen} />
          )}
        </div>
      </Modal>
    </>
  );
};

export default SessionDetails;
