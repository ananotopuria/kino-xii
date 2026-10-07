import { Fragment } from "react";
import type { Seat, SeatMap as SeatMapData } from "../../types/sessions";
import { canSelectSeat } from "../../utils/seatSelection";

type SeatMapProps = {
  map: SeatMapData;
  selectedIds: Set<number>;
  disabled: boolean;
  onToggle: (seat: Seat) => void;
};

const HeldPattern = ({ small = false }: { small?: boolean }) => (
  <img src={`/booking/held-${small ? "legend" : "seat"}.svg`} alt=""
    className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 rotate-[-37.44deg]" />
);

const SeatMap = ({ map, selectedIds, disabled, onToggle }: SeatMapProps) => (
  <div className="flex min-w-0 flex-col gap-8 py-5">
    <div className="mx-5 flex h-7.5 items-center justify-center rounded-b-[20px] bg-[#2a2c3d] text-xs font-semibold">SCREEN</div>
    {map.sections.map((section, sectionIndex) => (
      <section key={`${section.name}-${sectionIndex}`} aria-label={section.name} className="min-w-0">
        <h3 className="mb-6 px-5 text-xs font-semibold text-[#a9a9a9] uppercase sm:px-10">
          {section.name}{section.rows.length > 0 && ` · Rows ${section.rows[0].label}–${section.rows[section.rows.length - 1].label}`}
        </h3>
        <div role="region" aria-label={`${section.name} seat map`} tabIndex={0} className="overflow-x-auto px-1 pb-1 focus-visible:outline-2 focus-visible:outline-white">
          <div className="mx-auto flex w-max min-w-full flex-col items-center gap-2.5">
            {section.rows.map((row) => (
              <div key={row.label} className="flex w-max items-center gap-2">
                <span className="w-5 shrink-0 text-center text-xs font-semibold">{row.label}</span>
                {row.seats.map((seat) => {
                  const selected = selectedIds.has(seat.id);
                  const blocked = !canSelectSeat(seat);
                  return <Fragment key={seat.id}>
                    {seat.state === "unavailable" ? <span aria-hidden="true" className="size-13 shrink-0" /> : (
                      <button type="button" aria-label={`Seat ${seat.code}, ${selected ? "selected" : seat.isMine ? "held by you" : seat.state}`}
                        aria-pressed={selected} disabled={disabled || blocked}
                        onClick={() => onToggle(seat)}
                        className={`relative flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-sm font-extrabold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed ${
                          selected ? "bg-[#ec3013] text-white" : seat.state === "sold" ? "bg-[#1e2031] text-[#505261]" : seat.state === "held" && !seat.isMine ? "bg-[#1e2031] text-[#a9a9a9]" : "cursor-pointer border border-[#505261] bg-[#1e2031] text-white enabled:hover:border-white"
                        }`}>
                        {seat.state === "held" && !seat.isMine && <HeldPattern />}
                        <span className="relative">{seat.label}</span>
                      </button>
                    )}
                    {seat.aisleAfter && <span aria-hidden="true" className="w-4 shrink-0" />}
                  </Fragment>;
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    ))}
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-[#a9a9a9]">
      <span className="flex items-center gap-2"><span className="size-4 rounded-[5px] border border-[#505261] bg-[#1e2031]" />Available</span>
      <span className="flex items-center gap-2"><span className="size-4 rounded-[5px] bg-[#ec3013]" />Selected</span>
      <span className="flex items-center gap-2"><span className="size-4 rounded-[5px] bg-[#1e2031]" />Sold</span>
      <span className="flex items-center gap-2"><span className="relative size-4 overflow-hidden rounded-[5px] bg-[#1e2031]"><HeldPattern small /></span>Held by another user</span>
    </div>
  </div>
);

export default SeatMap;
