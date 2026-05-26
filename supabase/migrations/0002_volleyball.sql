-- Volleyball team maker: persistent roster + sessions with teams and match scores.

-- ============================================================================
-- VOLLEYBALL PLAYERS (per-user roster)
-- ============================================================================

create table public.volleyball_players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position text not null check (position in ('setter', 'outside', 'opposite', 'middle', 'libero')),
  level text not null check (level in ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volleyball_players_user_idx on public.volleyball_players (user_id, name);

alter table public.volleyball_players enable row level security;

create policy "volleyball_players_owner_all" on public.volleyball_players
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- VOLLEYBALL SESSIONS
-- ============================================================================
-- players: jsonb array of SessionPlayer
--   = { id: string, name: string, position: string, level: string, rosterPlayerId: string | null }
-- teams: jsonb array of { id: string, name: string, playerIds: string[] }
-- matches: jsonb array of { id: string, teamAId: string, teamBId: string,
--   sets: { teamAScore: number, teamBScore: number }[], createdAt: string }

create table public.volleyball_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  date date not null default current_date,
  notes text not null default '',
  players jsonb not null default '[]'::jsonb,
  teams jsonb not null default '[]'::jsonb,
  matches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volleyball_sessions_user_date_idx on public.volleyball_sessions (user_id, date desc, created_at desc);

alter table public.volleyball_sessions enable row level security;

create policy "volleyball_sessions_owner_all" on public.volleyball_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
