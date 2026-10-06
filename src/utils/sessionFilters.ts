import type { FilterOptions } from "../types/filterOptions";
import type { SessionsParams } from "../types/sessions";

export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const nextSevenDates = (base = new Date()): string[] =>
  Array.from({ length: 7 }, (_, offset) => {
    // Local noon and calendar arithmetic avoid UTC shifts and 23/25-hour days.
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12);
    date.setDate(date.getDate() + offset);
    return localDate(date);
  });

export const readSessionsParams = (query: URLSearchParams): SessionsParams => {
  const date = query.get("date") ?? "";
  const parsed = new Date(`${date}T12:00:00`);
  const page = Number(query.get("page") ?? 1);

  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && localDate(parsed) === date ? date : localDate(),
    venues: [...new Set(query.getAll("venues[]"))],
    formats: [...new Set(query.getAll("formats[]"))],
    languages: [...new Set(query.getAll("languages[]"))],
    bands: [...new Set(query.getAll("bands[]"))],
    search: query.get("search") ?? "",
    sort: query.get("sort") || "time_asc",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
};

export const availableFormats = (options: FilterOptions, venues: string[]) => {
  if (!venues.length) return options.formats;
  const supported = new Set(options.venues
    .filter((venue) => venues.includes(venue.slug))
    .flatMap((venue) => venue.formats.map((format) => format.slug)));
  return options.formats.filter((format) => supported.has(format.slug));
};

export const sessionsQuery = (params: SessionsParams) => {
  const query = new URLSearchParams();
  query.set("date", params.date);
  for (const key of ["venues", "formats", "languages", "bands"] as const) {
    params[key].forEach((value) => query.append(`${key}[]`, value));
  }
  if (params.search) query.set("search", params.search);
  query.set("sort", params.sort);
  query.set("page", String(params.page));
  return query;
};

export const clearSessionsFilters = (params: SessionsParams): SessionsParams => ({
  ...params,
  venues: [],
  formats: [],
  languages: [],
  bands: [],
  page: 1,
});

export const paginationItems = (current: number, last: number): (number | string)[] => {
  const pages = new Set([1, last, current - 1, current, current + 1]);
  if (current <= 2) pages.add(3);
  if (current >= last - 1) pages.add(last - 2);
  const sorted = [...pages].filter((page) => page > 0 && page <= last).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous === 2) return [page - 1, page];
    if (previous && page - previous > 2) return [`gap-${page}`, page];
    return [page];
  });
};
