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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Marathon, UserMarathon, MarathonMovie, MarathonMovieEntry } from '@/types/marathon';

const MARATHONS_COLLECTION = 'marathons';
const USER_MARATHONS_COLLECTION = 'userMarathons';

function timestampToDate(ts: any): Date {
  if (ts?.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

function docToMarathon(id: string, data: any): Marathon {
  return {
    id,
    title: data.title,
    description: data.description ?? '',
    coverPosterUrl: data.coverPosterUrl ?? null,
    movies: data.movies ?? [],
    createdBy: data.createdBy,
    visibility: data.visibility ?? 'public',
    tags: data.tags ?? [],
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

function docToUserMarathon(id: string, data: any): UserMarathon {
  return {
    id,
    marathonId: data.marathonId,
    marathonTitle: data.marathonTitle,
    userId: data.userId,
    movies: (data.movies ?? []).map((m: any) => ({
      ...m,
      watchedAt: m.watchedAt ? timestampToDate(m.watchedAt) : null,
    })),
    startedAt: timestampToDate(data.startedAt),
    completedAt: data.completedAt ? timestampToDate(data.completedAt) : null,
    updatedAt: timestampToDate(data.updatedAt),
  };
}

// ==================== MARATHONS (templates) ====================

export async function getPublicMarathons(): Promise<Marathon[]> {
  const q = query(
    collection(db, MARATHONS_COLLECTION),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToMarathon(d.id, d.data()));
}

export async function getUserCreatedMarathons(userId: string): Promise<Marathon[]> {
  const q = query(
    collection(db, MARATHONS_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToMarathon(d.id, d.data()));
}

export async function getMarathon(id: string): Promise<Marathon | null> {
  const snap = await getDoc(doc(db, MARATHONS_COLLECTION, id));
  if (!snap.exists()) return null;
  return docToMarathon(snap.id, snap.data());
}

export async function createMarathon(
  userId: string,
  data: Omit<Marathon, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<Marathon> {
  const ref = await addDoc(collection(db, MARATHONS_COLLECTION), {
    ...data,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return docToMarathon(snap.id, snap.data());
}

export async function updateMarathon(
  id: string,
  data: Partial<Omit<Marathon, 'id' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, MARATHONS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMarathon(id: string): Promise<void> {
  await deleteDoc(doc(db, MARATHONS_COLLECTION, id));
}

// ==================== USER MARATHONS (progress tracking) ====================

export async function getUserMarathons(userId: string): Promise<UserMarathon[]> {
  const q = query(
    collection(db, USER_MARATHONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToUserMarathon(d.id, d.data()));
}

export async function getUserMarathon(id: string): Promise<UserMarathon | null> {
  const snap = await getDoc(doc(db, USER_MARATHONS_COLLECTION, id));
  if (!snap.exists()) return null;
  return docToUserMarathon(snap.id, snap.data());
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
  const ref = await addDoc(collection(db, USER_MARATHONS_COLLECTION), {
    marathonId: marathon.id,
    marathonTitle: marathon.title,
    userId,
    movies,
    startedAt: serverTimestamp(),
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return docToUserMarathon(snap.id, snap.data());
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
  const ref = await addDoc(collection(db, USER_MARATHONS_COLLECTION), {
    marathonId: null,
    marathonTitle: title,
    userId,
    movies: entries,
    startedAt: serverTimestamp(),
    completedAt: null,
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return docToUserMarathon(snap.id, snap.data());
}

export async function updateMovieProgress(
  userMarathonId: string,
  movies: MarathonMovieEntry[]
): Promise<void> {
  const serialized = movies.map((m) => ({
    ...m,
    watchedAt: m.watchedAt ? Timestamp.fromDate(m.watchedAt) : null,
  }));

  const allWatched = movies.every((m) => m.watched);
  await updateDoc(doc(db, USER_MARATHONS_COLLECTION, userMarathonId), {
    movies: serialized,
    completedAt: allWatched ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserMarathon(id: string): Promise<void> {
  await deleteDoc(doc(db, USER_MARATHONS_COLLECTION, id));
}
