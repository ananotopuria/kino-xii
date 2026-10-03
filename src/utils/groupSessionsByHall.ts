import type { MovieSession } from "../types/movie";

export const groupSessionsByHall = (sessions: MovieSession[]) => {
  return sessions.reduce<Record<string, MovieSession[]>>((groups, session) => {
    const hallName = session.hall.name;

    if (!groups[hallName]) {
      groups[hallName] = [];
    }

    groups[hallName].push(session);

    return groups;
  }, {});
};
