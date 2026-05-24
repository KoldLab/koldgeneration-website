import { supabase } from '@/lib/supabase';
import type {
  Note,
  NoteType,
  NoteColor,
  ChecklistItem,
  CollaboratorProfile,
} from '@/types/notes';

function rowToNote(row: any): Note {
  return {
    id: row.id,
    userId: row.user_id,
    collaborators: row.collaborators ?? [],
    collaboratorProfiles:
      (row.collaborator_profiles as Record<string, CollaboratorProfile>) ?? {},
    inviteToken: row.invite_token ?? null,
    title: row.title ?? '',
    type: (row.type as NoteType) ?? 'note',
    content: row.content ?? '',
    items: (row.items as ChecklistItem[]) ?? [],
    color: (row.color as NoteColor) ?? 'default',
    isPinned: row.is_pinned ?? false,
    isPublic: row.is_public ?? false,
    shareToken: row.share_token ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function createNote(
  userId: string,
  input: {
    title: string;
    type: NoteType;
    content?: string;
    items?: ChecklistItem[];
    color?: NoteColor;
  }
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      collaborators: [],
      collaborator_profiles: {},
      invite_token: null,
      title: input.title,
      type: input.type,
      content: input.content ?? '',
      items: input.items ?? [],
      color: input.color ?? 'default',
      is_pinned: false,
      is_public: false,
      share_token: null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToNote(data);
}

export async function getNotesByUserId(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function getCollaboratorNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .contains('collaborators', [userId])
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToNote(data) : null;
}

export async function getNoteByShareToken(
  shareToken: string
): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_public', true)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToNote(data) : null;
}

export async function getNoteByInviteToken(
  inviteToken: string
): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('invite_token', inviteToken)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToNote(data) : null;
}

// ─── Real-time subscription ────────────────────────────────────────────────

export function subscribeToNote(
  noteId: string,
  callback: (note: Note | null) => void
): () => void {
  // Fetch initial state then subscribe to changes.
  void getNoteById(noteId)
    .then(callback)
    .catch(() => callback(null));

  const channel = supabase
    .channel(`note:${noteId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `id=eq.${noteId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else if (payload.new) {
          callback(rowToNote(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export async function updateNote(
  noteId: string,
  updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.collaborators !== undefined)
    row.collaborators = updates.collaborators;
  if (updates.collaboratorProfiles !== undefined)
    row.collaborator_profiles = updates.collaboratorProfiles;
  if (updates.inviteToken !== undefined) row.invite_token = updates.inviteToken;
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.items !== undefined) row.items = updates.items;
  if (updates.color !== undefined) row.color = updates.color;
  if (updates.isPinned !== undefined) row.is_pinned = updates.isPinned;
  if (updates.isPublic !== undefined) row.is_public = updates.isPublic;
  if (updates.shareToken !== undefined) row.share_token = updates.shareToken;

  const { error } = await supabase.from('notes').update(row).eq('id', noteId);
  if (error) throw error;
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
}

// ─── Sharing (read-only public link) ──────────────────────────────────────

export async function enableSharing(
  noteId: string,
  existingToken?: string | null
): Promise<string> {
  const shareToken = existingToken ?? crypto.randomUUID();
  await updateNote(noteId, { isPublic: true, shareToken });
  return shareToken;
}

export async function disableSharing(noteId: string): Promise<void> {
  await updateNote(noteId, { isPublic: false });
}

// ─── Collaboration (invite link → editable access) ────────────────────────

export async function generateInviteToken(noteId: string): Promise<string> {
  const inviteToken = crypto.randomUUID();
  await updateNote(noteId, { inviteToken });
  return inviteToken;
}

export async function revokeInviteToken(noteId: string): Promise<void> {
  await updateNote(noteId, { inviteToken: null });
}

export async function joinNoteAsCollaborator(
  noteId: string,
  user: { uid: string; displayName: string | null; photoURL: string | null }
): Promise<void> {
  const note = await getNoteById(noteId);
  if (!note) throw new Error('Note not found');

  if (note.collaborators.includes(user.uid)) return;

  const updatedCollaborators = [...note.collaborators, user.uid];
  const updatedProfiles = {
    ...note.collaboratorProfiles,
    [user.uid]: {
      displayName: user.displayName,
      photoURL: user.photoURL,
    },
  };

  const { error } = await supabase
    .from('notes')
    .update({
      collaborators: updatedCollaborators,
      collaborator_profiles: updatedProfiles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);
  if (error) throw error;
}

export async function removeCollaborator(
  noteId: string,
  uid: string
): Promise<void> {
  const note = await getNoteById(noteId);
  if (!note) throw new Error('Note not found');

  const updatedCollaborators = note.collaborators.filter((c) => c !== uid);
  const updatedProfiles = { ...note.collaboratorProfiles };
  delete updatedProfiles[uid];

  const { error } = await supabase
    .from('notes')
    .update({
      collaborators: updatedCollaborators,
      collaborator_profiles: updatedProfiles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);
  if (error) throw error;
}
