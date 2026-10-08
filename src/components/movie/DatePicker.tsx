type DatePickerProps = {
  dates: string[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

const DatePicker = ({ dates, selectedDate, onSelect }: DatePickerProps) => {
  return (
    <div role="region" aria-label="Session dates" tabIndex={0} className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:pb-0 focus-visible:outline-2 focus-visible:outline-white">
      {dates.map((date) => {
        const parsedDate = new Date(`${date}T12:00:00`);

        const day = parsedDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        const dayNumber = parsedDate.getDate();

        const isActive = selectedDate === date;

        return (
          <button
            key={date}
            type="button"
            aria-pressed={isActive}
            aria-label={parsedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            onClick={() => onSelect(date)}
            className={`flex h-20 w-18 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl transition ${
              isActive ? "bg-[#EC3013]" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            <span className="text-xs text-white/70">{day}</span>

            <span className="mt-1 text-lg font-bold">{dayNumber}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DatePicker;
