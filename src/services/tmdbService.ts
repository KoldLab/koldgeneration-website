import i18n from '@/i18n/config';
import type { MarathonMovie, TMDBMovieDetail, TMDBSearchResult, TMDBSearchMovie } from '@/types/marathon';

const BASE_URL = 'https://api.themoviedb.org/3';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

type TMDBRawMovieDetail = Omit<TMDBMovieDetail, 'certification' | 'director' | 'cast'> & {
  credits?: {
    crew?: { job: string; name: string }[];
    cast?: { name: string }[];
  };
  release_dates?: {
    results?: { iso_3166_1: string; release_dates?: { certification?: string }[] }[];
  };
  external_ids?: { imdb_id?: string | null };
};

type TMDBFindResult = {
  movie_results?: { id: number }[];
};

function getApiKey(): string {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) throw new Error('VITE_TMDB_API_KEY is not set');
  return key;
}

function getLanguage(): string {
  return i18n.resolvedLanguage?.startsWith('fr') || i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-US';
}

function makeUrl(path: string, params: Record<string, string | number | boolean> = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', getApiKey());
  url.searchParams.set('language', getLanguage());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function movieKey(tmdbId: number): string {
  return `tmdb:${tmdbId}`;
}

function posterUrl(path: string | null): string | null {
  return path ? `${POSTER_BASE_URL}${path}` : null;
}

function releaseYear(releaseDate: string): number | null {
  const year = parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function certification(movie: TMDBRawMovieDetail): string | null {
  const country = getLanguage() === 'fr-FR' ? 'FR' : 'US';
  const releases = movie.release_dates?.results ?? [];
  const preferred = releases.find((release) => release.iso_3166_1 === country)
    ?? releases.find((release) => release.iso_3166_1 === 'US');
  return preferred?.release_dates?.find((release) => release.certification)?.certification || null;
}

function normalizeDetail(movie: TMDBRawMovieDetail): TMDBMovieDetail {
  return {
    id: movie.id,
    imdb_id: movie.external_ids?.imdb_id ?? movie.imdb_id ?? null,
    title: movie.title,
    release_date: movie.release_date,
    poster_path: movie.poster_path,
    overview: movie.overview,
    runtime: movie.runtime,
    genres: movie.genres,
    vote_average: movie.vote_average,
    certification: certification(movie),
    director: movie.credits?.crew?.find((person) => person.job === 'Director')?.name ?? null,
    cast: movie.credits?.cast?.slice(0, 5).map((person) => person.name) ?? [],
  };
}

async function tmdbIdFromMovieId(id: string): Promise<number> {
  if (id.startsWith('tmdb:')) return parseInt(id.replace('tmdb:', ''), 10);
  if (/^\d+$/.test(id)) return parseInt(id, 10);

  const res = await fetch(makeUrl(`/find/${encodeURIComponent(id)}`, { external_source: 'imdb_id' }));
  if (!res.ok) throw new Error(`TMDb find failed: ${res.status}`);
  const data: TMDBFindResult = await res.json();
  const tmdbId = data.movie_results?.[0]?.id;
  if (!tmdbId) throw new Error('Movie not found');
  return tmdbId;
}

export async function searchMovies(query: string, page = 1): Promise<TMDBSearchResult> {
  const res = await fetch(makeUrl('/search/movie', {
    query,
    page,
    include_adult: false,
  }));
  if (!res.ok) throw new Error(`TMDb search failed: ${res.status}`);
  return res.json();
}

export async function getMovieDetails(movieId: string): Promise<TMDBMovieDetail> {
  const tmdbId = await tmdbIdFromMovieId(movieId);
  const res = await fetch(makeUrl(`/movie/${tmdbId}`, { append_to_response: 'credits,release_dates,external_ids' }));
  if (!res.ok) throw new Error(`TMDb fetch failed: ${res.status}`);
  return normalizeDetail(await res.json());
}

export async function getMovieByTitle(title: string, year?: number): Promise<TMDBMovieDetail | null> {
  const data = await searchMovies(title, 1);
  const match = data.results.find((movie) => !year || releaseYear(movie.release_date) === year) ?? data.results[0];
  return match ? getMovieDetails(movieKey(match.id)) : null;
}

export function tmdbDetailMovieToMarathonMovie(movie: TMDBMovieDetail, order: number): MarathonMovie {
  return {
    imdbId: movieKey(movie.id),
    title: movie.title,
    posterUrl: posterUrl(movie.poster_path),
    releaseYear: releaseYear(movie.release_date),
    overview: movie.overview,
    runtime: movie.runtime,
    genres: movie.genres.map((genre) => genre.name),
    order,
  };
}

export function tmdbSearchMovieToMarathonMovie(movie: TMDBSearchMovie, order: number): MarathonMovie {
  return {
    imdbId: movieKey(movie.id),
    title: movie.title,
    posterUrl: posterUrl(movie.poster_path),
    releaseYear: releaseYear(movie.release_date),
    overview: movie.overview,
    runtime: null,
    genres: [],
    order,
  };
}

export async function tmdbDetailToMarathonMovie(movieId: string, order: number): Promise<MarathonMovie> {
  return tmdbDetailMovieToMarathonMovie(await getMovieDetails(movieId), order);
}

export const omdbDetailMovieToMarathonMovie = tmdbDetailMovieToMarathonMovie;
export const omdbSearchMovieToMarathonMovie = tmdbSearchMovieToMarathonMovie;
export const omdbDetailToMarathonMovie = tmdbDetailToMarathonMovie;
