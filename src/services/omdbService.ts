import type { OMDBSearchMovie, OMDBSearchResult, OMDBMovieDetail, MarathonMovie } from '@/types/marathon';

const BASE_URL = 'https://www.omdbapi.com';

function getApiKey(): string {
  const key = import.meta.env.VITE_OMDB_API_KEY;
  if (!key) throw new Error('VITE_OMDB_API_KEY is not set');
  return key;
}

function parsePoster(poster: string): string | null {
  return poster && poster !== 'N/A' ? poster : null;
}

function parseRuntime(runtime: string): number | null {
  const match = runtime?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseYear(year: string): number | null {
  const n = parseInt(year, 10);
  return isNaN(n) ? null : n;
}

export async function searchMovies(query: string, page = 1): Promise<OMDBSearchResult> {
  const res = await fetch(
    `${BASE_URL}/?s=${encodeURIComponent(query)}&type=movie&page=${page}&apikey=${getApiKey()}`
  );
  if (!res.ok) throw new Error(`OMDB search failed: ${res.status}`);
  const data: OMDBSearchResult = await res.json();
  if (data.Response === 'False') throw new Error(data.Error ?? 'No results');
  return data;
}

export async function getMovieDetails(imdbId: string): Promise<OMDBMovieDetail> {
  const res = await fetch(`${BASE_URL}/?i=${imdbId}&apikey=${getApiKey()}`);
  if (!res.ok) throw new Error(`OMDB fetch failed: ${res.status}`);
  const data: OMDBMovieDetail = await res.json();
  if (data.Response === 'False') throw new Error(data.Error ?? 'Not found');
  return data;
}

export async function getMovieByTitle(title: string, year?: number): Promise<OMDBMovieDetail | null> {
  const yearParam = year ? `&y=${year}` : '';
  const res = await fetch(`${BASE_URL}/?t=${encodeURIComponent(title)}${yearParam}&apikey=${getApiKey()}`);
  if (!res.ok) return null;
  const data: OMDBMovieDetail = await res.json();
  return data.Response === 'True' ? data : null;
}

export function omdbDetailMovieToMarathonMovie(movie: OMDBMovieDetail, order: number): MarathonMovie {
  return {
    imdbId: movie.imdbID,
    title: movie.Title,
    posterUrl: parsePoster(movie.Poster),
    releaseYear: parseYear(movie.Year),
    overview: movie.Plot !== 'N/A' ? movie.Plot : '',
    runtime: parseRuntime(movie.Runtime),
    genres: movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [],
    order,
  };
}

export function omdbSearchMovieToMarathonMovie(movie: OMDBSearchMovie, order: number): MarathonMovie {
  return {
    imdbId: movie.imdbID,
    title: movie.Title,
    posterUrl: parsePoster(movie.Poster),
    releaseYear: parseYear(movie.Year),
    overview: '',
    runtime: null,
    genres: [],
    order,
  };
}

export async function omdbDetailToMarathonMovie(imdbId: string, order: number): Promise<MarathonMovie> {
  const detail = await getMovieDetails(imdbId);
  return {
    imdbId: detail.imdbID,
    title: detail.Title,
    posterUrl: parsePoster(detail.Poster),
    releaseYear: parseYear(detail.Year),
    overview: detail.Plot !== 'N/A' ? detail.Plot : '',
    runtime: parseRuntime(detail.Runtime),
    genres: detail.Genre !== 'N/A' ? detail.Genre.split(', ') : [],
    order,
  };
}
