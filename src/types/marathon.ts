export type MarathonMovie = {
  imdbId: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  overview: string;
  runtime: number | null;
  genres: string[];
  order: number;
};

export type MarathonMovieEntry = MarathonMovie & {
  watched: boolean;
  watchedAt?: Date | null;
  notes?: string;
};

export type MarathonVisibility = 'public' | 'private';

export type Marathon = {
  id: string;
  title: string;
  description: string;
  coverPosterUrl: string | null;
  movies: MarathonMovie[];
  createdBy: string;
  visibility: MarathonVisibility;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type UserMarathon = {
  id: string;
  marathonId: string;
  marathonTitle: string;
  userId: string;
  movies: MarathonMovieEntry[];
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
};

export type OMDBSearchMovie = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};

export type OMDBSearchResult = {
  Search: OMDBSearchMovie[];
  totalResults: string;
  Response: 'True' | 'False';
  Error?: string;
};

export type OMDBMovieDetail = {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbID: string;
  imdbRating: string;
  Type: string;
  Response: 'True' | 'False';
  Error?: string;
};
