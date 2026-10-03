import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Sessions from "../pages/Sessions";
import MovieDetails from "../pages/MovieDetails";
import Profile from "../pages/Profile";
import SessionDetails from "../pages/SessionDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "sessions",
        element: <Sessions />,
      },
      {
        path: "sessions/:sessionId",
        element: <SessionDetails />,
      },
      {
        path: "movies/:slug",
        element: <MovieDetails />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
]);
