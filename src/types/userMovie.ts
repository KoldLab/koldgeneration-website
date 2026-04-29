export type UserMovieStatus = 'watched' | 'want_to_watch';

export type UserMovie = {
  id: string;
  userId: string;
  imdbId: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  runtime: number | null;
  genres: string[];
  overview: string;
  status: UserMovieStatus;
  addedAt: Date;
  watchedAt: Date | null;
};
