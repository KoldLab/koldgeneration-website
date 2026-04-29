import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserMovie, UserMovieStatus } from '@/types/userMovie';

const COLLECTION = 'userMovies';

function docId(userId: string, imdbId: string) {
  return `${userId}_${imdbId}`;
}

function timestampToDate(ts: any): Date {
  if (ts?.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts);
}

function docToUserMovie(id: string, data: any): UserMovie {
  return {
    id,
    userId: data.userId,
    imdbId: data.imdbId,
    title: data.title,
    posterUrl: data.posterUrl ?? null,
    releaseYear: data.releaseYear ?? null,
    runtime: data.runtime ?? null,
    genres: data.genres ?? [],
    overview: data.overview ?? '',
    status: data.status,
    addedAt: timestampToDate(data.addedAt),
    watchedAt: data.watchedAt ? timestampToDate(data.watchedAt) : null,
  };
}

export async function getUserMovies(userId: string): Promise<UserMovie[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('addedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => docToUserMovie(d.id, d.data()));
}

export async function getUserMovie(userId: string, imdbId: string): Promise<UserMovie | null> {
  const snap = await getDoc(doc(db, COLLECTION, docId(userId, imdbId)));
  if (!snap.exists()) return null;
  return docToUserMovie(snap.id, snap.data());
}

export async function addUserMovie(
  userId: string,
  movie: Omit<UserMovie, 'id' | 'userId' | 'addedAt' | 'watchedAt'>,
  status: UserMovieStatus
): Promise<void> {
  await setDoc(doc(db, COLLECTION, docId(userId, movie.imdbId)), {
    userId,
    ...movie,
    status,
    addedAt: serverTimestamp(),
    watchedAt: status === 'watched' ? serverTimestamp() : null,
  });
}

export async function updateUserMovieStatus(
  userId: string,
  imdbId: string,
  status: UserMovieStatus
): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, docId(userId, imdbId)),
    {
      status,
      watchedAt: status === 'watched' ? Timestamp.now() : null,
    },
    { merge: true }
  );
}

export async function removeUserMovie(userId: string, imdbId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, docId(userId, imdbId)));
}
