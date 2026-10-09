import { useEffect, useEffectEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "../features/auth/useAuth";
import { useAuthReplay } from "../features/auth/useAuthReplay";

import LoginModal from "../features/auth/LoginModal";
import RegisterModal from "../features/auth/RegisterModal";

import ProfileForm from "../components/profile/ProfileForm";
import MyTickets from "../components/profile/MyTickets";

const Profile = () => {
  const { user, isLoading, restorationError } = useAuth();

  const [query, setQuery] = useSearchParams();
  const location = useLocation();

  const section = query.get("tab") === "tickets" ? "tickets" : "profile";

  const auth = useAuthReplay<{
    ownerId?: number;
    retry?: () => Promise<void>;
  }>(async (action) => {
    if (action.retry && action.ownerId === user?.id) {
      await action.retry();
    }
  });

  const { authModal, setAuthModal, cancelAuth: closeAuth } = auth;

  const requestLogin = (retry: () => Promise<void>) => {
    auth.requestLogin({
      ownerId: user?.id,
      retry,
    });
  };

  const openGuestLogin = useEffectEvent(() => {
    if (!user && !isLoading && !restorationError) {
      auth.requestLogin({});
    }
  });

  useEffect(() => {
    openGuestLogin();
  }, [user, isLoading, restorationError, location.key]);

  const returnTo =
    typeof location.state?.returnTo === "string" &&
    /^\/sessions\/\d+$/.test(location.state.returnTo)
      ? location.state.returnTo
      : null;

  const changeTab = (tab: "profile" | "tickets") => {
    const next = new URLSearchParams(query);

    if (tab === "profile") {
      next.delete("tab");
    } else {
      next.set("tab", "tickets");
    }

    setQuery(next);
  };

  return (
    <div className="min-h-screen bg-[#070C1C] px-4 pt-32 pb-16 text-white sm:px-8 lg:px-15">
      <div inert={Boolean(authModal)} className="mx-auto w-full max-w-[1600px]">
        {isLoading ? (
          <p role="status" className="py-12">
            Loading your profile...
          </p>
        ) : !user ? (
          <section className="mx-auto max-w-lg rounded-2xl border border-[#2A2C3D] p-8 text-center">
            <h1 className="text-2xl font-extrabold">Your Kino XII account</h1>

            <p className="mt-3 text-sm text-[#A9A9A9]">
              Log in to manage your profile and tickets.
            </p>

            <button
              type="button"
              onClick={() => auth.requestLogin({})}
              className="mt-6 cursor-pointer rounded-full bg-[#EC3013] px-6 py-3 font-semibold transition hover:bg-[#D92B11]"
            >
              Log in
            </button>
          </section>
        ) : (
          <div key={user.id} className="w-full">
            {/* Page title */}
            <h1 className="mb-7 text-2xl font-bold text-white">My Profile</h1>

            {/* Horizontal tabs */}
            <div className="border-b border-white/10">
              <nav
                aria-label="Profile sections"
                className="flex items-center gap-8"
              >
                <button
                  type="button"
                  onClick={() => changeTab("profile")}
                  aria-current={section === "profile" ? "page" : undefined}
                  className={`relative cursor-pointer pb-4 text-sm font-semibold transition-colors ${
                    section === "profile"
                      ? "text-white"
                      : "text-[#A9A9A9] hover:text-white"
                  }`}
                >
                  Personal Information
                  {section === "profile" && (
                    <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#FF3217]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => changeTab("tickets")}
                  aria-current={section === "tickets" ? "page" : undefined}
                  className={`relative flex cursor-pointer items-center gap-2 pb-4 text-sm font-semibold transition-colors ${
                    section === "tickets"
                      ? "text-white"
                      : "text-[#A9A9A9] hover:text-white"
                  }`}
                >
                  My Tickets
                  {section === "tickets" && (
                    <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-[#FF3217]" />
                  )}
                </button>
              </nav>
            </div>

            {/* Continue booking */}
            {returnTo && user.profileComplete && (
              <Link
                to={returnTo}
                className="mt-6 inline-block text-sm text-[#4ADE80] underline"
              >
                Continue your booking
              </Link>
            )}

            {/* Active tab content */}
            <div className="mt-10 min-w-0">
              {section === "tickets" ? (
                <MyTickets requestLogin={requestLogin} />
              ) : (
                <ProfileForm user={user} requestLogin={requestLogin} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Login modal */}
      {authModal === "login" && (
        <LoginModal
          onClose={closeAuth}
          onSuccess={auth.authenticated}
          onSignUp={() => setAuthModal("signup")}
        />
      )}

      {/* Register modal */}
      {authModal === "signup" && (
        <RegisterModal
          onClose={closeAuth}
          onSuccess={auth.authenticated}
          onLogIn={() => setAuthModal("login")}
        />
      )}
    </div>
  );
};

export default Profile;
