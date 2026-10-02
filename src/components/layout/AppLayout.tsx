import { Outlet } from "react-router-dom";
import { useState } from "react";

import Header from "./Header";
import LoginModal from "../../features/auth/LoginModal";
import RegistrationModal from "../../features/auth/RegisterModal";
import Footer from "./Footer";

const AppLayout = () => {
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  return (
    <>
      <Header
        onLogin={() => setAuthModal("login")}
        onSignUp={() => setAuthModal("signup")}
      />
      <main>
        <Outlet />
      </main>
      <Footer />
      {authModal === "login" && (
        <LoginModal
          onClose={() => setAuthModal(null)}
          onSignUp={() => setAuthModal("signup")}
        />
      )}

      {authModal === "signup" && (
        <RegistrationModal
          onClose={() => setAuthModal(null)}
          onLogIn={() => setAuthModal("login")}
        />
      )}
    </>
  );
};

export default AppLayout;
