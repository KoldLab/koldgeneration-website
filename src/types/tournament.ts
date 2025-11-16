export type TournamentType =
  | 'single-elimination'
  | 'double-elimination'
  | 'round-robin'
  | 'swiss';

export type TournamentStatus =
  | 'pending'
  | 'open'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type TournamentRoundStatus = 'pending' | 'active' | 'completed';

export type TournamentMatchStatus = 'pending' | 'in-progress' | 'completed';

export interface TournamentPlayer {
  userId?: string; // Optional for guest players
  guestId?: string; // Unique ID for guest players (stored in localStorage)
  displayName: string;
  pseudonym?: string; // For guest players who join with a pseudonym
  email?: string; // Optional for guest players
  photoURL?: string;
  registeredAt: Date;
  isGuest: boolean; // True for players who joined without authentication
}

export interface TournamentMatchParticipant {
  key: string; // Unique key referencing a tournament participant (user:<id> or guest:<id>)
  displayName: string;
  seed?: number;
  slot?: number;
}

export interface TournamentMatchScore {
  participantKey: string;
  score: number;
}

export interface TournamentMatchHistoryEntry {
  id: string;
  timestamp: Date;
  reportedByUid?: string;
  reporterDisplayName?: string;
  result: {
    scores: TournamentMatchScore[];
    winnerKey: string;
    note?: string;
  };
}

export interface TournamentMatch {
  id: string;
  roundId: string;
  order: number;
  participants: TournamentMatchParticipant[];
  status: TournamentMatchStatus;
  scores: TournamentMatchScore[];
  winnerKey?: string;
  createdAt: Date;
  updatedAt: Date;
  history: TournamentMatchHistoryEntry[];
}

export interface TournamentRound {
  id: string;
  name: string;
  order: number;
  status: TournamentRoundStatus;
  matchIds: string[];
}

export interface TournamentProgress {
  format: TournamentType;
  currentRoundId?: string;
  rounds: TournamentRound[];
  matches: Record<string, TournamentMatch>;
  metadata?: Record<string, unknown>;
}

export interface Tournament {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: TournamentType;
  maxPlayers: number;
  status: TournamentStatus;
  ownerId: string;
  ownerDisplayName: string;
  ownerEmail: string;
  players: TournamentPlayer[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress?: TournamentProgress;
  settings?: {
    requireScores?: boolean;
  };
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  type: TournamentType;
  maxPlayers: number;
  requireScores?: boolean;
}
