import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <header>Header</header>

      <main>
        <Outlet />
      </main>
      <footer>Footer</footer>
    </div>
  );
};

export default AppLayout;
