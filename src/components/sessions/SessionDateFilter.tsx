import { localDate } from "../../utils/sessionFilters";

type SessionDateFilterProps = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
};

const SessionDateFilter = ({ selectedDate, onSelectDate }: SessionDateFilterProps) => {
  const today = localDate();
  const end = new Date(`${today}T12:00:00`);
  end.setDate(end.getDate() + 6);
  // Keep a date from a deep link visible, including dates outside this week.
  const start = selectedDate < today || selectedDate > localDate(end) ? selectedDate : today;
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${start}T12:00:00`);
    date.setDate(date.getDate() + index);
    return { value: localDate(date), day: date.toLocaleDateString("en-US", { weekday: "short" }), number: date.getDate() };
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((date) => (
        <button key={date.value} type="button" aria-pressed={selectedDate === date.value}
          aria-label={date.value} onClick={() => onSelectDate(date.value)}
          className={`flex h-13.5 w-9.25 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg text-xs font-semibold leading-none shadow-sm focus-visible:outline-2 focus-visible:outline-white ${selectedDate === date.value ? "bg-[#EC3013]" : "bg-[#2a2c3d] hover:bg-white/15"}`}>
          <span>{date.day}</span><span>{date.number}</span>
        </button>
      ))}
    </div>
  );
};

export default SessionDateFilter;
