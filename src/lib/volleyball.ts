import {
  VOLLEYBALL_LEVELS,
  VOLLEYBALL_POSITIONS,
  type SessionPlayer,
  type VolleyballLevel,
  type VolleyballPosition,
  type VolleyballSession,
} from '@/types/volleyball';

export const LEVEL_VALUE: Record<VolleyballLevel, number> = {
  A: 10,
  'A-': 9,
  'B+': 8,
  B: 7,
  'B-': 6,
  'C+': 5,
  C: 4,
  'C-': 3,
  'D+': 2,
  D: 1,
};

/** Recognized abbreviations / aliases for each position (case-insensitive). */
const POSITION_ALIASES: Record<VolleyballPosition, string[]> = {
  setter: ['s', 'setter', 'passeur'],
  outside: [
    'oh',
    'outside',
    'r4',
    'r-4',
    'attaquant',
    'reception',
    'réception',
  ],
  opposite: ['op', 'opp', 'opposite', 'pointu'],
  middle: ['mb', 'm', 'middle', 'central', 'centre'],
  libero: ['l', 'libero', 'libéro'],
};

export function parsePosition(value: string): VolleyballPosition | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  for (const pos of VOLLEYBALL_POSITIONS) {
    if (POSITION_ALIASES[pos].includes(v)) return pos;
  }
  return null;
}

export function parseLevel(value: string): VolleyballLevel | null {
  const v = value.trim().toUpperCase().replace(/\s+/g, '');
  return (VOLLEYBALL_LEVELS as readonly string[]).includes(v)
    ? (v as VolleyballLevel)
    : null;
}

export function playerValue(p: { level: VolleyballLevel }): number {
  return LEVEL_VALUE[p.level];
}

export function teamTotal(players: SessionPlayer[]): number {
  return players.reduce((sum, p) => sum + playerValue(p), 0);
}

/**
 * Position-aware balanced split:
 *   group players by position, sort each group by skill desc, then assign each
 *   player to the team with the fewest of that position (tiebreak: lowest total).
 *   Returns teams as arrays of players — caller wraps with names.
 */
export function buildBalancedTeams(
  players: SessionPlayer[],
  teamCount: number
): SessionPlayer[][] {
  const teams: SessionPlayer[][] = Array.from(
    { length: teamCount },
    () => [] as SessionPlayer[]
  );
  const totals = new Array(teamCount).fill(0);
  const positionCounts: Record<VolleyballPosition, number[]> = {
    setter: new Array(teamCount).fill(0),
    outside: new Array(teamCount).fill(0),
    opposite: new Array(teamCount).fill(0),
    middle: new Array(teamCount).fill(0),
    libero: new Array(teamCount).fill(0),
  };

  const byPosition: Record<VolleyballPosition, SessionPlayer[]> = {
    setter: [],
    outside: [],
    opposite: [],
    middle: [],
    libero: [],
  };
  for (const p of players) byPosition[p.position].push(p);
  for (const pos of VOLLEYBALL_POSITIONS) {
    byPosition[pos].sort((a, b) => playerValue(b) - playerValue(a));
  }

  for (const pos of VOLLEYBALL_POSITIONS) {
    for (const p of byPosition[pos]) {
      let idx = 0;
      for (let i = 1; i < teamCount; i++) {
        if (positionCounts[pos][i] < positionCounts[pos][idx]) {
          idx = i;
        } else if (
          positionCounts[pos][i] === positionCounts[pos][idx] &&
          totals[i] < totals[idx]
        ) {
          idx = i;
        }
      }
      teams[idx].push(p);
      totals[idx] += playerValue(p);
      positionCounts[pos][idx] += 1;
    }
  }
  return teams;
}

/** Random split: shuffle then round-robin. */
export function buildRandomTeams(
  players: SessionPlayer[],
  teamCount: number
): SessionPlayer[][] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const teams: SessionPlayer[][] = Array.from(
    { length: teamCount },
    () => [] as SessionPlayer[]
  );
  shuffled.forEach((p, i) => {
    teams[i % teamCount].push(p);
  });
  return teams;
}

/** Winner of a single set: 'a', 'b', or null when tied / not yet decided. */
export function setWinner(set: {
  teamAScore: number;
  teamBScore: number;
}): 'a' | 'b' | null {
  if (set.teamAScore === set.teamBScore) return null;
  return set.teamAScore > set.teamBScore ? 'a' : 'b';
}

/** Count of sets won by each side in a match. */
export function matchScore(sets: { teamAScore: number; teamBScore: number }[]) {
  let a = 0;
  let b = 0;
  for (const set of sets) {
    const w = setWinner(set);
    if (w === 'a') a += 1;
    else if (w === 'b') b += 1;
  }
  return { a, b };
}

// ─── Stats aggregation ──────────────────────────────────────────────────────

export type PlayerStats = {
  rosterPlayerId: string;
  sessions: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesTied: number;
  setsPlayed: number;
  setsWon: number;
  setsLost: number;
};

export type PlayerMatchResult = {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  matchId: string;
  teamName: string;
  opponentName: string;
  setsWon: number;
  setsLost: number;
  outcome: 'won' | 'lost' | 'tied';
  sets: { mine: number; theirs: number }[];
};

function emptyStats(rosterPlayerId: string): PlayerStats {
  return {
    rosterPlayerId,
    sessions: 0,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchesTied: 0,
    setsPlayed: 0,
    setsWon: 0,
    setsLost: 0,
  };
}

/**
 * Aggregate per-roster-player stats across all sessions.
 * Ad-hoc players (no rosterPlayerId) are ignored — they can't be tracked across sessions.
 */
export function computeStats(
  sessions: VolleyballSession[]
): Map<string, PlayerStats> {
  const map = new Map<string, PlayerStats>();

  for (const session of sessions) {
    const rosterIdByPlayerId = new Map<string, string>();
    for (const p of session.players) {
      if (p.rosterPlayerId) rosterIdByPlayerId.set(p.id, p.rosterPlayerId);
    }

    // Sessions attended = present in session.players
    const attended = new Set<string>();
    for (const rid of rosterIdByPlayerId.values()) attended.add(rid);
    for (const rid of attended) {
      if (!map.has(rid)) map.set(rid, emptyStats(rid));
      map.get(rid)!.sessions += 1;
    }

    // Per-team roster IDs
    const rosterIdsByTeam = new Map<string, string[]>();
    for (const team of session.teams) {
      const ids: string[] = [];
      for (const pid of team.playerIds) {
        const rid = rosterIdByPlayerId.get(pid);
        if (rid) ids.push(rid);
      }
      rosterIdsByTeam.set(team.id, ids);
    }

    for (const match of session.matches) {
      const teamA = rosterIdsByTeam.get(match.teamAId) ?? [];
      const teamB = rosterIdsByTeam.get(match.teamBId) ?? [];
      const { a: setsA, b: setsB } = matchScore(match.sets);
      const matchOutcomeA =
        setsA === setsB ? 'tied' : setsA > setsB ? 'won' : 'lost';

      for (const rid of teamA) {
        if (!map.has(rid)) map.set(rid, emptyStats(rid));
        const s = map.get(rid)!;
        s.matchesPlayed += 1;
        if (matchOutcomeA === 'won') s.matchesWon += 1;
        else if (matchOutcomeA === 'lost') s.matchesLost += 1;
        else s.matchesTied += 1;
        s.setsWon += setsA;
        s.setsLost += setsB;
        s.setsPlayed += setsA + setsB;
      }
      for (const rid of teamB) {
        if (!map.has(rid)) map.set(rid, emptyStats(rid));
        const s = map.get(rid)!;
        s.matchesPlayed += 1;
        if (matchOutcomeA === 'won') s.matchesLost += 1;
        else if (matchOutcomeA === 'lost') s.matchesWon += 1;
        else s.matchesTied += 1;
        s.setsWon += setsB;
        s.setsLost += setsA;
        s.setsPlayed += setsA + setsB;
      }
    }
  }

  return map;
}

/**
 * Per-match history for a single roster player, sorted by date desc.
 */
export function playerMatchHistory(
  rosterPlayerId: string,
  sessions: VolleyballSession[]
): PlayerMatchResult[] {
  const out: PlayerMatchResult[] = [];

  for (const session of sessions) {
    const rosterIdByPlayerId = new Map<string, string>();
    for (const p of session.players) {
      if (p.rosterPlayerId) rosterIdByPlayerId.set(p.id, p.rosterPlayerId);
    }
    const teamForPlayer = (teamId: string): boolean => {
      const team = session.teams.find((tm) => tm.id === teamId);
      if (!team) return false;
      return team.playerIds.some(
        (pid) => rosterIdByPlayerId.get(pid) === rosterPlayerId
      );
    };

    for (const match of session.matches) {
      const onA = teamForPlayer(match.teamAId);
      const onB = teamForPlayer(match.teamBId);
      if (!onA && !onB) continue;
      const teamA = session.teams.find((tm) => tm.id === match.teamAId);
      const teamB = session.teams.find((tm) => tm.id === match.teamBId);
      const { a: setsA, b: setsB } = matchScore(match.sets);
      const mine = onA ? setsA : setsB;
      const theirs = onA ? setsB : setsA;
      const outcome: 'won' | 'lost' | 'tied' =
        mine === theirs ? 'tied' : mine > theirs ? 'won' : 'lost';
      out.push({
        sessionId: session.id,
        sessionName: session.name,
        sessionDate: session.date,
        matchId: match.id,
        teamName: (onA ? teamA?.name : teamB?.name) ?? '',
        opponentName: (onA ? teamB?.name : teamA?.name) ?? '',
        setsWon: mine,
        setsLost: theirs,
        outcome,
        sets: match.sets.map((s) => ({
          mine: onA ? s.teamAScore : s.teamBScore,
          theirs: onA ? s.teamBScore : s.teamAScore,
        })),
      });
    }
  }

  out.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  return out;
}
