// Required Firestore security rules — see firestore.rules in project root.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Note,
  NoteType,
  NoteColor,
  ChecklistItem,
  CollaboratorProfile,
} from '@/types/notes';

const NOTES_COLLECTION = 'notes';

function timestampToDate(ts: unknown): Date {
  if (ts && typeof ts === 'object' && 'toDate' in ts) {
    return (ts as Timestamp).toDate();
  }
  if (ts instanceof Date) return ts;
  return new Date(ts as string | number);
}

function docToNote(id: string, data: Record<string, unknown>): Note {
  return {
    id,
    userId: data.userId as string,
    collaborators: (data.collaborators as string[]) ?? [],
    collaboratorProfiles:
      (data.collaboratorProfiles as Record<string, CollaboratorProfile>) ?? {},
    inviteToken: (data.inviteToken as string | null) ?? null,
    title: (data.title as string) ?? '',
    type: (data.type as NoteType) ?? 'note',
    content: (data.content as string) ?? '',
    items: (data.items as ChecklistItem[]) ?? [],
    color: (data.color as NoteColor) ?? 'default',
    isPinned: (data.isPinned as boolean) ?? false,
    isPublic: (data.isPublic as boolean) ?? false,
    shareToken: (data.shareToken as string | null) ?? null,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

// ─── One-time reads ────────────────────────────────────────────────────────

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
  const data = {
    userId,
    collaborators: [],
    collaboratorProfiles: {},
    inviteToken: null,
    title: input.title,
    type: input.type,
    content: input.content ?? '',
    items: input.items ?? [],
    color: input.color ?? 'default',
    isPinned: false,
    isPublic: false,
    shareToken: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, NOTES_COLLECTION), data);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Failed to create note');
  return docToNote(snap.id, snap.data() as Record<string, unknown>);
}

export async function getNotesByUserId(userId: string): Promise<Note[]> {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToNote(d.id, d.data() as Record<string, unknown>)
  );
}

export async function getCollaboratorNotes(userId: string): Promise<Note[]> {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('collaborators', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    docToNote(d.id, d.data() as Record<string, unknown>)
  );
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  const snap = await getDoc(doc(db, NOTES_COLLECTION, noteId));
  if (!snap.exists()) return null;
  return docToNote(snap.id, snap.data() as Record<string, unknown>);
}

export async function getNoteByShareToken(
  shareToken: string
): Promise<Note | null> {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('shareToken', '==', shareToken),
    where('isPublic', '==', true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return docToNote(d.id, d.data() as Record<string, unknown>);
}

export async function getNoteByInviteToken(
  inviteToken: string
): Promise<Note | null> {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('inviteToken', '==', inviteToken)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return docToNote(d.id, d.data() as Record<string, unknown>);
}

// ─── Real-time subscription ────────────────────────────────────────────────

export function subscribeToNote(
  noteId: string,
  callback: (note: Note | null) => void
): () => void {
  const ref = doc(db, NOTES_COLLECTION, noteId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback(docToNote(snap.id, snap.data() as Record<string, unknown>));
      }
    },
    () => callback(null)
  );
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export async function updateNote(
  noteId: string,
  updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await updateDoc(doc(db, NOTES_COLLECTION, noteId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
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
  await updateDoc(doc(db, NOTES_COLLECTION, noteId), {
    collaborators: arrayUnion(user.uid),
    [`collaboratorProfiles.${user.uid}`]: {
      displayName: user.displayName,
      photoURL: user.photoURL,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function removeCollaborator(
  noteId: string,
  uid: string
): Promise<void> {
  await updateDoc(doc(db, NOTES_COLLECTION, noteId), {
    collaborators: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}
