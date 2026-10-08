import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CheckoutFields, SeatHold } from "../../types/booking";
import type { SessionDetails } from "../../types/sessions";
import type { User } from "../../types/auth";
import { money, shortSessionDate, ticketSummary } from "../../utils/booking";
import { checkoutValidators, normalizeCheckoutFields } from "../../utils/formValidation";

type Props = {
  session: SessionDetails;
  hold: SeatHold;
  user: User | null;
  busy: boolean;
  submitting: boolean;
  errors: Record<string, string[]>;
  onBack: () => void;
  onPay: (values: CheckoutFields) => Promise<void>;
};

const Checkout = ({ session, hold, user, busy, submitting, errors: serverErrors, onBack, onPay }: Props) => {
  const { register, handleSubmit, setError, clearErrors, getFieldState, formState: { errors, isValid, isSubmitting } } = useForm<CheckoutFields>({
    mode: "onChange",
    defaultValues: { fullName: user?.fullName ?? "", email: user?.email ?? "", mobileNumber: user?.mobileNumber ?? "", cardNumber: "", expiry: "", cvv: "" },
  });
  useEffect(() => {
    for (const name of ["fullName", "email", "mobileNumber", "cardNumber", "expiry", "cvv"] as const) {
      if (getFieldState(name).error?.type === "server") clearErrors(name);
      if (serverErrors[name]) setError(name, { type: "server", message: serverErrors[name].join(" ") });
    }
  }, [serverErrors, setError, clearErrors, getFieldState]);

  const input = (name: keyof CheckoutFields, label: string, props: { autoComplete?: string; type?: string; inputMode?: "numeric" | "tel" | "email"; placeholder?: string; maxLength?: number } = {}) => (
    <div className="min-w-0 flex-1">
      <label htmlFor={`checkout-${name}`} className="mb-3 block text-xs leading-[13px] font-semibold">{label}</label>
      <input id={`checkout-${name}`} {...props} {...register(name, { validate: checkoutValidators[name] })}
        disabled={busy} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined}
        className={`h-11 w-full rounded-xl border bg-[#1e2031] px-4 text-sm font-semibold outline-none placeholder:text-[#a9a9a9] focus:border-white disabled:opacity-60 ${errors[name] ? "border-[#ec3013]" : "border-transparent"}`} />
      {errors[name] && <p id={`${name}-error`} role="alert" className="mt-2 text-xs text-[#ec3013]">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form noValidate onSubmit={handleSubmit(async (values) => {
      if (!busy && !submitting) await onPay(normalizeCheckoutFields(values));
    })} className="grid min-h-[455px] gap-5 lg:grid-cols-[minmax(0,720px)_minmax(280px,1fr)]">
      <div className="min-w-0 space-y-6">
        <div aria-label="Booking progress" className="flex gap-2 rounded-full bg-[#1e2031] text-center text-xs leading-[13px] font-semibold">
          <button type="button" disabled={busy} onClick={onBack} className="flex-1 cursor-pointer rounded-full px-4 py-2.5 disabled:cursor-not-allowed">SEATS</button>
          <span aria-current="step" className="flex-1 rounded-full bg-[#ec3013] px-4 py-2.5">CHECKOUT</span>
        </div>
        <div className="space-y-5">
          <div className="space-y-4.5">
            {input("fullName", "Full Name", { autoComplete: "name", placeholder: "Full name", maxLength: 50 })}
            <div className="flex flex-col gap-3 sm:flex-row">
              {input("email", "Email", { type: "email", autoComplete: "email", placeholder: "Email address" })}
              {input("mobileNumber", "Mobile Number", { type: "tel", autoComplete: "tel-national", placeholder: "5XX XX XX XX" })}
            </div>
          </div>
          <div className="border-t border-[#1e2031]" />
          <div className="space-y-4.5">
            {input("cardNumber", "Card Number", { autoComplete: "off", inputMode: "numeric", placeholder: "XXXX XXXX XXXX XXXX", maxLength: 23 })}
            <div className="flex gap-3">
              {input("expiry", "Expiry", { autoComplete: "off", inputMode: "numeric", placeholder: "MM/YY", maxLength: 5 })}
              {input("cvv", "CVV", { type: "password", autoComplete: "off", inputMode: "numeric", placeholder: "•••", maxLength: 3 })}
            </div>
          </div>
        </div>
      </div>
      <aside aria-label="Order summary" className="flex min-w-0 flex-col justify-between gap-6 border-t border-[#1e2031] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
        <div className="space-y-3">
          <h2 className="text-sm leading-[15px] font-extrabold">Summary</h2>
          <div className="space-y-2.5 rounded-xl bg-[#1e2031] p-4 text-xs">
            <h3 className="text-sm leading-[15px] font-extrabold uppercase">{session.movie.title}</h3>
            <p className="text-[#a9a9a9]">Hall {session.hall.name} · {shortSessionDate(session.date)} · {session.time}</p>
            <div className="border-t border-[#2a2c3d]" />
            <div className="flex justify-between gap-3"><span className="text-[#a9a9a9]">Seats</span><span className="text-right font-semibold">{hold.seats.map((seat) => seat.code).join(", ")}</span></div>
            <div className="flex justify-between gap-3"><span className="text-[#a9a9a9]">Tickets</span><span className="text-right">{ticketSummary(hold.seats)}</span></div>
            <ul aria-label="Seat ticket types" className="space-y-2 break-words">{hold.seats.map((seat) => <li key={seat.seatId}>Seat {seat.code} — {seat.ticketType.name}, ₾{money(seat.price)}</li>)}</ul>
          </div>
        </div>
        <div className="space-y-3 pt-2.5">
          <div className="flex items-center justify-between px-1.25"><span className="text-xs font-semibold">SUBTOTAL</span><span className="text-2xl leading-[26px] font-extrabold tabular-nums">₾ {money(hold.subtotal)}</span></div>
          <button type="submit" disabled={busy || submitting || isSubmitting || !isValid} className="w-full cursor-pointer rounded-full bg-[#ec3013] px-5.5 py-3.25 text-sm leading-[15px] font-extrabold disabled:cursor-not-allowed disabled:bg-[#505261] disabled:text-[#a9a9a9]">{submitting ? "Completing order..." : "Pay: Complete order"}</button>
        </div>
      </aside>
    </form>
  );
};

export default Checkout;
