-- Volleyball session sharing: short share_code + permissive RLS for guests.
-- Pattern matches notes.invite_token in 0001_init.sql.

alter table public.volleyball_sessions
  add column if not exists share_code text;

-- Short unique codes (6 chars) — the secret IS the URL, so unique index suffices.
create unique index if not exists volleyball_sessions_share_code_idx
  on public.volleyball_sessions (share_code)
  where share_code is not null;

-- Drop the owner-only policy and replace with read/update granting guest access
-- to any session whose share_code is set. Insert/delete stay owner-only.
drop policy if exists "volleyball_sessions_owner_all" on public.volleyball_sessions;

create policy "volleyball_sessions_read" on public.volleyball_sessions
  for select using (
    auth.uid() = user_id
    or share_code is not null
  );

create policy "volleyball_sessions_owner_insert" on public.volleyball_sessions
  for insert with check (auth.uid() = user_id);

create policy "volleyball_sessions_update" on public.volleyball_sessions
  for update using (
    auth.uid() = user_id
    or share_code is not null
  );

create policy "volleyball_sessions_owner_delete" on public.volleyball_sessions
  for delete using (auth.uid() = user_id);

-- Realtime for live score syncing across devices.
alter publication supabase_realtime add table public.volleyball_sessions;
