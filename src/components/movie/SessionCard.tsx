import type { MovieSession } from "../../types/movie";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { useAuthReplay } from "../../features/auth/useAuthReplay";
import LoginModal from "../../features/auth/LoginModal";
import RegisterModal from "../../features/auth/RegisterModal";
import { createPortal } from "react-dom";

type SessionCardProps = {
  session: MovieSession;
  variant?: "details" | "listing";
  minAge?: number;
};

const SessionCard = ({
  session,
  variant = "details",
  minAge = 0,
}: SessionCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const ageRestricted = user?.age != null && user.age < minAge;
  const enter = (target: { id: number; origin: string }) => {
    if (!user || session.isSoldOut || ageRestricted) return;
    const returnTo = `/sessions/${target.id}`;
    if (user.profileComplete !== true) {
      navigate("/profile", { state: { returnTo } });
      return;
    }
    navigate(returnTo, { state: { sessionOrigin: target.origin } });
  };
  const auth = useAuthReplay(enter);
  const listing = variant === "listing";
  return (
    <>
    <button
      type="button"
      disabled={isLoading || session.isSoldOut || ageRestricted || Boolean(auth.authModal)}
      title={
        ageRestricted
          ? `This film is restricted to ages ${minAge} and over.`
          : undefined
      }
      onClick={() => {
        if (!session.isSoldOut && !ageRestricted) {
          const target = { id: session.id, origin: location.pathname + location.search };
          if (!user) auth.requestLogin(target);
          else enter(target);
        }
      }}
      className={
        listing
          ? "w-63 shrink-0 cursor-pointer rounded-2xl bg-[#1e2031] p-3.75 text-left transition hover:bg-[#2a2c3d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#1e2031]"
          : `
        min-w-52
        cursor-pointer
        rounded-xl
        bg-white/10
        px-4
        py-3
        text-left
        transition
        hover:bg-white/15
        disabled:cursor-not-allowed
        disabled:opacity-40
      `
      }
    >
      {/* TIME + FORMAT */}
      <div className="flex items-center justify-between gap-4">
        <span
          className={
            listing
              ? "text-lg font-extrabold leading-none text-white"
              : "text-xl font-bold text-white"
          }
        >
          {session.time}
        </span>

        <span
          className={
            listing
              ? "rounded-full bg-[#2a2c3d] px-2.5 py-1.25 text-xs font-semibold leading-none text-white"
              : "rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white"
          }
        >
          {session.format.name}
        </span>
      </div>

      {/* LANGUAGE + SEATS */}
      <div
        className={`${listing ? "mt-3 gap-2" : "mt-2 gap-4"} flex items-center justify-between text-xs leading-[1.3]`}
      >
        <span className={listing ? "text-[#a9a9a9]" : "text-white/50"}>
          {session.language.name}
        </span>

        <span
          className={
            session.isSoldOut
              ? "shrink-0 text-white/40"
              : listing
                ? `flex shrink-0 items-center gap-1 ${session.seatsLeft <= 5 ? "text-[#ec3013]" : "text-[#4ade80]"}`
                : "font-medium text-emerald-400"
          }
        >
          {session.isSoldOut ? (
            "Sold out"
          ) : listing ? (
            <>
              <img
                src={`/sessions/ticket-${session.seatsLeft <= 5 ? "red" : "green"}.svg`}
                alt=""
              />
              {session.seatsLeft} left
            </>
          ) : (
            `🎟 ${session.seatsLeft} left`
          )}
        </span>
      </div>

      {/* VENUE / HALL + PRICE */}
      <div
        className={`${listing ? "mt-2.5 gap-2 leading-none" : "mt-2 gap-4"} flex items-center justify-between`}
      >
        <span className="text-xs font-medium text-white">
          {session.venue.name} · Hall {session.hall.name}
        </span>

        <span
          className={`shrink-0 text-sm text-white ${listing ? "font-extrabold" : "font-semibold"}`}
        >
          ₾{session.price}
        </span>
      </div>
    </button>
    {auth.authModal && createPortal(auth.authModal === "login"
      ? <LoginModal onClose={auth.cancelAuth} onSuccess={auth.authenticated} onSignUp={() => auth.setAuthModal("signup")} />
      : <RegisterModal onClose={auth.cancelAuth} onSuccess={auth.authenticated} onLogIn={() => auth.setAuthModal("login")} />, document.body)}
    </>
  );
};

export default SessionCard;
