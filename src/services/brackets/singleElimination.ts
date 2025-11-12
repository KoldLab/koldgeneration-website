import type {
  Tournament,
  TournamentMatch,
  TournamentMatchParticipant,
  TournamentMatchScore,
  TournamentProgress,
  TournamentRound,
} from '@/types/tournament';

export interface SingleEliminationResultPayload {
  matchId: string;
  winnerKey: string;
  winnerParticipant?: TournamentMatchParticipant;
  scores: TournamentMatchScore[];
  note?: string;
  reportedByUid?: string;
  reporterDisplayName?: string;
  timestamp?: Date;
}

export function generateSingleEliminationProgress(tournament: Tournament): TournamentProgress {
  const now = new Date();
  const players = tournament.players ?? [];
  const participants: Array<TournamentMatchParticipant | null> = players.map((player, index) => ({
    key: getParticipantKey(player),
    displayName: player.displayName,
    seed: index + 1,
  }));

  const bracketSize = Math.max(2, nextPowerOfTwo(Math.max(participants.length, 1)));
  const totalRounds = Math.max(1, Math.log2(bracketSize));

  while (participants.length < bracketSize) {
    participants.push(null);
  }

  const matches: Record<string, TournamentMatch> = {};
  const rounds: TournamentRound[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const roundId = `round-${roundIndex + 1}`;
    const matchCount = 2 ** (totalRounds - roundIndex - 1);
    const matchIds: string[] = [];

    for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
      const matchId = `${roundId}-match-${matchIndex + 1}`;
      matchIds.push(matchId);
      matches[matchId] = createEmptyMatch(matchId, roundId, matchIndex, now);
    }

    rounds.push({
      id: roundId,
      name: getRoundName(roundIndex, totalRounds),
      order: roundIndex,
      status: roundIndex === 0 ? 'active' : 'pending',
      matchIds,
    });
  }

  seedFirstRoundParticipants(participants, rounds, matches, now);

  return {
    format: 'single-elimination',
    currentRoundId: rounds[0]?.id,
    rounds,
    matches,
    metadata: {
      generatedAt: now.toISOString(),
      bracketSize,
    },
  };
}

export function applySingleEliminationResult(
  progress: TournamentProgress,
  payload: SingleEliminationResultPayload
): TournamentProgress {
  const timestamp = payload.timestamp ?? new Date();
  const updatedProgress: TournamentProgress = {
    ...progress,
    rounds: progress.rounds.map((round) => ({ ...round, matchIds: [...round.matchIds] })),
    matches: { ...progress.matches },
  };

  const match = { ...updatedProgress.matches[payload.matchId] };
  if (!match) {
    throw new Error('Match not found');
  }

  const previousWinnerKey = match.winnerKey;

  const winnerParticipant =
    payload.winnerParticipant ||
    match.participants.find((participant) => participant.key === payload.winnerKey);

  if (!winnerParticipant) {
    throw new Error('Winner participant not found for the provided key');
  }

  match.scores = payload.scores;
  match.status = 'completed';
  match.winnerKey = payload.winnerKey;
  match.updatedAt = timestamp;
  match.history = [
    ...match.history,
    {
      id: cryptoRandomId(),
      timestamp,
      reportedByUid: payload.reportedByUid,
      reporterDisplayName: payload.reporterDisplayName,
      result: {
        scores: payload.scores,
        winnerKey: payload.winnerKey,
        note: payload.note,
      },
    },
  ];

  updatedProgress.matches[payload.matchId] = match;

  const roundIndex = updatedProgress.rounds.findIndex((round) => round.id === match.roundId);
  if (roundIndex !== -1) {
    const round = updatedProgress.rounds[roundIndex];
    const isRoundComplete = round.matchIds.every((matchId) => {
      const roundMatch = matchId === match.id ? match : updatedProgress.matches[matchId];
      return roundMatch.status === 'completed';
    });

    updatedProgress.rounds[roundIndex] = {
      ...round,
      status: isRoundComplete ? 'completed' : 'active',
    };

    if (isRoundComplete && roundIndex + 1 < updatedProgress.rounds.length) {
      const nextRound = updatedProgress.rounds[roundIndex + 1];
      updatedProgress.rounds[roundIndex + 1] = { ...nextRound, status: 'active' };
      updatedProgress.currentRoundId = nextRound.id;
    } else if (isRoundComplete) {
      updatedProgress.currentRoundId = round.id;
    }
  }

  const nextRoundIndex = roundIndex + 1;
  if (nextRoundIndex < updatedProgress.rounds.length) {
    const nextRound = updatedProgress.rounds[nextRoundIndex];
    const nextMatchIndex = Math.floor(match.order / 2);
    const nextMatchId = nextRound.matchIds[nextMatchIndex];

    if (nextMatchId) {
      const nextMatch = { ...updatedProgress.matches[nextMatchId] };
      const slot = match.order % 2;
      if (
        previousWinnerKey &&
        previousWinnerKey !== payload.winnerKey &&
        nextMatch.status === 'completed'
      ) {
        throw new Error(
          'Cannot change this match because the next round has already been completed.'
        );
      }

      let participants = nextMatch.participants.filter(
        (participant) => participant.slot !== slot && participant.key !== payload.winnerKey
      );

      if (previousWinnerKey) {
        participants = participants.filter((participant) => participant.key !== previousWinnerKey);
      }

      const participantWithSlot: TournamentMatchParticipant = {
        ...winnerParticipant,
        slot,
      };
      participants = upsertMatchParticipant(participants, participantWithSlot);
      nextMatch.participants = participants;
      nextMatch.updatedAt = timestamp;

      if (nextMatch.status !== 'completed') {
        if (previousWinnerKey && previousWinnerKey !== payload.winnerKey) {
          nextMatch.winnerKey =
            nextMatch.winnerKey && nextMatch.winnerKey !== payload.winnerKey
              ? nextMatch.winnerKey
              : undefined;
          nextMatch.scores = nextMatch.scores.filter((score) =>
            participants.some((participant) => participant.key === score.participantKey)
          );
          nextMatch.history = nextMatch.history.filter(
            (entry) => entry.result.winnerKey !== previousWinnerKey
          );
        }
        nextMatch.status = participants.length === 2 ? 'pending' : 'pending';
      }

      updatedProgress.matches[nextMatchId] = nextMatch;

      if (previousWinnerKey && previousWinnerKey !== payload.winnerKey) {
        pruneDownstreamMatches(
          updatedProgress,
          nextRoundIndex + 1,
          previousWinnerKey,
          timestamp
        );
      }
    }
  }

  return updatedProgress;
}

function seedFirstRoundParticipants(
  participants: Array<TournamentMatchParticipant | null>,
  rounds: TournamentRound[],
  matches: Record<string, TournamentMatch>,
  now: Date
) {
  const firstRound = rounds[0];
  if (!firstRound) return;

  for (let i = 0; i < participants.length; i += 2) {
    const matchIndex = i / 2;
    const matchId = firstRound.matchIds[matchIndex];
    if (!matchId) continue;

    const match = matches[matchId];
    const top = participants[i];
    const bottom = participants[i + 1];

    if (top) {
      match.participants = upsertMatchParticipant(match.participants, { ...top, slot: 0 });
    }
    if (bottom) {
      match.participants = upsertMatchParticipant(match.participants, { ...bottom, slot: 1 });
    }

    if (match.participants.length === 1) {
      autoAdvanceWinner(match.participants[0]!, 0, matchIndex, matches, rounds, now);
    }
  }
}

function autoAdvanceWinner(
  participant: TournamentMatchParticipant,
  roundIndex: number,
  matchIndex: number,
  matches: Record<string, TournamentMatch>,
  rounds: TournamentRound[],
  now: Date
) {
  const round = rounds[roundIndex];
  if (!round) return;

  const matchId = round.matchIds[matchIndex];
  const match = matches[matchId];
  if (!match) return;

  const scores: TournamentMatchScore[] = [
    {
      participantKey: participant.key,
      score: 1,
    },
  ];

  match.status = 'completed';
  match.winnerKey = participant.key;
  match.scores = scores;
  match.updatedAt = now;
  match.history = [
    ...match.history,
    {
      id: cryptoRandomId(),
      timestamp: now,
      result: {
        scores,
        winnerKey: participant.key,
        note: 'Auto-advance (bye)',
      },
    },
  ];

  const isRoundComplete = round.matchIds.every((id) => matches[id]?.status === 'completed');
  if (isRoundComplete) {
    round.status = 'completed';
    const nextRound = rounds[roundIndex + 1];
    if (nextRound) {
      nextRound.status = 'active';
    }
  }

  const nextRoundIndex = roundIndex + 1;
  if (nextRoundIndex >= rounds.length) {
    return;
  }

  const nextRound = rounds[nextRoundIndex];
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextMatchId = nextRound.matchIds[nextMatchIndex];
  const nextMatch = matches[nextMatchId];
  if (!nextMatch) return;

  const slot = matchIndex % 2;
  const participantWithSlot: TournamentMatchParticipant = {
    ...participant,
    slot,
  };
  nextMatch.participants = upsertMatchParticipant(nextMatch.participants, participantWithSlot);
}

function upsertMatchParticipant(
  participants: TournamentMatchParticipant[],
  incoming: TournamentMatchParticipant
): TournamentMatchParticipant[] {
  const nextParticipants = [...participants];
  const existingIndex = nextParticipants.findIndex(
    (participant) =>
      participant.key === incoming.key || participant.slot === incoming.slot
  );

  if (existingIndex !== -1) {
    nextParticipants[existingIndex] = incoming;
  } else {
    nextParticipants.push(incoming);
  }

  return nextParticipants.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
}

function createEmptyMatch(
  matchId: string,
  roundId: string,
  order: number,
  now: Date
): TournamentMatch {
  return {
    id: matchId,
    roundId,
    order,
    participants: [],
    status: 'pending',
    scores: [],
    createdAt: now,
    updatedAt: now,
    history: [],
  };
}

function getParticipantKey(player: Tournament['players'][number]): string {
  if (player.userId) return `user:${player.userId}`;
  if (player.guestId) return `guest:${player.guestId}`;
  return `guest:${player.displayName}-${player.registeredAt.getTime()}`;
}

function getRoundName(roundIndex: number, totalRounds: number): string {
  const roundsRemaining = totalRounds - roundIndex;
  switch (roundsRemaining) {
    case 1:
      return 'Final';
    case 2:
      return 'Semifinals';
    case 3:
      return 'Quarterfinals';
    default: {
      const teamCount = 2 ** roundsRemaining;
      return `Round of ${teamCount}`;
    }
  }
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(value));
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `se_${Math.random().toString(36).slice(2, 11)}`;
}

function pruneDownstreamMatches(
  progress: TournamentProgress,
  startRoundIndex: number,
  participantKey: string,
  timestamp: Date
) {
  for (let roundIndex = startRoundIndex; roundIndex < progress.rounds.length; roundIndex += 1) {
    const round = progress.rounds[roundIndex];
    for (const matchId of round.matchIds) {
      const match = progress.matches[matchId];
      if (!match) continue;

      if (!match.participants.some((participant) => participant.key === participantKey)) {
        continue;
      }

      if (match.status === 'completed') {
        throw new Error(
          'Cannot change this match because subsequent rounds have already been completed.'
        );
      }

      match.participants = match.participants.filter(
        (participant) => participant.key !== participantKey
      );
      match.scores = match.scores.filter((score) => score.participantKey !== participantKey);
      if (match.winnerKey === participantKey) {
        match.winnerKey = undefined;
      }
      match.status = 'pending';
      match.updatedAt = timestamp;
    }
  }
}


