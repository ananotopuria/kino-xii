import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, LogOut, UserRound } from "lucide-react";
import { IoTicket } from "react-icons/io5";

import { useAuth } from "../../features/auth/useAuth";

const ProfileMenu = () => {
  const { user, signOut, isSigningOut } = useAuth();

  const [open, setOpen] = useState(false);

  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);

    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (!user) return null;

  const avatar = (size: string) => (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-xl bg-[#1E2031] ${size}`}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="size-full rounded-xl object-cover"
        />
      ) : (
        <span className="text-base font-semibold text-white">
          {user.username.slice(0, 2).toUpperCase()}
        </span>
      )}

      <span
        aria-label={
          user.profileComplete ? "Profile complete" : "Profile incomplete"
        }
        className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-[#070C1C] ${
          user.profileComplete ? "bg-green-400" : "bg-[#FF9100]"
        }`}
      />
    </span>
  );

  return (
    <div
      ref={container}
      className="relative text-white"
      onBlur={(event) => {
        if (
          !isSigningOut &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setOpen(false);
        }
      }}
    >
      {/* Header trigger */}
      <button
        ref={trigger}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 cursor-pointer items-center gap-3"
      >
        {avatar("size-10")}

        <span
          role={isSigningOut ? "status" : undefined}
          className={`max-w-36 truncate text-sm font-semibold ${
            isSigningOut ? "" : "hidden sm:block"
          }`}
        >
          {isSigningOut ? "Logging out..." : (user.fullName ?? user.username)}
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Profile dropdown */}
      {open && (
        <div
          id="account-menu"
          className="absolute top-full right-0 z-50 mt-3 w-75.5 max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl bg-[#070C1C] shadow-2xl"
        >
          {/* User details */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">
            {avatar("size-[46px]")}

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {user.fullName ?? user.username}
              </p>

              <p className="mt-1 truncate text-sm text-[#A9A9A9]">
                {user.email}
              </p>
            </div>
          </div>

          {/* Profile completion status */}
          <div
            className={`mx-5 mb-4 rounded-xl px-3 py-3 ${
              user.profileComplete ? "bg-green-500/10" : "bg-[#FF9100]/10"
            }`}
          >
            <p
              className={`flex items-center gap-2 text-sm font-semibold ${
                user.profileComplete ? "text-green-400" : "text-[#FF9100]"
              }`}
            >
              {user.profileComplete ? (
                <>
                  Profile Complete
                  <Check size={16} />
                </>
              ) : (
                "Profile incomplete"
              )}
            </p>

            {!user.profileComplete && (
              <p className="mt-1 text-xs leading-relaxed text-[#A9A9A9]">
                Please complete your profile to enable booking
              </p>
            )}
          </div>

          {/* Navigation links */}
          <nav className="pb-3">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              <UserRound size={19} strokeWidth={1.8} />
              <span>My Profile</span>
            </Link>

            <Link
              to="/profile?tab=tickets"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              <IoTicket size={19} strokeWidth={1.8} />

              <span>My Tickets</span>
            </Link>
          </nav>

          {/* Logout */}
          <div className="border-t border-white/10">
            <button
              type="button"
              disabled={isSigningOut}
              aria-busy={isSigningOut}
              onClick={() => {
                void signOut().catch(() => {
                  // AuthProvider clears the local session
                  // even if the logout request fails.
                });
              }}
              className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-[#FF3217] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut size={19} strokeWidth={1.8} />
              <span>{isSigningOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
