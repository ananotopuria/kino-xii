import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, LogOut, Ticket, UserRound } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";

const ProfileMenu = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!user) return null;
  const avatar = (size: string) => <span className={`relative flex shrink-0 items-center justify-center rounded-lg bg-[#2a2c3d] ${size}`}>
    {user.avatar ? <img src={user.avatar} alt="" className="size-full rounded-lg object-cover" /> : <span className="text-sm font-semibold">{user.username.slice(0, 2).toUpperCase()}</span>}
    {!user.profileComplete && <span aria-label="Profile incomplete" className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-[#070c1c] bg-[#facc15]" />}
  </span>;
  return <div ref={container} className="relative text-white" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" aria-label="Account menu" aria-expanded={open} aria-controls="account-menu" onClick={() => setOpen(!open)} className="flex h-10 cursor-pointer items-center gap-3">
      {avatar("size-10")}<span className="hidden max-w-36 truncate text-sm font-semibold sm:block">{user.fullName ?? user.username}</span><ChevronDown size={16} />
    </button>
    {open && <div id="account-menu" className="absolute right-0 top-full mt-3 w-[302px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#070c1c] pb-2.5 shadow-xl">
      <div className="flex gap-2.5 p-5 pb-4">{avatar("size-[42px]")}<div className="min-w-0"><p className="truncate text-sm font-semibold">{user.fullName ?? user.username}</p><p className="mt-0.5 truncate text-xs text-[#a9a9a9]">{user.email}</p></div></div>
      <p className={`mx-5 mb-2 flex items-center gap-1.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold ${user.profileComplete ? "bg-[#4ade80]/10 text-[#4ade80]" : "bg-amber-400/10 text-amber-300"}`}>{user.profileComplete ? <>Profile Complete <Check size={16} /></> : "Profile incomplete"}</p>
      <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold hover:bg-white/5"><UserRound size={16} />My Profile</Link>
      <Link to="/profile?tab=tickets" onClick={() => setOpen(false)} className="flex items-center gap-2 px-5 py-3 text-sm font-semibold hover:bg-white/5"><Ticket size={16} />My Tickets</Link>
      <button type="button" onClick={() => { setOpen(false); void signOut().catch(() => { /* AuthProvider clears the local session even if logout fails. */ }); }} className="mt-1 flex w-full cursor-pointer items-center gap-2 border-t border-white/10 px-5 py-3 text-sm font-semibold text-[#ec3013] hover:bg-white/5"><LogOut size={16} />Log out</button>
    </div>}
  </div>;
};

export default ProfileMenu;
