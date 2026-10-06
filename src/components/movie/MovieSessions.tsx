import DatePicker from "./DatePicker";
import SessionCard from "./SessionCard";
import { groupSessionsByHall } from "../../utils/groupSessionsByHall";
import { useMovieSessions } from "../../features/auth/movies/useMovieSessions";

type MovieSessionsProps = {
  slug: string;
  minAge: number;
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const MovieSessions = ({
  slug,
  minAge,
  dates,
  selectedDate,
  onSelectDate,
}: MovieSessionsProps) => {
  const {
    data: sessionsByVenue,
    isLoading,
    isError,
    refetch,
  } = useMovieSessions(slug, selectedDate);

  return (
    <section>
      <h2 className="text-2xl font-bold">Sessions</h2>

      <p className="mt-1 text-sm text-white/50">
        Choose a date to see available sessions
      </p>

      <DatePicker
        dates={dates}
        selectedDate={selectedDate}
        onSelect={onSelectDate}
      />

      {isLoading && (
        <p role="status" className="mt-8 text-sm text-white/50">Loading sessions...</p>
      )}

      {isError && (
        <p role="alert" className="mt-8 text-sm text-red-400">Failed to load sessions. <button type="button" onClick={() => void refetch()} className="cursor-pointer underline">Retry</button></p>
      )}

      {!isLoading && !isError && sessionsByVenue?.every((group) => group.sessions.length === 0) && (
        <p role="status" className="mt-8 text-sm text-white/50">
          No sessions available for this date.
        </p>
      )}

      <div className="mt-8 space-y-8">
        {!isLoading && !isError && sessionsByVenue?.filter((group) => group.sessions.length > 0).map((group) => {
          const sessionsByHall = groupSessionsByHall(group.sessions);

          return (
            <div key={group.venue.id}>
              <div className="mb-5">
                <h3 className="text-base font-bold">{group.venue.name}</h3>

                <p className="mt-1 text-xs text-white/40">{group.venue.city}</p>
              </div>

              <div className="space-y-5">
                {Object.entries(sessionsByHall).map(([hallName, sessions]) => (
                  <div key={hallName}>
                    <p className="mb-3 text-xs font-semibold text-white/50">
                      Hall {hallName}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {sessions.map((session) => (
                        <SessionCard key={session.id} session={session} minAge={minAge} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MovieSessions;
