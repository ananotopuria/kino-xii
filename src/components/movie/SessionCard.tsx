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
        min-w-42.5
        cursor-pointer
        rounded-xl
        bg-white/10
        px-4
        py-4
        text-left
        transition
        hover:bg-white/15
        disabled:cursor-not-allowed
        disabled:opacity-40
      "
    >
      <p className="text-xs text-white/50">Hall {session.hall.name}</p>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xl font-bold">{session.time}</span>

        <span className="font-semibold text-[#EC3013]">₾{session.price}</span>
      </div>

      <div className="mt-2 flex justify-between text-xs text-white/50">
        <span>{session.format.name}</span>

        <span>
          {session.isSoldOut ? "Sold out" : `${session.seatsLeft} left`}
        </span>
      </div>
    </button>
  );
};

export default SessionCard;
