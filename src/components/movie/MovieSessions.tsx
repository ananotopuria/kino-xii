import DatePicker from "./DatePicker";
import SessionCard from "./SessionCard";
import { groupSessionsByHall } from "../../utils/groupSessionsByHall";
import { useMovieSessions } from "../../features/auth/movies/useMovieSessions";

type MovieSessionsProps = {
  slug: string;
  dates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const MovieSessions = ({
  slug,
  dates,
  selectedDate,
  onSelectDate,
}: MovieSessionsProps) => {
  const {
    data: sessionsByVenue,
    isLoading,
    isError,
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
        <p className="mt-8 text-sm text-white/50">Loading sessions...</p>
      )}

      {isError && (
        <p className="mt-8 text-sm text-red-400">Failed to load sessions.</p>
      )}

      {!isLoading && !isError && sessionsByVenue?.length === 0 && (
        <p className="mt-8 text-sm text-white/50">
          No sessions available for this date.
        </p>
      )}

      <div className="mt-8 space-y-8">
        {sessionsByVenue?.map((group) => {
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
                        <SessionCard key={session.id} session={session} />
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
