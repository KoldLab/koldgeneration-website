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

export type TMDBSearchMovie = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
};

export type TMDBSearchResult = {
  results: TMDBSearchMovie[];
  total_results: number;
  total_pages: number;
  page: number;
};

export type TMDBMovieDetail = {
  id: number;
  imdb_id: string | null;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  certification: string | null;
  director: string | null;
  cast: string[];
};

export type OMDBSearchMovie = TMDBSearchMovie;
export type OMDBSearchResult = TMDBSearchResult;
export type OMDBMovieDetail = TMDBMovieDetail;
