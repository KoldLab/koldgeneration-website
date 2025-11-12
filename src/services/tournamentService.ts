import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Tournament, TournamentPlayer, CreateTournamentData, TournamentStatus } from '@/types/tournament';
import type { User } from 'firebase/auth';

const TOURNAMENTS_COLLECTION = 'tournaments';

// Generate a unique tournament code (6 alphanumeric characters)
function generateTournamentCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if a tournament code already exists
async function codeExists(code: string): Promise<boolean> {
  try {
    const q = query(collection(db, TOURNAMENTS_COLLECTION), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error: any) {
    // Check if error is due to request being blocked (likely by ad blocker)
    if (error?.message?.includes('ERR_BLOCKED_BY_CLIENT') || error?.code === 'blocked-by-client') {
      throw new Error('BLOCKED_BY_EXTENSION');
    }
    throw error;
  }
}

// Generate a unique tournament code
async function generateUniqueCode(): Promise<string> {
  let code = generateTournamentCode();
  let attempts = 0;
  while (await codeExists(code) && attempts < 10) {
    code = generateTournamentCode();
    attempts++;
  }
  if (attempts >= 10) {
    throw new Error('Failed to generate unique tournament code');
  }
  return code;
}

// Convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

// Convert Firestore document to Tournament
function docToTournament(docData: any, id: string): Tournament {
  return {
    id,
    code: docData.code,
    name: docData.name,
    description: docData.description || '',
    type: docData.type,
    maxPlayers: docData.maxPlayers,
    status: docData.status,
    ownerId: docData.ownerId,
    ownerDisplayName: docData.ownerDisplayName,
    ownerEmail: docData.ownerEmail,
    players: (docData.players || []).map((p: any) => ({
      ...p,
      registeredAt: timestampToDate(p.registeredAt),
    })),
    winScore: docData.winScore !== undefined ? docData.winScore : undefined,
    loseScore: docData.loseScore !== undefined ? docData.loseScore : undefined,
    createdAt: timestampToDate(docData.createdAt),
    updatedAt: timestampToDate(docData.updatedAt),
    startedAt: docData.startedAt ? timestampToDate(docData.startedAt) : undefined,
    completedAt: docData.completedAt ? timestampToDate(docData.completedAt) : undefined,
  };
}

// Create a new tournament
export async function createTournament(
  data: CreateTournamentData,
  user: User
): Promise<Tournament> {
  try {
    const code = await generateUniqueCode();
    
          const tournamentData = {
        code,
        name: data.name,
        description: data.description || '',
        type: data.type,
        maxPlayers: data.maxPlayers,
        winScore: data.winScore !== undefined ? data.winScore : undefined,
        loseScore: data.loseScore !== undefined ? data.loseScore : undefined,
        status: 'pending' as TournamentStatus,
        ownerId: user.uid,
        ownerDisplayName: user.displayName || 'Unknown',
        ownerEmail: user.email || '',
        players: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

    const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), tournamentData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create tournament');
    }

    return docToTournament(docSnap.data(), docSnap.id);
  } catch (error: any) {
    // Check if error is due to request being blocked (likely by ad blocker)
    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';
    if (
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('blocked') ||
      errorCode === 'unavailable' ||
      errorCode === 'deadline-exceeded'
    ) {
      throw new Error('BLOCKED_BY_EXTENSION');
    }
    throw error;
  }
}

// Get tournament by code
export async function getTournamentByCode(code: string): Promise<Tournament | null> {
  const q = query(
    collection(db, TOURNAMENTS_COLLECTION),
    where('code', '==', code),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return docToTournament(doc.data(), doc.id);
}

// Get tournament by ID
export async function getTournamentById(id: string): Promise<Tournament | null> {
  const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docToTournament(docSnap.data(), docSnap.id);
}

// Register an authenticated player to a tournament
export async function registerPlayer(tournamentId: string, user: User): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== 'open' && tournament.status !== 'pending') {
    throw new Error('Tournament is not accepting registrations');
  }

  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }

  // Check if user is already registered (allow owner to join)
  if (tournament.players.some((p) => p.userId === user.uid)) {
    throw new Error('You are already registered for this tournament');
  }

  const newPlayer: TournamentPlayer = {
    userId: user.uid,
    displayName: user.displayName || 'Unknown',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    registeredAt: new Date(),
    isGuest: false,
  };

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(tournamentRef, {
    players: [...tournament.players, newPlayer],
    updatedAt: serverTimestamp(),
  });
}

// Register a guest player (with pseudonym) to a tournament
export async function registerGuestPlayer(
  tournamentId: string,
  pseudonym: string,
  guestId: string
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status !== 'open' && tournament.status !== 'pending') {
    throw new Error('Tournament is not accepting registrations');
  }

  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }

  // Check if guest is already registered
  if (tournament.players.some((p) => p.guestId === guestId)) {
    throw new Error('You are already registered for this tournament');
  }

  // Check if pseudonym is already taken (for this tournament)
  if (tournament.players.some((p) => p.pseudonym?.toLowerCase() === pseudonym.toLowerCase())) {
    throw new Error('This pseudonym is already taken');
  }

  const newPlayer: TournamentPlayer = {
    guestId,
    displayName: pseudonym,
    pseudonym,
    registeredAt: new Date(),
    isGuest: true,
  };

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(tournamentRef, {
    players: [...tournament.players, newPlayer],
    updatedAt: serverTimestamp(),
  });
}

// Unregister an authenticated player from a tournament
export async function unregisterPlayer(tournamentId: string, userId: string): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status === 'in-progress' || tournament.status === 'completed' || tournament.status === 'paused') {
    throw new Error('Cannot unregister from a tournament that has started');
  }

  const updatedPlayers = tournament.players.filter((p) => p.userId !== userId);
  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(tournamentRef, {
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  });
}

// Unregister a guest player from a tournament
export async function unregisterGuestPlayer(tournamentId: string, guestId: string): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.status === 'in-progress' || tournament.status === 'completed' || tournament.status === 'paused') {
    throw new Error('Cannot unregister from a tournament that has started');
  }

  const updatedPlayers = tournament.players.filter((p) => p.guestId !== guestId);
  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(tournamentRef, {
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  });
}

// Get tournaments where a user has participated (as authenticated player)
export async function getTournamentsByUserId(userId: string): Promise<Tournament[]> {
  // Note: Firestore doesn't support querying nested array fields directly
  // We need to get all tournaments and filter in memory
  // This is acceptable for small datasets, but may need optimization for large scales
  const querySnapshot = await getDocs(collection(db, TOURNAMENTS_COLLECTION));
  const tournaments: Tournament[] = [];

  querySnapshot.forEach((docSnap) => {
    const tournament = docToTournament(docSnap.data(), docSnap.id);
    // Check if user is in the players array
    if (tournament.players.some((p) => p.userId === userId)) {
      tournaments.push(tournament);
    }
  });

  // Sort by most recent first
  tournaments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return tournaments;
}

// Update tournament status
export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentStatus
): Promise<void> {
  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'in-progress') {
    updateData.startedAt = serverTimestamp();
  } else if (status === 'completed') {
    updateData.completedAt = serverTimestamp();
  }

  await updateDoc(tournamentRef, updateData);
}
