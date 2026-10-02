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
