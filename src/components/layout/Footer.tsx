import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#070C1C] px-8.5 pb-8.5 pt-7">
      <div className="h-px w-full bg-[#2A2C3D]" />

      <div className="mt-5 flex items-center">
        <Link to="/" className="text-sm font-extrabold text-white">
          KINO <span className="text-[#EC3013]">XII</span>
        </Link>

        <p className="ml-auto text-xs text-[#A9A9A9]">
          © 2026 Kino XII. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
