import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { useAuth } from "../../features/auth/useAuth";
import ProfileMenu from "./ProfileMenu";

type HeaderProps = {
  onLogin: () => void;
  onSignUp: () => void;
};

const Header = ({ onLogin, onSignUp }: HeaderProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();
  const [query, setQuery] = useSearchParams();
  const isSessions = pathname === "/sessions";
  const compact = isSessions || pathname === "/profile";

  return (
    <header className="absolute left-0 top-0 z-20 w-full">
      <div className={compact ? "flex flex-wrap items-center gap-y-4 px-4 pt-7.5 pb-10 sm:px-8 lg:flex-nowrap lg:px-15" : "flex items-center px-15 pt-7.5 pb-10"}>
        {/* Logo */}
        <Link to="/" className="shrink-0 cursor-pointer">
          <span className="text-[22px] font-bold text-white">
            KINO <span className="text-red-500">XII</span>
          </span>
        </Link>

        {/* Sessions */}
        <Link
          to="/sessions"
          className="ml-10 cursor-pointer text-sm font-medium uppercase text-white transition-opacity hover:opacity-70"
        >
          Sessions
        </Link>

        {/* Right side */}
        <div className={compact ? "ml-auto flex w-full flex-wrap items-center gap-4 sm:w-auto lg:flex-nowrap" : "ml-auto flex items-center gap-4"}>
          {/* Search */}
          <div className={compact ? "relative min-w-0 flex-1 sm:flex-none lg:mr-4" : "relative mr-4"}>
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
            />

            <input
              type="search"
              aria-label="Search films and live events"
              {...(isSessions ? {
                value: query.get("search") ?? "",
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  const next = new URLSearchParams(query);
                  if (event.target.value) next.set("search", event.target.value);
                  else next.delete("search");
                  next.set("page", "1");
                  setQuery(next);
                },
              } : {})}
              placeholder="Search films and live events"
              className={compact ? "h-11 w-full rounded-full bg-white/15 pl-11 pr-5 text-sm text-white outline-none placeholder:text-white/80 focus:bg-white/20 sm:w-60 xl:w-100" : `
                h-11
                w-100
                rounded-full
                bg-white/15
                pl-11
                pr-5
                text-sm
                text-white
                outline-none
                placeholder:text-white/80
                focus:bg-white/20
              `}
            />
          </div>

          {/* Auth */}
          {!isLoading && !isAuthenticated && (
            <>
              <button
                type="button"
                onClick={onSignUp}
                className="
                  h-11
                  cursor-pointer
                  rounded-full
                  bg-[#ff3217]
                  px-7
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-[#e82b13]
                "
              >
                Sign up
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="
                  h-11
                  cursor-pointer
                  rounded-full
                  bg-white
                  px-7
                  text-sm
                  font-semibold
                  text-black
                  transition
                  hover:bg-gray-200
                "
              >
                Log in
              </button>
            </>
          )}

          {!isLoading && isAuthenticated && user && <ProfileMenu />}
        </div>
      </div>
    </header>
  );
};

export default Header;
