import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import LoginModal from "../features/auth/LoginModal";
import RegisterModal from "../features/auth/RegisterModal";
import ProfileForm from "../components/profile/ProfileForm";
import MyTickets from "../components/profile/MyTickets";

const Profile = () => {
  const { user, isLoading } = useAuth();
  const [query, setQuery] = useSearchParams();
  const location = useLocation();
  const section = query.get("tab") === "tickets" ? "tickets" : "profile";
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const pending = useRef<{ ownerId: number; retry: () => Promise<void> } | null>(null);
  const requestLogin = (retry: () => Promise<void>) => {
    if (user) pending.current = { ownerId: user.id, retry };
    setAuthModal("login");
  };
  const resume = useEffectEvent(async () => {
    const action = pending.current;
    if (!action || !user) return;
    pending.current = null;
    // Never replay one account's edit/refund after logging into a different account.
    if (action.ownerId === user.id) await action.retry();
  });
  useEffect(() => { void resume(); }, [user]);
  const closeAuth = () => { pending.current = null; setAuthModal(null); };
  const returnTo = typeof location.state?.returnTo === "string" && /^\/sessions\/\d+$/.test(location.state.returnTo) ? location.state.returnTo : null;

  return <div className="min-h-screen bg-[#070c1c] px-4 pb-16 pt-44 text-white sm:px-8 sm:pt-36 lg:px-15">
    <div inert={Boolean(authModal)} className="mx-auto max-w-[1320px]">
      {isLoading ? <p role="status" className="py-12">Loading your profile...</p> : !user ? <section className="mx-auto max-w-lg rounded-2xl border border-[#2a2c3d] p-8 text-center"><h1 className="text-2xl font-extrabold">Your Kino XII account</h1><p className="mt-3 text-sm text-[#a9a9a9]">Log in to manage your profile and tickets.</p><button type="button" onClick={() => setAuthModal("login")} className="mt-6 cursor-pointer rounded-full bg-[#ec3013] px-6 py-3 font-semibold">Log in</button></section> : <div key={user.id} className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Account" className="flex gap-2 lg:flex-col">
          {(["profile", "tickets"] as const).map((tab) => <button key={tab} type="button" aria-current={section === tab ? "page" : undefined} onClick={() => { const next = new URLSearchParams(query); next.set("tab", tab); setQuery(next); }} className={`cursor-pointer rounded-xl px-5 py-3 text-left text-sm font-semibold ${section === tab ? "bg-white/10 text-white" : "text-[#a9a9a9] hover:bg-white/5"}`}>{tab === "profile" ? "My Profile" : "My Tickets"}</button>)}
        </nav>
        <div className="min-w-0 space-y-4">
          {returnTo && user.profileComplete && <Link to={returnTo} className="inline-block text-sm text-[#4ade80] underline">Continue your booking</Link>}
          {section === "tickets" ? <MyTickets requestLogin={requestLogin} /> : <ProfileForm user={user} requestLogin={requestLogin} />}
        </div>
      </div>}
    </div>
    {authModal === "login" && <LoginModal onClose={closeAuth} onSuccess={() => setAuthModal(null)} onSignUp={() => setAuthModal("signup")} />}
    {authModal === "signup" && <RegisterModal onClose={closeAuth} onSuccess={() => setAuthModal(null)} onLogIn={() => setAuthModal("login")} />}
  </div>;
};

export default Profile;
