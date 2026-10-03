import { useMovieSessions } from "../../features/auth/movies/useMovieSessions";
import DatePicker from "./DatePicker";
import SessionCard from "./SessionCard";

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
  const { data: sessionsByVenue, isLoading } = useMovieSessions(
    slug,
    selectedDate,
  );

  return (
    <div>
      <h2 className="text-2xl font-bold">Sessions</h2>

      <p className="mt-1 text-sm text-white/50">
        Choose a date to see available sessions
      </p>

      <DatePicker
        dates={dates}
        selectedDate={selectedDate}
        onSelect={onSelectDate}
      />

      <div className="mt-8 space-y-8">
        {isLoading && (
          <p className="text-sm text-white/50">Loading sessions...</p>
        )}

        {!isLoading &&
          sessionsByVenue?.map((group) => (
            <div key={group.venue.id}>
              <h3 className="mb-3 font-semibold">{group.venue.name}</h3>

              <div className="flex flex-wrap gap-3">
                {group.sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MovieSessions;
