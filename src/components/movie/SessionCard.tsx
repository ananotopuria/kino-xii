import type { MovieSession } from "../../types/movie";

type SessionCardProps = {
  session: MovieSession;
};

const SessionCard = ({ session }: SessionCardProps) => {
  return (
    <button
      type="button"
      disabled={session.isSoldOut}
      className="
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
      "
    >
      {/* TIME + FORMAT */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xl font-bold text-white">{session.time}</span>

        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white">
          {session.format.name}
        </span>
      </div>

      {/* LANGUAGE + SEATS */}
      <div className="mt-2 flex items-center justify-between gap-4 text-xs">
        <span className="text-white/50">{session.language.name}</span>

        <span
          className={
            session.isSoldOut ? "text-white/40" : "font-medium text-emerald-400"
          }
        >
          {session.isSoldOut ? "Sold out" : `🎟 ${session.seatsLeft} left`}
        </span>
      </div>

      {/* VENUE / HALL + PRICE */}
      <div className="mt-2 flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-white">
          {session.venue.name} · Hall {session.hall.name}
        </span>

        <span className="text-sm font-semibold text-white">
          ₾{session.price}
        </span>
      </div>
    </button>
  );
};

export default SessionCard;
