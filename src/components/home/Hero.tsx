import { Link } from "react-router-dom";

import heroImage from "../../assets/images/hero.webp";

const Hero = () => {
  return (
    <section className="relative min-h-170 overflow-hidden bg-[#020817]">
      <img
        src={heroImage}
        alt="The Odyssey"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/25 to-transparent" />

      <div className="absolute inset-0 bg-linear-to-t from-[#020817] via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-170 items-center px-15 pt-25">
        <div className="max-w-155">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#FF3217]">
            Premiere · Week of 15 Sept
          </p>

          <h1 className="text-5xl font-extrabold uppercase leading-none text-white">
            The Odyssey
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-semibold">
            <span className="rounded-full bg-[#FF3217]/20 px-3 py-1 text-[#FF3217]">
              12+
            </span>

            <span className="text-white/80">134 min</span>

            <span className="rounded-full bg-white/15 px-3 py-1 text-white">
              MAX
            </span>

            <span className="rounded-full bg-white/15 px-3 py-1 text-white">
              PANORAMA
            </span>
          </div>

          <p className="mt-5 max-w-140 text-sm leading-6 text-white/75">
            A king spends ten years finding his way home from a war he already
            won, while monsters, gods, and his own restlessness make sure the
            return takes longer than the fighting did.
          </p>

          <div className="mt-7 flex items-center gap-3">
            <Link
              to="/movies/the-odyssey"
              className="rounded-full bg-[#FF3217] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#E82B13]"
            >
              Buy tickets
            </Link>

            <Link
              to="/sessions"
              className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              All sessions
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-15 right-15 z-10">
        <div className="flex gap-1">
          <div className="h-0.75 flex-1 bg-[#FF3217]" />
          <div className="h-0.75 flex-1 bg-white/60" />
          <div className="h-0.75 flex-1 bg-white/60" />
          <div className="h-0.75 flex-1 bg-white/60" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
