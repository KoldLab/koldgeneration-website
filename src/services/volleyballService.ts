import { supabase } from '@/lib/supabase';
import type {
  SessionMatch,
  SessionPlayer,
  SessionTeam,
  VolleyballLevel,
  VolleyballPlayer,
  VolleyballPosition,
  VolleyballSession,
} from '@/types/volleyball';

type PlayerRow = {
  id: string;
  user_id: string;
  name: string;
  position: string;
  level: string;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  name: string | null;
  date: string;
  notes: string | null;
  players: SessionPlayer[] | null;
  teams: SessionTeam[] | null;
  matches: SessionMatch[] | null;
  share_code: string | null;
  created_at: string;
  updated_at: string;
};

function rowToPlayer(row: PlayerRow): VolleyballPlayer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    position: row.position as VolleyballPosition,
    level: row.level as VolleyballLevel,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToSession(row: SessionRow): VolleyballSession {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? '',
    date: row.date,
    notes: row.notes ?? '',
    players: row.players ?? [],
    teams: row.teams ?? [],
    matches: row.matches ?? [],
    shareCode: row.share_code ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** 6-char share code drawn from an unambiguous alphabet (no 0/O, 1/I/L). */
const SHARE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function makeShareCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SHARE_ALPHABET[Math.floor(Math.random() * SHARE_ALPHABET.length)];
  }
  return out;
}

// ==================== ROSTER ====================

export async function listPlayers(userId: string): Promise<VolleyballPlayer[]> {
  const { data, error } = await supabase
    .from('volleyball_players')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPlayer);
}

export async function createPlayer(
  userId: string,
  player: { name: string; position: VolleyballPosition; level: VolleyballLevel }
): Promise<VolleyballPlayer> {
  const { data, error } = await supabase
    .from('volleyball_players')
    .insert({
      user_id: userId,
      name: player.name,
      position: player.position,
      level: player.level,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToPlayer(data);
}

export async function updatePlayer(
  id: string,
  patch: Partial<{
    name: string;
    position: VolleyballPosition;
    level: VolleyballLevel;
  }>
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.position !== undefined) row.position = patch.position;
  if (patch.level !== undefined) row.level = patch.level;
  const { error } = await supabase
    .from('volleyball_players')
    .update(row)
    .eq('id', id);
  if (error) throw error;
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase
    .from('volleyball_players')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== SESSIONS ====================

export async function listSessions(
  userId: string
): Promise<VolleyballSession[]> {
  const { data, error } = await supabase
    .from('volleyball_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSession);
}

export async function getSession(
  id: string
): Promise<VolleyballSession | null> {
  const { data, error } = await supabase
    .from('volleyball_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSession(data) : null;
}

export async function createSession(
  userId: string,
  session: {
    name?: string;
    date?: string;
    notes?: string;
    players?: SessionPlayer[];
    teams?: SessionTeam[];
    matches?: SessionMatch[];
  }
): Promise<VolleyballSession> {
  const { data, error } = await supabase
    .from('volleyball_sessions')
    .insert({
      user_id: userId,
      name: session.name ?? '',
      date: session.date ?? new Date().toISOString().slice(0, 10),
      notes: session.notes ?? '',
      players: session.players ?? [],
      teams: session.teams ?? [],
      matches: session.matches ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSession(data);
}

export async function updateSession(
  id: string,
  patch: Partial<{
    name: string;
    date: string;
    notes: string;
    players: SessionPlayer[];
    teams: SessionTeam[];
    matches: SessionMatch[];
  }>
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.players !== undefined) row.players = patch.players;
  if (patch.teams !== undefined) row.teams = patch.teams;
  if (patch.matches !== undefined) row.matches = patch.matches;
  const { error } = await supabase
    .from('volleyball_sessions')
    .update(row)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('volleyball_sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==================== SHARING ====================

/**
 * Generate (or rotate) the public share code for a session. Returns the code.
 * Retries on the unlikely event of a code collision (unique index).
 */
export async function generateShareCode(sessionId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeShareCode();
    const { error } = await supabase
      .from('volleyball_sessions')
      .update({ share_code: code, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (!error) return code;
    // 23505 = unique violation; retry with a new code.
    if (
      typeof (error as { code?: string }).code === 'string' &&
      (error as { code?: string }).code !== '23505'
    ) {
      throw error;
    }
  }
  throw new Error('Could not generate a unique share code after 5 attempts');
}

export async function revokeShareCode(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('volleyball_sessions')
    .update({ share_code: null, updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

/** Look up a session by its short share code. Returns null if not found. */
export async function getSessionByCode(
  code: string
): Promise<VolleyballSession | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('volleyball_sessions')
    .select('*')
    .eq('share_code', normalized)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSession(data) : null;
}

// ==================== REALTIME ====================

/**
 * Subscribe to live updates on a single session row. Fires `callback` with the
 * latest session (or `null` if deleted). Returns an unsubscribe function.
 */
export function subscribeToSession(
  sessionId: string,
  callback: (session: VolleyballSession | null) => void
): () => void {
  const channel = supabase
    .channel(`volleyball_session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'volleyball_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else if (payload.new) {
          callback(rowToSession(payload.new as SessionRow));
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
