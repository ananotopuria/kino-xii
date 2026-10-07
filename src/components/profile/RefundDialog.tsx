import { useEffect, useRef } from "react";
import Modal from "../common/Modal";
import type { Order } from "../../types/booking";
import { money } from "../../utils/booking";

const RefundDialog = ({ order, busy, error, onClose, onConfirm }: { order: Order; busy: boolean; error: string; onClose: () => void; onConfirm: () => void }) => {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => { if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <Modal onClose={() => { if (!busy) onClose(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="refund-title" aria-describedby="refund-description" aria-busy={busy} tabIndex={-1} className="mx-4 w-[calc(100vw-2rem)] max-w-md rounded-[28px] border border-[#2a2c3d] bg-[#070c1c] p-6 text-white shadow-xl sm:p-8" onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      if (!buttons?.length) { event.preventDefault(); dialog.current?.focus(); return; }
      const first = buttons[0]; const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
      <div className="flex items-start justify-between gap-4">
        <h2 id="refund-title" className="text-xl font-extrabold">Refund tickets?</h2>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close refund dialog" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-2xl leading-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50">×</button>
      </div>
      <p id="refund-description" className="mt-3 text-sm leading-relaxed text-[#a9a9a9]">Refund all tickets for {order.session.movie.title}, order #{order.reference}. This action cannot be undone.</p>
      <p className="mt-5 flex justify-between text-sm"><span>Refund amount</span><strong>₾ {money(order.totalPrice)}</strong></p>
      {error && <p role="alert" className="mt-4 text-sm text-[#ff725a]">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-extrabold">
        <button type="button" disabled={busy} onClick={onClose} className="cursor-pointer rounded-full bg-white/10 px-5 py-3 disabled:opacity-50">Keep tickets</button>
        <button type="button" disabled={busy || !order.isRefundable} onClick={onConfirm} className="cursor-pointer rounded-full bg-[#ec3013] px-5 py-3 disabled:cursor-wait disabled:opacity-50">{busy ? "Refunding..." : "Confirm refund"}</button>
      </div>
    </div>
  </Modal>;
};

export default RefundDialog;
