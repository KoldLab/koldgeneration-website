import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type {
  TournamentMatch,
  TournamentProgress,
  TournamentMatchParticipant,
} from '@/types/tournament';
import { cn } from '@/lib/utils';

type SingleEliminationBracketProps = {
  progress: TournamentProgress;
  isOwner: boolean;
  onReportMatch?: (match: TournamentMatch) => void;
};

export function SingleEliminationBracket({
  progress,
  isOwner,
  onReportMatch,
}: SingleEliminationBracketProps) {
  const { t } = useTranslation();
  const rounds = progress.rounds.map((round) => ({
    ...round,
    matches: round.matchIds
      .map((matchId) => progress.matches[matchId])
      .filter((match): match is TournamentMatch => Boolean(match))
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          {t('tournament.bracket.singleElimination.title')}
        </h2>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {rounds.map((round) => (
          <div key={round.id} className="min-w-[240px] space-y-4">
            <div className="px-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {round.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t(`tournament.bracket.roundStatus.${round.status}`)}
              </p>
            </div>
            <div className="space-y-4">
              {round.matches.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">
                  {t('tournament.bracket.noMatches')}
                </Card>
              ) : (
                round.matches.map((match) => (
                  <Card key={match.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('tournament.bracket.matchLabel', {
                          number: match.order + 1,
                        })}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase',
                          match.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : match.status === 'in-progress'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {t(`tournament.bracket.matchStatus.${match.status}`)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[0, 1].map((slot) => {
                        const participant = getParticipantForSlot(
                          match.participants,
                          slot
                        );
                        const isWinner =
                          participant && match.winnerKey === participant.key;
                        const scoreEntry = participant
                          ? match.scores.find(
                              (score) =>
                                score.participantKey === participant.key
                            )
                          : undefined;

                        return (
                          <div
                            key={slot}
                            className={cn(
                              'flex items-center justify-between rounded border px-3 py-2 text-sm',
                              participant
                                ? 'bg-background'
                                : 'bg-muted text-muted-foreground italic',
                              isWinner && 'border-primary/60 bg-primary/5'
                            )}
                          >
                            <span className="truncate">
                              {participant?.displayName ||
                                t('tournament.bracket.tbd')}
                            </span>
                            <span className="font-mono text-sm">
                              {scoreEntry
                                ? scoreEntry.score
                                : participant
                                  ? '-'
                                  : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {match.history.length > 0 && (
                      <div className="rounded bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        <p className="font-medium">
                          {t('tournament.bracket.lastReported', {
                            date: new Date(
                              match.history[match.history.length - 1].timestamp
                            ).toLocaleString(),
                          })}
                        </p>
                        {match.history[match.history.length - 1]
                          .reporterDisplayName && (
                          <p>
                            {t('tournament.bracket.reportedBy', {
                              name: match.history[match.history.length - 1]
                                .reporterDisplayName,
                            })}
                          </p>
                        )}
                      </div>
                    )}
                    {isOwner && onReportMatch && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onReportMatch(match)}
                      >
                        {match.status === 'completed'
                          ? t('tournament.bracket.updateResult')
                          : t('tournament.bracket.reportResult')}
                      </Button>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getParticipantForSlot(
  participants: TournamentMatchParticipant[],
  slot: number
): TournamentMatchParticipant | undefined {
  return participants.find(
    (participant) => (participant.slot ?? slot) === slot
  );
}
