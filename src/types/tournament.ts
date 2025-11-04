export type TournamentType = 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';

export type TournamentStatus = 'pending' | 'open' | 'in-progress' | 'paused' | 'completed' | 'cancelled';

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
  winScore?: number; // Points awarded for a win
  loseScore?: number; // Points awarded for a loss
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  type: TournamentType;
  maxPlayers: number;
  winScore?: number; // Points awarded for a win
  loseScore?: number; // Points awarded for a loss
}

