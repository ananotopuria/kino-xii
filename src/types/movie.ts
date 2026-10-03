export type AgeRating = {
  code: string;
  minAge: number;
  description: string;
};

export type Genre = {
  id: number;
  slug: string;
  name: string;
};

export type MovieFormat = {
  id: number;
  slug: string;
  name: string;
  priceUplift: number;
};

export type Movie = {
  id: number;
  slug: string;
  title: string;
  kind: string;
  runtimeMinutes: number;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  isComingSoon: boolean;
  isNotified: boolean;
  isFeatured: boolean;
  fromPrice: number;
  ageRating: AgeRating;
  genres: Genre[];
  formats: MovieFormat[];
};

export type MoviesResponse = {
  data: Movie[];
};

export type MovieDetails = Movie & {
  synopsis: string;
  director: string;
  cast: string;
  availableDates: string[];
};

export type MovieDetailsResponse = {
  data: MovieDetails;
};

export type Venue = {
  id: number;
  slug: string;
  name: string;
  city: string;
};

export type SessionFormat = {
  id: number;
  slug: string;
  name: string;
  priceUplift: number;
};

export type SessionLanguage = {
  id: number;
  slug: string;
  name: string;
};

export type MovieSession = {
  id: number;
  startsAt: string;
  date: string;
  time: string;
  timeBand: string;
  price: number;
  seatsLeft: number;
  isSoldOut: boolean;

  hall: {
    id: number;
    name: string;
    venue: Venue;
  };

  venue: Venue;
  format: SessionFormat;
  language: SessionLanguage;
};

export type SessionsByVenue = {
  venue: Venue;
  sessions: MovieSession[];
};

export type MovieSessionsResponse = {
  data: SessionsByVenue[];
};
