import { supabase } from '@/lib/supabase';
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
import type { AppUser } from '@/contexts/AuthContext';

function generateTournamentCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function codeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    if (isBlockedError(error)) throw new Error('BLOCKED_BY_EXTENSION');
    throw error;
  }
  return Boolean(data);
}

async function generateUniqueCode(): Promise<string> {
  let code = generateTournamentCode();
  let attempts = 0;
  while ((await codeExists(code)) && attempts < 10) {
    code = generateTournamentCode();
    attempts++;
  }
  if (attempts >= 10) {
    throw new Error('Failed to generate unique tournament code');
  }
  return code;
}

function isBlockedError(error: any): boolean {
  const msg = error?.message ?? '';
  return (
    msg.includes('ERR_BLOCKED_BY_CLIENT') ||
    msg.includes('Failed to fetch') ||
    msg.includes('blocked')
  );
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date();
}

function convertMatchParticipant(
  participant: Record<string, unknown>
): TournamentMatchParticipant | null {
  if (!participant) return null;

  const keyCandidate =
    (typeof participant.key === 'string' && participant.key) ||
    (typeof participant.participantKey === 'string' &&
      participant.participantKey) ||
    (typeof participant.userId === 'string' && `user:${participant.userId}`) ||
    (typeof participant.guestId === 'string' && `guest:${participant.guestId}`);

  if (!keyCandidate) return null;

  return {
    key: keyCandidate,
    displayName:
      typeof participant.displayName === 'string'
        ? participant.displayName
        : typeof participant.name === 'string'
          ? participant.name
          : 'Unknown',
    seed:
      typeof participant.seed === 'number' ? participant.seed : undefined,
    slot:
      typeof participant.slot === 'number'
        ? participant.slot
        : typeof participant.slot === 'string' && participant.slot.trim() !== ''
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
        score:
          typeof score.score === 'number'
            ? score.score
            : Number(score.value) || 0,
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
      timestamp: toDate(entry.timestamp || entry.reportedAt || new Date()),
      reportedByUid: entry.reportedByUid || entry.reportedBy || undefined,
      reporterDisplayName:
        entry.reporterDisplayName || entry.reporterName || undefined,
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

function convertMatch(rawMatch: unknown): TournamentMatch {
  const matchRecord = (rawMatch ?? {}) as Record<string, unknown>;
  const participantsArray = Array.isArray(matchRecord.participants)
    ? (matchRecord.participants as Record<string, unknown>[])
    : [];
  const participants = participantsArray
    .map(convertMatchParticipant)
    .filter((p): p is TournamentMatchParticipant => Boolean(p));

  const matchId =
    (matchRecord.id as string) ||
    (matchRecord.matchId as string) ||
    (matchRecord.key as string) ||
    cryptoRandomId();
  const roundId =
    (matchRecord.roundId as string) || (matchRecord.round as string) || '';

  return {
    id: matchId,
    roundId,
    order:
      typeof matchRecord.order === 'number' ? (matchRecord.order as number) : 0,
    participants,
    status: ['pending', 'in-progress', 'completed'].includes(
      matchRecord.status as string
    )
      ? (matchRecord.status as TournamentMatch['status'])
      : 'pending',
    scores: convertMatchScores(matchRecord.scores),
    winnerKey:
      (matchRecord.winnerKey as string) ||
      (matchRecord.winnerParticipantKey as string) ||
      (matchRecord.result as any)?.winnerKey ||
      (matchRecord.result as any)?.winnerParticipantKey ||
      undefined,
    createdAt: toDate(matchRecord.createdAt || new Date()),
    updatedAt: toDate(
      matchRecord.updatedAt || matchRecord.createdAt || new Date()
    ),
    history: convertMatchHistory(matchRecord.history),
  };
}

function convertMatchesRecord(
  rawMatches: any
): Record<string, TournamentMatch> {
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
    status: ['pending', 'active', 'completed'].includes(round?.status)
      ? round.status
      : 'pending',
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

function serializeTournamentProgress(
  progress: TournamentProgress | null | undefined
) {
  if (!progress) return null;

  const serializedMatches = Object.entries(progress.matches).reduce<
    Record<string, unknown>
  >((acc, [matchId, match]) => {
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
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
      history: match.history.map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
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
  }, {});

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

function rowToTournament(row: any): Tournament {
  const progress = row.progress
    ? convertTournamentProgress(row.progress)
    : undefined;
  const settings = {
    requireScores: row.settings?.requireScores ?? true,
  };

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    type: row.type,
    maxPlayers: row.max_players,
    status: row.status,
    ownerId: row.owner_id,
    ownerDisplayName: row.owner_display_name,
    ownerEmail: row.owner_email,
    players: (row.players ?? []).map((p: any) => ({
      ...p,
      registeredAt: toDate(p.registeredAt),
    })),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    startedAt: row.started_at ? toDate(row.started_at) : undefined,
    completedAt: row.completed_at ? toDate(row.completed_at) : undefined,
    progress,
    settings,
  };
}

function serializePlayers(players: TournamentPlayer[]) {
  return players.map((p) => ({
    ...p,
    registeredAt:
      p.registeredAt instanceof Date
        ? p.registeredAt.toISOString()
        : p.registeredAt,
  }));
}

// ============================================================================
// API
// ============================================================================

export async function createTournament(
  data: CreateTournamentData,
  user: AppUser
): Promise<Tournament> {
  try {
    const code = await generateUniqueCode();
    const insertData = {
      code,
      name: data.name,
      description: data.description || '',
      type: data.type,
      max_players: data.maxPlayers,
      status: 'pending' as TournamentStatus,
      owner_id: user.uid,
      owner_display_name: user.displayName || 'Unknown',
      owner_email: user.email || '',
      players: [],
      progress: null,
      settings: { requireScores: data.requireScores ?? true },
    };

    const { data: row, error } = await supabase
      .from('tournaments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (isBlockedError(error)) throw new Error('BLOCKED_BY_EXTENSION');
      throw error;
    }

    return rowToTournament(row);
  } catch (error: any) {
    if (isBlockedError(error)) throw new Error('BLOCKED_BY_EXTENSION');
    throw error;
  }
}

export async function getTournamentByCode(
  code: string
): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? rowToTournament(data) : null;
}

export async function getTournamentById(
  id: string
): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToTournament(data) : null;
}

export async function registerPlayer(
  tournamentId: string,
  user: AppUser
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'open' && tournament.status !== 'pending') {
    throw new Error('Tournament is not accepting registrations');
  }
  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }
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

  const { error } = await supabase
    .from('tournaments')
    .update({
      players: serializePlayers([...tournament.players, newPlayer]),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournamentId);
  if (error) throw error;
}

export async function registerGuestPlayer(
  tournamentId: string,
  pseudonym: string,
  guestId: string
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.status !== 'open' && tournament.status !== 'pending') {
    throw new Error('Tournament is not accepting registrations');
  }
  if (tournament.players.length >= tournament.maxPlayers) {
    throw new Error('Tournament is full');
  }
  if (tournament.players.some((p) => p.guestId === guestId)) {
    throw new Error('You are already registered for this tournament');
  }
  if (
    tournament.players.some(
      (p) => p.pseudonym?.toLowerCase() === pseudonym.toLowerCase()
    )
  ) {
    throw new Error('This pseudonym is already taken');
  }

  const newPlayer: TournamentPlayer = {
    guestId,
    displayName: pseudonym,
    pseudonym,
    registeredAt: new Date(),
    isGuest: true,
  };

  const { error } = await supabase
    .from('tournaments')
    .update({
      players: serializePlayers([...tournament.players, newPlayer]),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournamentId);
  if (error) throw error;
}

export async function unregisterPlayer(
  tournamentId: string,
  userId: string
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (
    tournament.status === 'in-progress' ||
    tournament.status === 'completed' ||
    tournament.status === 'paused'
  ) {
    throw new Error('Cannot unregister from a tournament that has started');
  }

  const updatedPlayers = tournament.players.filter((p) => p.userId !== userId);
  const { error } = await supabase
    .from('tournaments')
    .update({
      players: serializePlayers(updatedPlayers),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournamentId);
  if (error) throw error;
}

export async function unregisterGuestPlayer(
  tournamentId: string,
  guestId: string
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (
    tournament.status === 'in-progress' ||
    tournament.status === 'completed' ||
    tournament.status === 'paused'
  ) {
    throw new Error('Cannot unregister from a tournament that has started');
  }

  const updatedPlayers = tournament.players.filter(
    (p) => p.guestId !== guestId
  );
  const { error } = await supabase
    .from('tournaments')
    .update({
      players: serializePlayers(updatedPlayers),
      updated_at: new Date().toISOString(),
    })
    .eq('id', tournamentId);
  if (error) throw error;
}

export async function getTournamentsByUserId(
  userId: string
): Promise<Tournament[]> {
  // Get all tournaments and filter in memory — Postgres JSONB queries on player
  // userId would need a custom index/function and current dataset is small.
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .map(rowToTournament)
    .filter(
      (tournament) =>
        tournament.ownerId === userId ||
        tournament.players.some((p) => p.userId === userId)
    );
}

export async function updateTournamentStatus(
  tournamentId: string,
  status: TournamentStatus
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'in-progress') {
    updateData.started_at = new Date().toISOString();
    const tournament = await getTournamentById(tournamentId);
    if (
      tournament &&
      tournament.type === 'single-elimination' &&
      !tournament.progress
    ) {
      const progress = generateSingleEliminationProgress(tournament);
      updateData.progress = serializeTournamentProgress(progress);
    }
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('tournaments')
    .update(updateData)
    .eq('id', tournamentId);
  if (error) throw error;
}

export async function reportSingleEliminationMatch(
  tournamentId: string,
  payload: SingleEliminationResultPayload
): Promise<void> {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  if (tournament.type !== 'single-elimination') {
    throw new Error('Tournament type does not support this operation');
  }
  if (!tournament.progress) {
    throw new Error('Tournament bracket has not been initialized');
  }

  const updatedProgress = applySingleEliminationResult(
    tournament.progress,
    payload
  );
  const finalRound = updatedProgress.rounds[updatedProgress.rounds.length - 1];
  const isTournamentComplete = finalRound?.status === 'completed';

  const updateData: Record<string, unknown> = {
    progress: serializeTournamentProgress(updatedProgress),
    updated_at: new Date().toISOString(),
  };

  if (isTournamentComplete) {
    updateData.status = 'completed';
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('tournaments')
    .update(updateData)
    .eq('id', tournamentId);
  if (error) throw error;
}
