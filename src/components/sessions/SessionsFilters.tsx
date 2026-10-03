import type { ReactNode } from "react";
import type { FilterOptions } from "../../types/filterOptions";
import type { SessionFilterKey, SessionsParams } from "../../types/sessions";
import { availableFormats, localDate } from "../../utils/sessionFilters";
import SessionDateFilter from "./SessionDateFilter";

type SessionsFiltersProps = {
  options?: FilterOptions;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  params: SessionsParams;
  onToggle: (key: SessionFilterKey, value: string) => void;
  onSelectDate: (date: string) => void;
  onClear: () => void;
};

const FilterSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="min-w-0 border-b border-[#2a2c3d] pb-6">
    <legend className="mb-3 text-xs font-semibold tracking-[0.72px] text-[#a9a9a9] uppercase">{title}</legend>
    <div className="space-y-3">{children}</div>
  </fieldset>
);

const SessionsFilters = ({ options, isLoading, isError, onRetry, params, onToggle, onSelectDate, onClear }: SessionsFiltersProps) => {
  const activeCount = params.venues.length + params.formats.length + params.languages.length + params.bands.length + Number(params.date !== localDate()) + Number(Boolean(params.search));
  const checkbox = (key: SessionFilterKey, value: string, label: string, detail?: string) => (
    <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold leading-[18px]">
      <input type="checkbox" value={value} checked={params[key].includes(value)} onChange={() => onToggle(key, value)}
        className="size-4.5 shrink-0 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[#505261] checked:border-0 checked:bg-[url('/sessions/checked.svg')] checked:bg-center checked:bg-no-repeat focus-visible:outline-2 focus-visible:outline-white" />
      <span>{label}{detail && <span className="ml-1 text-xs font-normal text-[#a9a9a9]">· {detail}</span>}</span>
    </label>
  );

  return (
    <aside aria-label="Session filters" className="flex w-full shrink-0 flex-col gap-6 self-start rounded-2xl bg-[#1e2031] p-6 lg:w-80">
      <h2 className="text-lg font-extrabold leading-none">Filters</h2>
      {isLoading && <p role="status" className="text-sm text-[#a9a9a9]">Loading filters...</p>}
      {isError && <div role="alert" className="text-sm text-red-400">Failed to load filters. <button type="button" onClick={onRetry} className="cursor-pointer underline">Try again</button></div>}
      {options && <>
        <FilterSection title="Venue">{options.venues.map((venue) => checkbox("venues", venue.slug, venue.name, venue.city))}</FilterSection>
        <FilterSection title="Date"><SessionDateFilter selectedDate={params.date} onSelectDate={onSelectDate} /></FilterSection>
        <FilterSection title="Format">{availableFormats(options, params.venues).map((format) => checkbox("formats", format.slug, format.name))}</FilterSection>
        <FilterSection title="Language">{options.languages.map((language) => checkbox("languages", language.slug, language.name))}</FilterSection>
        <FilterSection title="Time of day">{options.timeBands.map((band) => checkbox("bands", band.id, band.label))}</FilterSection>
      </>}
      <div className="space-y-3 text-center">
        <button type="button" onClick={onClear} className="w-full cursor-pointer rounded-full border border-[#a9a9a9] px-3 py-2.25 text-xs font-semibold leading-none hover:bg-white/10">Clear filters</button>
        {activeCount > 0 && <p className="text-xs text-[#a9a9a9]">{activeCount} {activeCount === 1 ? "filter" : "filters"} active</p>}
      </div>
    </aside>
  );
};

export default SessionsFilters;
