import { supabase } from '@/lib/supabase';
import type {
  Marathon,
  UserMarathon,
  MarathonMovie,
  MarathonMovieEntry,
} from '@/types/marathon';

function rowToMarathon(row: any): Marathon {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    coverPosterUrl: row.cover_poster_url ?? null,
    movies: row.movies ?? [],
    createdBy: row.created_by,
    visibility: row.visibility ?? 'public',
    tags: row.tags ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToUserMarathon(row: any): UserMarathon {
  return {
    id: row.id,
    marathonId: row.marathon_id,
    marathonTitle: row.marathon_title,
    userId: row.user_id,
    movies: (row.movies ?? []).map((m: any) => ({
      ...m,
      watchedAt: m.watchedAt ? new Date(m.watchedAt) : null,
    })),
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    updatedAt: new Date(row.updated_at),
  };
}

// ==================== MARATHONS (templates) ====================

export async function getPublicMarathons(): Promise<Marathon[]> {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMarathon);
}

export async function getUserCreatedMarathons(
  userId: string
): Promise<Marathon[]> {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMarathon);
}

export async function getMarathon(id: string): Promise<Marathon | null> {
  const { data, error } = await supabase
    .from('marathons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToMarathon(data) : null;
}

export async function createMarathon(
  userId: string,
  data: Omit<Marathon, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<Marathon> {
  const { data: row, error } = await supabase
    .from('marathons')
    .insert({
      title: data.title,
      description: data.description ?? '',
      cover_poster_url: data.coverPosterUrl ?? null,
      movies: data.movies ?? [],
      created_by: userId,
      visibility: data.visibility ?? 'public',
      tags: data.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return rowToMarathon(row);
}

export async function updateMarathon(
  id: string,
  data: Partial<Omit<Marathon, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.title !== undefined) row.title = data.title;
  if (data.description !== undefined) row.description = data.description;
  if (data.coverPosterUrl !== undefined)
    row.cover_poster_url = data.coverPosterUrl;
  if (data.movies !== undefined) row.movies = data.movies;
  if (data.visibility !== undefined) row.visibility = data.visibility;
  if (data.tags !== undefined) row.tags = data.tags;

  const { error } = await supabase.from('marathons').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteMarathon(id: string): Promise<void> {
  const { error } = await supabase.from('marathons').delete().eq('id', id);
  if (error) throw error;
}

// ==================== USER MARATHONS ====================

export async function getUserMarathons(
  userId: string
): Promise<UserMarathon[]> {
  const { data, error } = await supabase
    .from('user_marathons')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToUserMarathon);
}

export async function getUserMarathon(
  id: string
): Promise<UserMarathon | null> {
  const { data, error } = await supabase
    .from('user_marathons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToUserMarathon(data) : null;
}

export async function startMarathon(
  userId: string,
  marathon: Marathon
): Promise<UserMarathon> {
  const movies: MarathonMovieEntry[] = marathon.movies.map((m) => ({
    ...m,
    watched: false,
    watchedAt: null,
    notes: '',
  }));
  const { data, error } = await supabase
    .from('user_marathons')
    .insert({
      marathon_id: marathon.id,
      marathon_title: marathon.title,
      user_id: userId,
      movies,
      completed_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToUserMarathon(data);
}

export async function startCustomMarathon(
  userId: string,
  title: string,
  movies: MarathonMovie[]
): Promise<UserMarathon> {
  const entries: MarathonMovieEntry[] = movies.map((m) => ({
    ...m,
    watched: false,
    watchedAt: null,
    notes: '',
  }));
  const { data, error } = await supabase
    .from('user_marathons')
    .insert({
      marathon_id: null,
      marathon_title: title,
      user_id: userId,
      movies: entries,
      completed_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToUserMarathon(data);
}

export async function updateMovieProgress(
  userMarathonId: string,
  movies: MarathonMovieEntry[]
): Promise<void> {
  const serialized = movies.map((m) => ({
    ...m,
    watchedAt: m.watchedAt ? m.watchedAt.toISOString() : null,
  }));
  const allWatched = movies.every((m) => m.watched);

  const { error } = await supabase
    .from('user_marathons')
    .update({
      movies: serialized,
      completed_at: allWatched ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userMarathonId);
  if (error) throw error;
}

export async function deleteUserMarathon(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_marathons')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
