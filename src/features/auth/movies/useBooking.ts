import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getHold } from "../../../api/booking";
import type { CheckoutFields, Order, SeatHold } from "../../../types/booking";
import type { FilterOptions } from "../../../types/filterOptions";
import type { SeatMap, SeatSelection, SessionDetails } from "../../../types/sessions";
import { bookingError, bookingStorageKey, dropContested, HOLD_EXPIRED, holdSelection, remainingSeconds } from "../../../utils/booking";
import { eligibleTicketTypes, reconcileSelection, seatsInMap } from "../../../utils/seatSelection";
import { useAuth } from "../useAuth";
import { useBookingMutations } from "./useBookingMutations";

type PendingAction = { kind: "hold" } | { kind: "order"; fields: CheckoutFields } | { kind: "restore"; id: string } | { kind: "exit"; to: string; state: unknown };
type Props = { session: SessionDetails; map: SeatMap; options: FilterOptions };

export const useBooking = ({ session, map, options }: Props) => {
  const { user } = useAuth();
  const ownerKey = `${session.id}:${user?.id ?? "guest"}`;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutations = useBookingMutations(session.id);
  const [hold, setHold] = useState<SeatHold | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<"seats" | "checkout">("seats");
  const [notice, setNotice] = useState("");
  const [profileRequired, setProfileRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [restoredFor, setRestoredFor] = useState(() =>
    user && sessionStorage.getItem(bookingStorageKey(session.id, user.id)) ? "" : ownerKey);
  const [restoreScope, setRestoreScope] = useState(ownerKey);
  if (restoreScope !== ownerKey) {
    setRestoreScope(ownerKey);
    setRestoredFor(user && sessionStorage.getItem(bookingStorageKey(session.id, user.id)) ? "" : ownerKey);
  }
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [selection, setSelection] = useState<SeatSelection[]>(() => {
    const adult = options.ticketTypes.find((type) => type.slug === "adult");
    return adult ? seatsInMap(map).filter((seat) => seat.isMine).map((seat) => ({ seatId: seat.id, ticketTypeId: adult.id })) : [];
  });
  const activeHold = useRef<SeatHold | null>(null);
  const persisted = useRef<{ key: string; id: string } | null>(null);
  const pendingAuth = useRef<PendingAction | null>(null);
  const actionLock = useRef(false);
  const restoreGeneration = useRef(0);
  const restoring = restoredFor !== ownerKey;
  const busy = restoring || mutations.createHold.isPending || mutations.createOrder.isPending || mutations.releaseHold.isPending;
  const types = eligibleTicketTypes(options.ticketTypes, session.movie.ageRating.minAge);
  const currentSelection = reconcileSelection(selection, map, types, options.maxSeatsPerOrder);
  const [previousMap, setPreviousMap] = useState(map);
  if (previousMap !== map) {
    setPreviousMap(map);
    setSelection(currentSelection);
  }

  const refreshSeats = () => queryClient.invalidateQueries({ queryKey: ["session-seats", session.id] });
  const clearHold = () => {
    if (persisted.current) sessionStorage.removeItem(persisted.current.key);
    persisted.current = null;
    activeHold.current = null;
    setHold(null);
    setSeconds(0);
    setRestoreFailed(false);
  };
  const acceptHold = (next: SeatHold) => {
    activeHold.current = next;
    setHold(next);
    setSeconds(remainingSeconds(next));
    setSelection(holdSelection(next, options.ticketTypes));
    setStep("checkout");
    setRestoreFailed(false);
    if (user) {
      const key = bookingStorageKey(session.id, user.id);
      sessionStorage.setItem(key, next.holdId);
      persisted.current = { key, id: next.holdId };
    }
  };
  const expire = (message = HOLD_EXPIRED) => {
    clearHold();
    pendingAuth.current = null;
    setSelection([]);
    setStep("seats");
    setFieldErrors({});
    setNotice(message);
    void refreshSeats();
  };
  const requestLogin = (action: PendingAction) => {
    pendingAuth.current = action;
    setAuthModal("login");
  };

  const restore = async (id: string) => {
    const generation = restoreGeneration.current;
    try {
      const restored = await queryClient.fetchQuery({
        queryKey: ["booking-hold", user?.id, id],
        queryFn: ({ signal }) => getHold(id, signal), staleTime: 0, retry: false, gcTime: 0,
      });
      if (generation !== restoreGeneration.current) return;
      if (restored.sessionId !== session.id) {
        clearHold();
        setNotice("This hold belongs to another session.");
      } else if (remainingSeconds(restored) === 0) expire();
      else acceptHold(restored);
    } catch (error) {
      if (generation !== restoreGeneration.current) return;
      const failure = bookingError(error);
      setNotice(failure.message ?? "Unable to restore your held seats. Please try again.");
      if (failure.status === 401) requestLogin({ kind: "restore", id });
      else if (failure.status === 403 || failure.status === 404) clearHold();
      else setRestoreFailed(true);
    }
  };

  const restoreForUser = useEffectEvent(async () => {
    const generation = restoreGeneration.current;
    // Only an identifier is persisted, scoped to the signed-in account and session.
    const key = user ? bookingStorageKey(session.id, user.id) : null;
    const id = key ? sessionStorage.getItem(key) : null;
    if (id && key) {
      persisted.current = { key, id };
      await restore(id);
      if (generation === restoreGeneration.current) setRestoredFor(ownerKey);
    }
  });
  useEffect(() => {
    restoreGeneration.current += 1;
    // Restore synchronizes persisted identifiers with an asynchronous API read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restoreForUser();
    return () => { restoreGeneration.current += 1; };
  }, [ownerKey]);

  const tick = useEffectEvent(() => {
    if (!activeHold.current) return;
    const next = remainingSeconds(activeHold.current);
    setSeconds(next);
    // Do not discard a successful payment that crosses the expiry boundary in flight.
    if (next === 0 && !actionLock.current) expire();
  });
  useEffect(() => {
    const timer = window.setInterval(() => tick(), 1000);
    const onWake = () => tick();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, []);

  const recover = async (error: unknown, action: PendingAction) => {
    const failure = bookingError(error);
    const message = failure.message ?? "Unable to complete this booking action. Please try again.";
    setNotice(message);
    if (failure.status === 401) {
      requestLogin(action);
    } else if (failure.status === 409) {
      const contested = failure.contested ?? [];
      const retained = dropContested(selection, map, contested);
      setSelection(retained);
      setStep("seats");
      setFieldErrors({});
      setNotice(`${message}${contested.length ? ` ${contested.join(", ")}` : ""}`);
      // Mark the contested codes immediately, then reconcile with the live map.
      queryClient.setQueriesData<SeatMap>({ queryKey: ["session-seats", session.id] }, (cached) => cached && ({
        ...cached, sections: cached.sections.map((section) => ({ ...section, rows: section.rows.map((row) => ({
          ...row, seats: row.seats.map((seat) => contested.includes(seat.code) ? { ...seat, state: "sold", isMine: false } : seat),
        })) })),
      }));
      // A failed replacement may leave the preceding hold live; keep its identifier
      // so leaving still releases it. It will be replaced on the next attempt.
      await refreshSeats();
    } else if (failure.status === 422 && failure.errors) {
      setFieldErrors(failure.errors);
      if (action.kind !== "order") setNotice([message, ...Object.values(failure.errors).flat()].join(" "));
    } else if (failure.status === 422 && action.kind === "order") {
      expire(message);
    } else if (failure.status === 422 && !failure.errors && /expired/i.test(message)) {
      expire(message);
    } else if (failure.status === 422 && !failure.errors && /profile/i.test(message)) {
      setProfileRequired(true);
    } else if (failure.status === 403) {
      clearHold();
      setSelection([]);
      setStep("seats");
      await refreshSeats();
    }
  };

  const proceed = async () => {
    if (actionLock.current || restoring || restoreFailed || !currentSelection.length) return;
    if (!user) { requestLogin({ kind: "hold" }); return; }
    actionLock.current = true;
    setNotice("");
    setProfileRequired(false);
    setFieldErrors({});
    try {
      const next = await mutations.createHold.mutateAsync({ seats: currentSelection.map((seat) => ({
        seatId: seat.seatId, ticketType: types.find((type) => type.id === seat.ticketTypeId)!.slug,
      })) });
      if (remainingSeconds(next) === 0) expire();
      else { acceptHold(next); await refreshSeats(); }
    } catch (error) {
      await recover(error, { kind: "hold" });
    } finally {
      actionLock.current = false;
    }
  };

  const pay = async (fields: CheckoutFields) => {
    const current = activeHold.current;
    if (actionLock.current || !current) return;
    if (remainingSeconds(current) === 0) { expire(); return; }
    if (!user) { requestLogin({ kind: "order", fields }); return; }
    actionLock.current = true;
    setNotice("");
    setFieldErrors({});
    try {
      const result = await mutations.createOrder.mutateAsync({ ...fields, holdId: current.holdId });
      clearHold();
      pendingAuth.current = null;
      setSelection([]);
      setOrder(result);
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["movie-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["session", session.id] });
      void refreshSeats();
    } catch (error) {
      await recover(error, { kind: "order", fields });
    } finally {
      mutations.createOrder.reset();
      actionLock.current = false;
    }
  };

  const resume = useEffectEvent(async () => {
    if (!user || restoring || !pendingAuth.current) return;
    const action = pendingAuth.current;
    pendingAuth.current = null;
    setAuthModal(null);
    if (action.kind === "hold") await proceed();
    else if (action.kind === "order") await pay(action.fields);
    else if (action.kind === "restore") await restore(action.id);
    else navigate(action.to, { state: action.state });
  });
  useEffect(() => { void resume(); }, [user, restoring]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    currentLocation.pathname !== nextLocation.pathname && (actionLock.current || persisted.current !== null));
  const leave = useEffectEvent(async () => {
    if (blocker.state !== "blocked") return;
    if (actionLock.current) { blocker.reset(); return; }
    const id = persisted.current?.id;
    if (!id) { blocker.proceed(); return; }
    actionLock.current = true;
    try {
      await mutations.releaseHold.mutateAsync(id);
      clearHold();
      void refreshSeats();
      blocker.proceed();
    } catch (error) {
      const failure = bookingError(error);
      if (failure.status === 403 || failure.status === 404) {
        clearHold(); blocker.proceed();
      } else {
        setNotice(failure.message ?? "Unable to release your seats. Please try closing again.");
        blocker.reset();
        if (failure.status === 401) requestLogin({ kind: "exit", to: blocker.location.pathname + blocker.location.search + blocker.location.hash, state: blocker.location.state });
      }
    } finally { actionLock.current = false; }
  });
  // Router blockers are external navigation events: resolving one must update
  // both the booking state and the router after releasing the remote hold.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (blocker.state === "blocked") void leave(); }, [blocker.state]);

  return {
    hold, order, step, notice, profileRequired, fieldErrors, authModal, seconds, restoring, restoreFailed, busy,
    selection: currentSelection, setSelection, proceed, pay,
    creatingHold: mutations.createHold.isPending,
    submittingOrder: mutations.createOrder.isPending,
    releasingHold: mutations.releaseHold.isPending,
    backToSeats: () => { if (!actionLock.current) { setStep("seats"); setFieldErrors({}); void refreshSeats(); } },
    retryRestore: () => {
      if (!persisted.current) return;
      setRestoredFor("");
      void restore(persisted.current.id).finally(() => setRestoredFor(ownerKey));
    },
    setAuthModal,
    cancelAuth: () => { pendingAuth.current = null; setAuthModal(null); },
    authenticated: () => setAuthModal(null),
  };
};
