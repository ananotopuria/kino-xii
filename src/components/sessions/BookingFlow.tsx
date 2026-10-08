import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { FilterOptions } from "../../types/filterOptions";
import type { SeatMap, SessionDetails } from "../../types/sessions";
import { useAuth } from "../../features/auth/useAuth";
import { useBooking } from "../../features/auth/movies/useBooking";
import LoginModal from "../../features/auth/LoginModal";
import RegisterModal from "../../features/auth/RegisterModal";
import SeatSelection from "./SeatSelection";
import Checkout from "./Checkout";
import BookingConfirmation from "./BookingConfirmation";

type Props = { session: SessionDetails; map: SeatMap; options: FilterOptions; disabled: boolean; onAuthVisibility: (open: boolean) => void };

const BookingFlow = ({ session, map, options, disabled, onAuthVisibility }: Props) => {
  const booking = useBooking({ session, map, options });
  const { user } = useAuth();

  if (booking.order) return <BookingConfirmation order={booking.order} />;

  return <>
    <div inert={Boolean(booking.authModal)}>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 pr-10">
        <div className="min-w-0 flex-1">
          <h1 id="session-title" className="text-xl leading-[22px] font-extrabold break-words uppercase">{session.movie.title}</h1>
          <p className="mt-2 text-xs leading-[1.3] text-[#a9a9a9]">{session.venue.name} · Hall {session.hall.name} · {new Date(`${session.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })} · {session.time} · {session.format.name} · {session.language.name}</p>
        </div>
        {booking.hold && <div role="timer" aria-label="Time remaining on seat hold" className="shrink-0 rounded-xl bg-[#1e2031] px-3.5 py-2 text-center">
          <p className="text-xs leading-[15px] font-semibold text-[#a9a9a9]">SEATS HELD</p>
          <p className="text-sm leading-[15px] font-extrabold tabular-nums">{Math.floor(booking.seconds / 60)}:{String(booking.seconds % 60).padStart(2, "0")}</p>
        </div>}
      </header>
      {booking.notice && <p role="alert" className="mb-5 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">{booking.notice}{booking.profileRequired && <> <Link to="/profile" state={{ bookingMessage: booking.notice, returnTo: `/sessions/${session.id}` }} className="underline">Complete your profile</Link></>}</p>}
      {booking.restoring ? <p role="status" className="py-12 text-sm text-[#a9a9a9]">Restoring your booking...</p> : booking.restoreFailed ? <button type="button" onClick={booking.retryRestore} className="cursor-pointer text-sm underline">Retry restoring held seats</button> : booking.step === "checkout" && booking.hold && user?.profileComplete === true ? (
        <Checkout key={booking.hold.holdId} session={session} hold={booking.hold} user={user} busy={booking.busy || booking.seconds === 0} submitting={booking.submittingOrder} errors={booking.fieldErrors} onBack={booking.backToSeats} onPay={booking.pay} />
      ) : <SeatSelection session={session} map={map} options={options} disabled={disabled || booking.busy} selection={booking.selection} onChange={booking.setSelection} onContinue={() => { void booking.proceed(); }} creatingHold={booking.creatingHold} seatErrors={booking.seatErrors} />}
      {booking.releasingHold && <p role="status" className="mt-4 text-sm text-[#a9a9a9]">Releasing your seats...</p>}
    </div>
    <BookingAuth modal={booking.authModal} onVisibility={onAuthVisibility}>
      {booking.authModal === "login" && <LoginModal onClose={booking.cancelAuth} onSuccess={booking.authenticated} onSignUp={() => booking.setAuthModal("signup")} />}
      {booking.authModal === "signup" && <RegisterModal onClose={booking.cancelAuth} onSuccess={booking.authenticated} onLogIn={() => booking.setAuthModal("login")} />}
    </BookingAuth>
  </>;
};

// Render the existing auth dialogs outside the booking focus trap and scroll area.
const BookingAuth = ({ modal, onVisibility, children }: { modal: string | null; onVisibility: (open: boolean) => void; children: ReactNode }) => {
  useEffect(() => { onVisibility(Boolean(modal)); return () => onVisibility(false); }, [modal, onVisibility]);
  return modal ? createPortal(children, document.body) : null;
};

export default BookingFlow;
