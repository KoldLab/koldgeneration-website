import { supabase } from '@/lib/supabase';
import type { UserMovie, UserMovieStatus } from '@/types/userMovie';

function rowToUserMovie(row: any): UserMovie {
  return {
    id: row.id,
    userId: row.user_id,
    imdbId: row.imdb_id,
    title: row.title,
    posterUrl: row.poster_url ?? null,
    releaseYear: row.release_year ?? null,
    runtime: row.runtime ?? null,
    genres: row.genres ?? [],
    overview: row.overview ?? '',
    status: row.status,
    addedAt: new Date(row.added_at),
    watchedAt: row.watched_at ? new Date(row.watched_at) : null,
  };
}

export async function getUserMovies(userId: string): Promise<UserMovie[]> {
  const { data, error } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToUserMovie);
}

export async function getUserMovie(
  userId: string,
  imdbId: string
): Promise<UserMovie | null> {
  const { data, error } = await supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', userId)
    .eq('imdb_id', imdbId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToUserMovie(data) : null;
}

export async function addUserMovie(
  userId: string,
  movie: Omit<UserMovie, 'id' | 'userId' | 'addedAt' | 'watchedAt'>,
  status: UserMovieStatus
): Promise<void> {
  const { error } = await supabase.from('user_movies').upsert(
    {
      user_id: userId,
      imdb_id: movie.imdbId,
      title: movie.title,
      poster_url: movie.posterUrl,
      release_year: movie.releaseYear,
      runtime: movie.runtime,
      genres: movie.genres,
      overview: movie.overview,
      status,
      added_at: new Date().toISOString(),
      watched_at: status === 'watched' ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,imdb_id' }
  );
  if (error) throw error;
}

export async function updateUserMovieStatus(
  userId: string,
  imdbId: string,
  status: UserMovieStatus
): Promise<void> {
  const { error } = await supabase
    .from('user_movies')
    .update({
      status,
      watched_at: status === 'watched' ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
    .eq('imdb_id', imdbId);
  if (error) throw error;
}

export async function removeUserMovie(
  userId: string,
  imdbId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_movies')
    .delete()
    .eq('user_id', userId)
    .eq('imdb_id', imdbId);
  if (error) throw error;
}
