-- Initial schema for koldgeneration-website
-- Mirrors the Firestore collections and security rules previously used.

-- ============================================================================
-- PROFILES (public view of auth.users)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.email
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    photo_url = excluded.photo_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- EXERCISES (user library)
-- ============================================================================

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  exercise_db_id text,
  source text not null check (source in ('custom', 'exercisedb')),
  image_url text,
  video_url text,
  target_muscles text[],
  secondary_muscles text[],
  equipment text[],
  body_parts text[],
  instructions text[],
  exercise_tips text[],
  variations text[],
  related_exercise_ids text[],
  keywords text[],
  overview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_user_created_idx on public.exercises (user_id, created_at desc);

alter table public.exercises enable row level security;

create policy "exercises_owner_all" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- WORKOUT ROUTINES
-- ============================================================================

create table public.workout_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_routines_user_created_idx on public.workout_routines (user_id, created_at desc);

alter table public.workout_routines enable row level security;

create policy "workout_routines_owner_all" on public.workout_routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- WORKOUT LOGS
-- ============================================================================

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references public.workout_routines(id) on delete set null,
  routine_name text,
  date timestamptz not null,
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  duration integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_logs_user_date_idx on public.workout_logs (user_id, date desc, created_at desc);

alter table public.workout_logs enable row level security;

create policy "workout_logs_owner_all" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- EXERCISE FAVORITES (one row per user)
-- ============================================================================

create table public.exercise_favorites (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exercise_db_ids text[] not null default '{}',
  custom_exercise_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercise_favorites enable row level security;

create policy "exercise_favorites_owner_all" on public.exercise_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- TOURNAMENTS
-- ============================================================================

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  type text not null,
  max_players integer not null,
  status text not null default 'pending',
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_display_name text not null,
  owner_email text not null,
  players jsonb not null default '[]'::jsonb,
  progress jsonb,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tournaments_owner_idx on public.tournaments (owner_id);
create index tournaments_code_idx on public.tournaments (code);

alter table public.tournaments enable row level security;

-- Anyone (anon + auth) can read tournaments so guests can join by code.
create policy "tournaments_read_all" on public.tournaments
  for select using (true);

create policy "tournaments_owner_insert" on public.tournaments
  for insert with check (auth.uid() = owner_id);

-- Owner can update freely. Authenticated non-owners can update (for joining/scoring).
-- Granular field-level checks live in service code; RLS would be cumbersome here.
create policy "tournaments_auth_update" on public.tournaments
  for update using (auth.role() = 'authenticated');

create policy "tournaments_owner_delete" on public.tournaments
  for delete using (auth.uid() = owner_id);

-- ============================================================================
-- MARATHONS (templates)
-- ============================================================================

create table public.marathons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cover_poster_url text,
  movies jsonb not null default '[]'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index marathons_created_by_idx on public.marathons (created_by);
create index marathons_visibility_idx on public.marathons (visibility, created_at desc);

alter table public.marathons enable row level security;

create policy "marathons_read_public_or_owner" on public.marathons
  for select using (visibility = 'public' or auth.uid() = created_by);

create policy "marathons_owner_insert" on public.marathons
  for insert with check (auth.uid() = created_by);

create policy "marathons_owner_update" on public.marathons
  for update using (auth.uid() = created_by);

create policy "marathons_owner_delete" on public.marathons
  for delete using (auth.uid() = created_by);

-- ============================================================================
-- USER MARATHONS (per-user progress)
-- ============================================================================

create table public.user_marathons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marathon_id uuid references public.marathons(id) on delete set null,
  marathon_title text not null,
  movies jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index user_marathons_user_updated_idx on public.user_marathons (user_id, updated_at desc);

alter table public.user_marathons enable row level security;

create policy "user_marathons_owner_all" on public.user_marathons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- USER MOVIES (personal want-to-watch / watched list)
-- ============================================================================

create table public.user_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  imdb_id text not null,
  title text not null,
  poster_url text,
  release_year integer,
  runtime integer,
  genres text[] not null default '{}',
  overview text not null default '',
  status text not null check (status in ('watched', 'want_to_watch')),
  added_at timestamptz not null default now(),
  watched_at timestamptz,
  unique (user_id, imdb_id)
);

create index user_movies_user_added_idx on public.user_movies (user_id, added_at desc);

alter table public.user_movies enable row level security;

create policy "user_movies_owner_all" on public.user_movies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- NOTES (with collaborators, invite/share tokens)
-- ============================================================================

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collaborators uuid[] not null default '{}',
  collaborator_profiles jsonb not null default '{}'::jsonb,
  invite_token text unique,
  title text not null default '',
  type text not null default 'note' check (type in ('note', 'list')),
  content text not null default '',
  items jsonb not null default '[]'::jsonb,
  color text not null default 'default',
  is_pinned boolean not null default false,
  is_public boolean not null default false,
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_collaborators_idx on public.notes using gin (collaborators);
create index notes_share_token_idx on public.notes (share_token) where share_token is not null;
create index notes_invite_token_idx on public.notes (invite_token) where invite_token is not null;

alter table public.notes enable row level security;

-- Read: public share, has invite token, owner, or collaborator.
create policy "notes_read" on public.notes
  for select using (
    is_public = true
    or invite_token is not null
    or auth.uid() = user_id
    or (auth.uid() is not null and auth.uid() = any(collaborators))
  );

create policy "notes_owner_insert" on public.notes
  for insert with check (auth.uid() = user_id);

-- Update: owner, existing collaborator, or someone joining via invite token.
create policy "notes_update" on public.notes
  for update using (
    auth.uid() = user_id
    or (auth.uid() is not null and auth.uid() = any(collaborators))
    or invite_token is not null
  );

create policy "notes_owner_delete" on public.notes
  for delete using (auth.uid() = user_id);

-- Realtime for notes (subscribeToNote)
alter publication supabase_realtime add table public.notes;
