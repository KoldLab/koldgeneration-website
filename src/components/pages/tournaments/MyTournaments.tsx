import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTournamentsByUserId } from '@/services/tournamentService';
import type { Tournament } from '@/types/tournament';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Pause,
  ExternalLink,
} from 'lucide-react';

export default function MyTournaments() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadTournaments();
    }
  }, [user]);

  const loadTournaments = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const userTournaments = await getTournamentsByUserId(user.uid);
      // Sort by most recent first
      userTournaments.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTournaments(userTournaments);
    } catch (err: any) {
      setError(err.message || t('tournament.view.error'));
    } finally {
      setLoading(false);
    }
  };

  const getTournamentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'single-elimination': 'singleElimination',
      'double-elimination': 'doubleElimination',
      'round-robin': 'roundRobin',
      swiss: 'swiss',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: Tournament['status']) => {
    const statusConfig = {
      pending: {
        label: t('tournament.status.pending'),
        icon: Square,
        className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      },
      open: {
        label: t('tournament.status.open'),
        icon: CheckCircle,
        className: 'bg-green-500/10 text-green-600 dark:text-green-400',
      },
      'in-progress': {
        label: t('tournament.status.inProgress'),
        icon: Play,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      },
      paused: {
        label: t('tournament.status.paused'),
        icon: Pause,
        className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      },
      completed: {
        label: t('tournament.status.completed'),
        icon: CheckCircle,
        className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      },
      cancelled: {
        label: t('tournament.status.cancelled'),
        icon: XCircle,
        className: 'bg-red-500/10 text-red-600 dark:text-red-400',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">
          {t('tournament.create.loginRequired')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadTournaments} variant="outline">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('tournament.myTournaments.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
          {t('tournament.myTournaments.description')}
        </p>
      </div>

      {tournaments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t('tournament.myTournaments.noTournaments')}
          </p>
          <Button onClick={() => navigate('/tournaments/create')}>
            {t('tournament.create.createButton')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tournaments.map((tournament) => {
            const isOwner = user?.uid === tournament.ownerId;
            return (
              <Card
                key={tournament.id}
                className="p-4 sm:p-6 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/tournament/${tournament.code}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">{tournament.name}</h2>
                      {getStatusBadge(tournament.status)}
                      {isOwner && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {t('tournament.myTournaments.ownerBadge')}
                        </span>
                      )}
                    </div>
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {tournament.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {t('tournament.view.code')}:{' '}
                        <strong className="text-foreground font-mono">
                          {tournament.code}
                        </strong>
                      </span>
                      <span>
                        {t('tournament.view.type')}:{' '}
                        {t(
                          `tournament.types.${getTournamentTypeLabel(tournament.type)}`
                        )}
                      </span>
                      <span>
                        {tournament.players.length} / {tournament.maxPlayers}{' '}
                        {t('tournament.view.players')}
                      </span>
                      <span>
                        {t('tournament.view.createdAt')}:{' '}
                        {new Date(tournament.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tournament/${tournament.code}`);
                    }}
                    className="gap-2 shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('tournament.myTournaments.view')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
