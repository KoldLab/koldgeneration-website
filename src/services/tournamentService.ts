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
import type {
  Tournament,
  TournamentPlayer,
  CreateTournamentData,
  TournamentStatus,
  TournamentMatch,
  TournamentMatchHistoryEntry,
  TournamentMatchParticipant,
  TournamentMatchScore,
  TournamentProgress,
  TournamentRound,
} from '@/types/tournament';
import {
  generateSingleEliminationProgress,
  applySingleEliminationResult,
  type SingleEliminationResultPayload,
} from './brackets/singleElimination';
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

function convertMatchParticipant(participant: any): TournamentMatchParticipant | null {
  if (!participant) return null;
  const key =
    participant.key ||
    participant.participantKey ||
    (participant.userId ? `user:${participant.userId}` : undefined) ||
    (participant.guestId ? `guest:${participant.guestId}` : undefined);

  if (!key) {
    return null;
  }

  return {
    key,
    displayName: participant.displayName || participant.name || 'Unknown',
    seed: typeof participant.seed === 'number' ? participant.seed : undefined,
    slot:
      typeof participant.slot === 'number'
        ? participant.slot
        : typeof participant.slot === 'string' && participant.slot !== ''
        ? Number(participant.slot)
        : undefined,
  };
}

function convertMatchScores(scores: any): TournamentMatchScore[] {
  if (!scores) return [];

  if (Array.isArray(scores)) {
    return scores
      .map((score) => ({
        participantKey: score.participantKey || score.key || score.id || '',
        score: typeof score.score === 'number' ? score.score : Number(score.value) || 0,
      }))
      .filter((entry) => entry.participantKey);
  }

  if (typeof scores === 'object') {
    return Object.entries(scores)
      .map(([participantKey, value]) => ({
        participantKey,
        score: typeof value === 'number' ? value : Number(value) || 0,
      }))
      .filter((entry) => entry.participantKey);
  }

  return [];
}

function convertMatchHistory(history: any): TournamentMatchHistoryEntry[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => ({
      id: entry.id || entry.historyId || cryptoRandomId(),
      timestamp: timestampToDate(entry.timestamp || entry.reportedAt || new Date()),
      reportedByUid: entry.reportedByUid || entry.reportedBy || undefined,
      reporterDisplayName: entry.reporterDisplayName || entry.reporterName || undefined,
      result: {
        scores: convertMatchScores(entry.result?.scores || entry.scores),
        winnerKey:
          entry.result?.winnerKey ||
          entry.winnerKey ||
          entry.result?.winnerParticipantKey ||
          entry.winnerParticipantKey ||
          '',
        note: entry.result?.note || entry.note || undefined,
      },
    }))
    .map((entry) => ({
      ...entry,
      result: {
        ...entry.result,
        scores: entry.result.scores.filter((score) => score.participantKey),
      },
    }));
}

function convertMatch(rawMatch: any): TournamentMatch {
  const participants = Array.isArray(rawMatch?.participants)
    ? rawMatch.participants
        .map(convertMatchParticipant)
        .filter((participant): participant is TournamentMatchParticipant => Boolean(participant))
    : [];

  const matchId = rawMatch?.id || rawMatch?.matchId || rawMatch?.key || cryptoRandomId();
  const roundId = rawMatch?.roundId || rawMatch?.round || '';

  return {
    id: matchId,
    roundId,
    order: typeof rawMatch?.order === 'number' ? rawMatch.order : 0,
    participants,
    status: ['pending', 'in-progress', 'completed'].includes(rawMatch?.status)
      ? rawMatch.status
      : 'pending',
    scores: convertMatchScores(rawMatch?.scores),
    winnerKey:
      rawMatch?.winnerKey ||
      rawMatch?.winnerParticipantKey ||
      rawMatch?.result?.winnerKey ||
      rawMatch?.result?.winnerParticipantKey ||
      undefined,
    createdAt: timestampToDate(rawMatch?.createdAt || new Date()),
    updatedAt: timestampToDate(rawMatch?.updatedAt || rawMatch?.createdAt || new Date()),
    history: convertMatchHistory(rawMatch?.history),
  };
}

function convertMatchesRecord(rawMatches: any): Record<string, TournamentMatch> {
  if (!rawMatches) return {};

  if (Array.isArray(rawMatches)) {
    return rawMatches.reduce<Record<string, TournamentMatch>>((acc, match) => {
      const converted = convertMatch(match);
      acc[converted.id] = converted;
      return acc;
    }, {});
  }

  if (typeof rawMatches === 'object') {
    return Object.entries(rawMatches).reduce<Record<string, TournamentMatch>>(
      (acc, [key, value]) => {
        const converted = convertMatch(
          typeof value === 'object' && value
            ? { id: key, ...value }
            : { id: key }
        );
        acc[converted.id] = converted;
        return acc;
      },
      {}
    );
  }

  return {};
}

function convertRounds(rawRounds: any): TournamentRound[] {
  if (!Array.isArray(rawRounds)) return [];

  return rawRounds.map((round, index) => ({
    id: round?.id || round?.roundId || `${index}`,
    name: round?.name || `Round ${round?.order ?? index + 1}`,
    order: typeof round?.order === 'number' ? round.order : index,
    status: ['pending', 'active', 'completed'].includes(round?.status) ? round.status : 'pending',
    matchIds: Array.isArray(round?.matchIds) ? round.matchIds : [],
  }));
}

function convertTournamentProgress(rawProgress: any): TournamentProgress {
  const rounds = convertRounds(rawProgress?.rounds);
  const matches = convertMatchesRecord(rawProgress?.matches);

  return {
    format:
      rawProgress?.format ||
      rawProgress?.type ||
      (rawProgress?.metadata?.format as TournamentProgress['format']) ||
      'single-elimination',
    currentRoundId:
      rawProgress?.currentRoundId ||
      (typeof rawProgress?.currentRound === 'string'
        ? rawProgress.currentRound
        : undefined),
    rounds,
    matches,
    metadata:
      rawProgress?.metadata && typeof rawProgress.metadata === 'object'
        ? rawProgress.metadata
        : undefined,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `match_${Math.random().toString(36).slice(2, 11)}`;
}

function serializeTournamentProgress(progress: TournamentProgress | null | undefined) {
  if (!progress) return null;

  const serializedMatches = Object.entries(progress.matches).reduce<Record<string, unknown>>(
    (acc, [matchId, match]) => {
      acc[matchId] = {
        id: match.id,
        roundId: match.roundId,
        order: match.order,
        participants: match.participants.map((participant) => ({
          key: participant.key,
          displayName: participant.displayName,
          seed: participant.seed ?? null,
          slot: participant.slot ?? null,
        })),
        status: match.status,
        scores: match.scores.map((score) => ({
          participantKey: score.participantKey,
          score: score.score,
        })),
        winnerKey: match.winnerKey ?? null,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        history: match.history.map((entry) => ({
          id: entry.id,
          timestamp: entry.timestamp,
          reportedByUid: entry.reportedByUid ?? null,
          reporterDisplayName: entry.reporterDisplayName ?? null,
          result: {
            scores: entry.result.scores.map((score) => ({
              participantKey: score.participantKey,
              score: score.score,
            })),
            winnerKey: entry.result.winnerKey,
            note: entry.result.note ?? null,
          },
        })),
      };
      return acc;
    },
    {}
  );

  return {
    format: progress.format,
    currentRoundId: progress.currentRoundId ?? null,
    rounds: progress.rounds.map((round) => ({
      id: round.id,
      name: round.name,
      order: round.order,
      status: round.status,
      matchIds: round.matchIds,
    })),
    matches: serializedMatches,
    metadata: progress.metadata ?? {},
  };
}


// Convert Firestore document to Tournament
function docToTournament(docData: any, id: string): Tournament {
  const progress = docData.progress ? convertTournamentProgress(docData.progress) : undefined;
  const settings = {
    requireScores: docData.settings?.requireScores ?? true,
  };

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
    createdAt: timestampToDate(docData.createdAt),
    updatedAt: timestampToDate(docData.updatedAt),
    startedAt: docData.startedAt ? timestampToDate(docData.startedAt) : undefined,
    completedAt: docData.completedAt ? timestampToDate(docData.completedAt) : undefined,
    progress,
    settings,
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
        status: 'pending' as TournamentStatus,
        ownerId: user.uid,
        ownerDisplayName: user.displayName || 'Unknown',
        ownerEmail: user.email || '',
        players: [],
        progress: null,
        settings: {
          requireScores: data.requireScores ?? true,
        },
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
    const isOwner = tournament.ownerId === userId;
    const isPlayer = tournament.players.some((p) => p.userId === userId);

    if (isOwner || isPlayer) {
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

    const tournament = await getTournamentById(tournamentId);
    if (tournament && tournament.type === 'single-elimination' && !tournament.progress) {
      const progress = generateSingleEliminationProgress(tournament);
      updateData.progress = serializeTournamentProgress(progress);
    }
  } else if (status === 'completed') {
    updateData.completedAt = serverTimestamp();
  }

  await updateDoc(tournamentRef, updateData);
}

export async function reportSingleEliminationMatch(
  tournamentId: string,
  payload: SingleEliminationResultPayload
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.type !== 'single-elimination') {
    throw new Error('Tournament type does not support this operation');
  }

  if (!tournament.progress) {
    throw new Error('Tournament bracket has not been initialized');
  }

  const updatedProgress = applySingleEliminationResult(tournament.progress, payload);
  const finalRound = updatedProgress.rounds[updatedProgress.rounds.length - 1];
  const isTournamentComplete = finalRound?.status === 'completed';

  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const updateData: any = {
    progress: serializeTournamentProgress(updatedProgress),
    updatedAt: serverTimestamp(),
  };

  if (isTournamentComplete) {
    updateData.status = 'completed';
    updateData.completedAt = serverTimestamp();
  }

  await updateDoc(tournamentRef, updateData);
}
