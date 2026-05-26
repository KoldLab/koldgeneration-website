export const VOLLEYBALL_LEVELS = [
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
] as const;

export type VolleyballLevel = (typeof VOLLEYBALL_LEVELS)[number];

export const VOLLEYBALL_POSITIONS = [
  'setter',
  'outside',
  'opposite',
  'middle',
  'libero',
] as const;

export type VolleyballPosition = (typeof VOLLEYBALL_POSITIONS)[number];

/** Persistent roster entry. */
export type VolleyballPlayer = {
  id: string;
  userId: string;
  name: string;
  position: VolleyballPosition;
  level: VolleyballLevel;
  createdAt: Date;
  updatedAt: Date;
};

/** Snapshot of a player inside a session — decoupled from the roster row. */
export type SessionPlayer = {
  id: string;
  name: string;
  position: VolleyballPosition;
  level: VolleyballLevel;
  /** Roster row this player was copied from, if any. */
  rosterPlayerId: string | null;
};

export type SessionTeam = {
  id: string;
  name: string;
  playerIds: string[];
};

export type SessionSet = {
  teamAScore: number;
  teamBScore: number;
};

export type SessionMatch = {
  id: string;
  teamAId: string;
  teamBId: string;
  sets: SessionSet[];
  createdAt: string;
};

export type VolleyballSession = {
  id: string;
  userId: string;
  name: string;
  date: string;
  notes: string;
  players: SessionPlayer[];
  teams: SessionTeam[];
  matches: SessionMatch[];
  /** Short public share code; if set, anyone with the code can read/edit. */
  shareCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};
