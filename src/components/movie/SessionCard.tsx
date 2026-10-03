import type { MovieSession } from "../../types/movie";

type SessionCardProps = {
  session: MovieSession;
  variant?: "details" | "listing";
  onClick?: () => void;
};

const SessionCard = ({ session, variant = "details", onClick }: SessionCardProps) => {
  const listing = variant === "listing";
  return (
    <button
      type="button"
      disabled={session.isSoldOut}
      onClick={onClick}
      className={listing ? "w-63 shrink-0 cursor-pointer rounded-2xl bg-[#1e2031] p-[15px] text-left transition hover:bg-[#2a2c3d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#1e2031]" : `
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
      `}
    >
      {/* TIME + FORMAT */}
      <div className="flex items-center justify-between gap-4">
        <span className={listing ? "text-lg font-extrabold leading-none text-white" : "text-xl font-bold text-white"}>{session.time}</span>

        <span className={listing ? "rounded-full bg-[#2a2c3d] px-2.5 py-[5px] text-xs font-semibold leading-none text-white" : "rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white"}>
          {session.format.name}
        </span>
      </div>

      {/* LANGUAGE + SEATS */}
      <div className={`${listing ? "mt-3 gap-2" : "mt-2 gap-4"} flex items-center justify-between text-xs leading-[1.3]`}>
        <span className={listing ? "text-[#a9a9a9]" : "text-white/50"}>{session.language.name}</span>

        <span
          className={
            session.isSoldOut ? "shrink-0 text-white/40" : listing ? `flex shrink-0 items-center gap-1 ${session.seatsLeft <= 5 ? "text-[#ec3013]" : "text-[#4ade80]"}` : "font-medium text-emerald-400"
          }
        >
          {session.isSoldOut ? "Sold out" : listing ? <><img src={`/sessions/ticket-${session.seatsLeft <= 5 ? "red" : "green"}.svg`} alt="" />{session.seatsLeft} left</> : `🎟 ${session.seatsLeft} left`}
        </span>
      </div>

      {/* VENUE / HALL + PRICE */}
      <div className={`${listing ? "mt-2.5 gap-2 leading-none" : "mt-2 gap-4"} flex items-center justify-between`}>
        <span className="text-xs font-medium text-white">
          {session.venue.name} · Hall {session.hall.name}
        </span>

        <span className={`shrink-0 text-sm text-white ${listing ? "font-extrabold" : "font-semibold"}`}>
          ₾{session.price}
        </span>
      </div>
    </button>
  );
};

export default SessionCard;
