import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Popcorn, Search, X } from "lucide-react";

import { useAuth } from "../../features/auth/useAuth";
import ProfileMenu from "./ProfileMenu";
import { useMovieSearch } from "../../features/auth/movies/useMovieSearch";
import { money } from "../../utils/booking";

type HeaderProps = {
  onLogin: () => void;
  onSignUp: () => void;
};

const Header = ({ onLogin, onSignUp }: HeaderProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pathname, key: locationKey } = useLocation();
  const [query, setQuery] = useSearchParams();
  const isSessions = pathname === "/sessions";
  const [searchText, setSearchText] = useState("");
  const [openForLocation, setOpenForLocation] = useState<string | null>(null);
  const searchContainer = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchOpen = !isSessions && openForLocation === locationKey;
  const search = useMovieSearch(searchText, searchOpen);

  useEffect(() => {
    if (!searchOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!searchContainer.current?.contains(event.target as Node)) setOpenForLocation(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchContainer.current?.contains(document.activeElement)) searchInput.current?.focus();
        setOpenForLocation(null);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [searchOpen]);

  return (
    <header className="absolute left-0 top-0 z-20 w-full">
      <div className="flex flex-wrap items-center gap-y-4 px-4 pt-7.5 pb-10 sm:px-8 lg:flex-nowrap lg:px-15">
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
        <div className="ml-auto flex w-full min-w-0 flex-wrap items-center gap-4 sm:w-auto lg:flex-nowrap">
          {/* Search */}
          <div ref={searchContainer} className="relative min-w-0 flex-1 sm:flex-none lg:mr-4" onBlur={(event) => {
            if (!isSessions && !event.currentTarget.contains(event.relatedTarget)) setOpenForLocation(null);
          }}>
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
            />

            <input
              ref={searchInput}
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
              } : {
                value: searchText,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchText(event.target.value);
                  setOpenForLocation(locationKey);
                },
                onFocus: () => setOpenForLocation(locationKey),
                onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "ArrowDown" && searchOpen) {
                    const first = searchContainer.current?.querySelector<HTMLAnchorElement>("[data-search-result]");
                    if (first) { event.preventDefault(); first.focus(); }
                  }
                },
                "aria-controls": searchOpen ? "header-search-results" : undefined,
              })}
              placeholder="Search films and live events"
              style={!isSessions ? { paddingRight: 44 } : undefined}
              {...(!isSessions ? { "data-header-search": true } : {})}
              className="h-11 w-full rounded-full bg-white/15 pl-11 pr-5 text-sm text-white outline-none placeholder:text-white/80 focus:bg-white/20 sm:w-60 xl:w-100"
            />
            {!isSessions && searchText && <button type="button" aria-label="Clear search" onClick={() => {
              setSearchText("");
              searchInput.current?.focus();
              setOpenForLocation(locationKey);
            }} className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"><X size={14} /></button>}
            {searchOpen && <div id="header-search-results" aria-label="Search results" role="region" className="absolute left-0 right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-auto max-h-[min(32rem,70vh)] overflow-y-auto rounded-2xl border border-[#2a2c3d] bg-[#070c1c] text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
              {!searchText.trim() || (!search.isLoading && !search.error && search.data?.length === 0) ? <div className="flex min-h-[228px] flex-col items-center justify-center px-5 py-8 text-center">
                <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-white/10">
                  {searchText.trim() ? <Search size={20} strokeWidth={1.5} /> : <Popcorn size={20} />}
                </span>
                <p role="status" className="max-w-full break-words text-sm font-semibold">{searchText.trim() ? `No results for “${searchText.trim()}”` : "What do you want to watch?"}</p>
                <p className="mt-1 text-sm text-[#a9a9a9]">{searchText.trim() ? "Check the spelling or try another film or live event." : "Search by title, director or cast"}</p>
                <Link to="/sessions" onClick={() => { setOpenForLocation(null); setSearchText(""); }} className="mt-5 rounded-full bg-white/10 px-5 py-3 text-sm font-extrabold transition-colors hover:bg-white/15">Browse all sessions</Link>
              </div> : search.isLoading ? <p role="status" className="px-4 py-5 text-sm text-[#a9a9a9]">Searching...</p> : search.error ? <div role="alert" className="px-4 py-5 text-sm text-[#a9a9a9]">Unable to load search results. <button type="button" onClick={() => void search.refetch()} className="cursor-pointer text-white underline">Retry</button></div> : <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-3 text-xs text-[#a9a9a9]">
                  <h2 className="font-semibold tracking-[0.08em]">FILMS &amp; EVENTS</h2>
                  <span role="status">{search.data?.length ?? 0} {search.data?.length === 1 ? "result" : "results"}</span>
                </div>
                <ul className="space-y-4">
                {search.data?.map((movie) => <li key={movie.id}>
                  <Link data-search-result to={`/movies/${encodeURIComponent(movie.slug)}`} onClick={() => { setOpenForLocation(null); setSearchText(""); }} onKeyDown={(event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const links = Array.from(searchContainer.current?.querySelectorAll<HTMLAnchorElement>("[data-search-result]") ?? []);
                    const index = links.indexOf(event.currentTarget);
                    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
                    if (next < 0) searchInput.current?.focus();
                    else links[Math.min(next, links.length - 1)]?.focus();
                  }} className="flex items-center gap-3 rounded-lg transition-colors hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none">
                    <img src={movie.posterUrl} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{movie.title}</p>
                      <p className="mt-1 text-xs text-[#a9a9a9]"><span className="capitalize">{movie.kind.replaceAll("_", " ")}</span> · {movie.ageRating.code} · {movie.runtimeMinutes} min</p>
                    </div>
                    <span className={`shrink-0 text-right text-sm font-semibold ${movie.isComingSoon ? "text-[#ff9d00]" : "text-white"}`}>{movie.isComingSoon ? "Coming Soon" : `from ₾${money(movie.fromPrice)}`}</span>
                  </Link>
                </li>)}
                </ul>
              </div>}
            </div>}
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
