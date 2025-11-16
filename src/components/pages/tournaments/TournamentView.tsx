import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getTournamentByCode,
  registerPlayer,
  registerGuestPlayer,
  unregisterPlayer,
  unregisterGuestPlayer,
  updateTournamentStatus,
  reportSingleEliminationMatch,
} from '@/services/tournamentService';
import type {
  Tournament,
  TournamentStatus,
  TournamentMatch,
  TournamentMatchScore,
  TournamentPlayer,
} from '@/types/tournament';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Pause,
  Trash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SingleEliminationBracket } from './components/SingleEliminationBracket';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';

export default function TournamentView() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [guestPseudonym, setGuestPseudonym] = useState<string>('');
  const [showGuestForm, setShowGuestForm] = useState<boolean>(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportMatch, setReportMatch] = useState<TournamentMatch | null>(null);
  const [reportScores, setReportScores] = useState<Record<string, string>>({});
  const [reportWinnerKey, setReportWinnerKey] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportErrorMessage, setReportErrorMessage] = useState<string>('');
  const ownerAddParticipantSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: t('tournament.view.ownerAddParticipant.errors.nameRequired'),
      })
      .max(50, {
        message: t('tournament.view.ownerAddParticipant.errors.nameTooLong'),
      }),
  });

  type OwnerAddParticipantFormValues = z.infer<
    typeof ownerAddParticipantSchema
  >;

  const ownerAddParticipantForm = useForm<OwnerAddParticipantFormValues>({
    resolver: zodResolver(ownerAddParticipantSchema),
    defaultValues: {
      name: '',
    },
  });
  const [removingParticipantId, setRemovingParticipantId] =
    useState<string>('');

  const LOCAL_STORAGE_GUEST_KEY_PREFIX = 'tournament_guest_';
  const LOCAL_STORAGE_REGISTRATIONS_KEY = 'tournament_guest_registrations';

  const getOrCreateGuestId = (tournamentCode: string): string | null => {
    if (typeof window === 'undefined') return null;
    const storageKey = `${LOCAL_STORAGE_GUEST_KEY_PREFIX}${tournamentCode}`;
    let guestId = window.localStorage.getItem(storageKey);
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      window.localStorage.setItem(storageKey, guestId);
    }
    return guestId;
  };

  const recordGuestRegistration = (tournamentCode: string) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_REGISTRATIONS_KEY) || '[]'
      ) as string[];
      if (!existing.includes(tournamentCode)) {
        window.localStorage.setItem(
          LOCAL_STORAGE_REGISTRATIONS_KEY,
          JSON.stringify([...existing, tournamentCode])
        );
      }
    } catch (err) {
      console.warn('Failed to persist guest registration', err);
    }
  };

  const removeGuestRegistrationRecord = (tournamentCode: string) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = JSON.parse(
        window.localStorage.getItem(LOCAL_STORAGE_REGISTRATIONS_KEY) || '[]'
      ) as string[];
      if (existing.includes(tournamentCode)) {
        window.localStorage.setItem(
          LOCAL_STORAGE_REGISTRATIONS_KEY,
          JSON.stringify(existing.filter((code) => code !== tournamentCode))
        );
      }
    } catch (err) {
      console.warn('Failed to update guest registration record', err);
    }
  };

  const clearGuestId = (tournamentCode: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(
      `${LOCAL_STORAGE_GUEST_KEY_PREFIX}${tournamentCode}`
    );
  };

  const isOwner = Boolean(
    tournament && user && tournament.ownerId === user.uid
  );
  const guestId = tournament ? getOrCreateGuestId(tournament.code) : null;

  const isRegisteredAsUser = Boolean(
    tournament && user && tournament.players.some((p) => p.userId === user.uid)
  );
  const isRegisteredAsGuest = Boolean(
    tournament &&
      guestId &&
      tournament.players.some((p) => p.guestId === guestId)
  );

  const isRegistered = Boolean(isRegisteredAsUser || isRegisteredAsGuest);

  // Can register if:
  // - Tournament exists
  // - Tournament is pending or open
  // - Not already registered (as user or guest)
  // - Not full
  const canRegister =
    !!tournament &&
    !isRegistered &&
    tournament.players.length < tournament.maxPlayers &&
    (tournament.status === 'pending' || tournament.status === 'open');

  useEffect(() => {
    if (code) {
      loadTournament();
    }
  }, [code]);

  const loadTournament = async (options: { skipLoading?: boolean } = {}) => {
    const { skipLoading = false } = options;
    if (!code) return;
    if (!skipLoading) {
      setLoading(true);
    }
    setError('');
    try {
      const tournamentData = await getTournamentByCode(code);
      if (!tournamentData) {
        navigate('/tournaments/enter', {
          replace: true,
          state: { error: 'notFound', code },
        });
        return;
      }
      setTournament(tournamentData);
    } catch (err: any) {
      navigate('/tournaments/enter', {
        replace: true,
        state: { error: 'generic', code },
      });
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    if (!tournament) return;

    // Authenticated registration
    if (user) {
      setActionLoading(true);
      setError('');
      try {
        await registerPlayer(tournament.id, user);
        await loadTournament({ skipLoading: true });
      } catch (err: any) {
        setError(err.message || t('tournament.view.registerError'));
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // Guest registration flow
    if (!guestPseudonym.trim()) {
      setShowGuestForm(true);
      return;
    }

    if (!guestId) return;

    setActionLoading(true);
    setError('');
    try {
      await registerGuestPlayer(tournament.id, guestPseudonym.trim(), guestId);
      recordGuestRegistration(tournament.code);
      setGuestPseudonym('');
      setShowGuestForm(false);
      await loadTournament({ skipLoading: true });
    } catch (err: any) {
      setError(err.message || t('tournament.view.registerError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!tournament) return;
    setActionLoading(true);
    setError('');
    try {
      if (user && isRegisteredAsUser) {
        await unregisterPlayer(tournament.id, user.uid);
      } else if (guestId && isRegisteredAsGuest) {
        await unregisterGuestPlayer(tournament.id, guestId);
        removeGuestRegistrationRecord(tournament.code);
        clearGuestId(tournament.code);
      }
      await loadTournament({ skipLoading: true });
    } catch (err: any) {
      setError(err.message || t('tournament.view.unregisterError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TournamentStatus) => {
    if (!tournament) return;
    setActionLoading(true);
    setError('');
    try {
      await updateTournamentStatus(tournament.id, newStatus);
      await loadTournament({ skipLoading: true });
    } catch (err: any) {
      setError(err.message || t('tournament.view.statusError'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyTournamentLink = async () => {
    if (!code) return;
    const url = `${window.location.origin}/tournament/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openReportDialog = (match: TournamentMatch) => {
    const scores: Record<string, string> = {};
    if (requireScores) {
      match.participants.forEach((participant) => {
        const previousScore = match.scores.find(
          (entry) => entry.participantKey === participant.key
        );
        scores[participant.key] =
          previousScore && typeof previousScore.score === 'number'
            ? String(previousScore.score)
            : '';
      });
    }

    setReportMatch(match);
    setReportScores(scores);
    setReportWinnerKey(match.winnerKey || match.participants[0]?.key || '');
    setReportErrorMessage('');
    setReportDialogOpen(true);
  };

  const closeReportDialog = () => {
    setReportDialogOpen(false);
    setReportMatch(null);
    setReportScores({});
    setReportWinnerKey('');
    setReportSubmitting(false);
    setReportErrorMessage('');
  };

  const handleReportSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!tournament || !reportMatch) return;

    const participants = reportMatch.participants;
    if (participants.length === 0) {
      setReportErrorMessage(
        t('tournament.bracket.reportDialog.errors.winnerRequired')
      );
      return;
    }

    if (!reportWinnerKey) {
      setReportErrorMessage(
        t('tournament.bracket.reportDialog.errors.winnerRequired')
      );
      return;
    }

    const parsedScores: TournamentMatchScore[] = [];
    if (requireScores) {
      for (const participant of participants) {
        const rawScore = reportScores[participant.key];
        if (rawScore === undefined || rawScore === '') {
          setReportErrorMessage(
            t('tournament.bracket.reportDialog.errors.scoreRequired')
          );
          return;
        }

        const numericScore = Number(rawScore);
        if (Number.isNaN(numericScore) || numericScore < 0) {
          setReportErrorMessage(
            t('tournament.bracket.reportDialog.errors.scoreRequired')
          );
          return;
        }

        parsedScores.push({
          participantKey: participant.key,
          score: numericScore,
        });
      }
    }

    setReportSubmitting(true);
    setReportErrorMessage('');

    try {
      await reportSingleEliminationMatch(tournament.id, {
        matchId: reportMatch.id,
        winnerKey: reportWinnerKey,
        winnerParticipant: participants.find(
          (participant) => participant.key === reportWinnerKey
        ),
        scores: parsedScores,
        reportedByUid: user?.uid,
        reporterDisplayName: user?.displayName || user?.email || undefined,
        timestamp: new Date(),
      });
      closeReportDialog();
      await loadTournament({ skipLoading: true });
    } catch (err: any) {
      setReportErrorMessage(err.message || t('tournament.view.statusError'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOwnerAddParticipant = ownerAddParticipantForm.handleSubmit(
    async (values: OwnerAddParticipantFormValues) => {
      if (!tournament) return;

      ownerAddParticipantForm.clearErrors();
      setError('');

      const guestId = `owner_guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      try {
        await registerGuestPlayer(tournament.id, values.name.trim(), guestId);
        ownerAddParticipantForm.reset();
        await loadTournament({ skipLoading: true });
      } catch (err: any) {
        const message = err.message || t('tournament.view.registerError');
        ownerAddParticipantForm.setError('name', { message });
      }
    }
  );

  const handleRemoveParticipant = async (participant: TournamentPlayer) => {
    if (!tournament || !isOwner) return;

    const participantKey = participant.userId || participant.guestId;
    if (!participantKey) return;

    setRemovingParticipantId(participantKey);
    setError('');

    try {
      if (participant.userId) {
        await unregisterPlayer(tournament.id, participant.userId);
      } else if (participant.guestId) {
        await unregisterGuestPlayer(tournament.id, participant.guestId);
      }
      await loadTournament({ skipLoading: true });
    } catch (err: any) {
      setError(err.message || t('tournament.view.unregisterError'));
    } finally {
      setRemovingParticipantId('');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => navigate('/')} variant="outline">
          {t('common.goHome')}
        </Button>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  const requireScores = tournament.settings?.requireScores ?? true;

  const getTournamentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'single-elimination': 'singleElimination',
      'double-elimination': 'doubleElimination',
      'round-robin': 'roundRobin',
      swiss: 'swiss',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: TournamentStatus) => {
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            {tournament.name}
          </h1>
          {tournament.description && (
            <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
              {tournament.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyTournamentLink}
              className="gap-1 font-mono"
            >
              <span>{tournament.code}</span>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">{t('tournament.view.copyCode')}</span>
            </Button>
            {getStatusBadge(tournament.status)}
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {t('tournament.view.type')}
              </span>
              <span>
                {t(
                  `tournament.types.${getTournamentTypeLabel(tournament.type)}`
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {t('tournament.view.participants')}
              </span>
              <span>
                {tournament.players.length} / {tournament.maxPlayers}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {t('tournament.view.createdBy')}
              </span>
              <span className="truncate">{tournament.ownerDisplayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {t('tournament.view.createdAt')}
              </span>
              <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
            </div>
            {tournament.startedAt && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {t('tournament.view.startedAt')}
                </span>
                <span>
                  {new Date(tournament.startedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {tournament.completedAt && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {t('tournament.view.completedAt')}
                </span>
                <span>
                  {new Date(tournament.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            {(tournament.status === 'pending' ||
              tournament.status === 'open') &&
              tournament.players.length >= 1 && (
                <Button
                  onClick={() => handleStatusChange('in-progress')}
                  disabled={actionLoading}
                  size="sm"
                  variant="default"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('tournament.view.startTournament')}
                    </>
                  )}
                </Button>
              )}
            {tournament.status === 'in-progress' && (
              <Button
                onClick={() => handleStatusChange('paused')}
                disabled={actionLoading}
                size="sm"
                variant="outline"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    {t('tournament.view.pauseTournament')}
                  </>
                )}
              </Button>
            )}
            {tournament.status === 'paused' && (
              <Button
                onClick={() => handleStatusChange('in-progress')}
                disabled={actionLoading}
                size="sm"
                variant="default"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('tournament.view.resumeTournament')}
                  </>
                )}
              </Button>
            )}
            {(tournament.status === 'pending' ||
              tournament.status === 'open') && (
              <Button
                onClick={() => handleStatusChange('cancelled')}
                disabled={actionLoading}
                size="sm"
                variant="destructive"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('tournament.view.cancelTournament')}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        {canRegister && !user && showGuestForm && (
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pseudonym">
                  {t('tournament.view.enterPseudonym')}
                </Label>
                <Input
                  id="pseudonym"
                  type="text"
                  placeholder={t('tournament.view.pseudonymPlaceholder')}
                  value={guestPseudonym}
                  onChange={(e) => setGuestPseudonym(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && guestPseudonym.trim()) {
                      handleRegister();
                    }
                  }}
                  className="mt-2"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('tournament.view.pseudonymHint')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRegister}
                  disabled={actionLoading || !guestPseudonym.trim()}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('tournament.view.registering')}
                    </>
                  ) : (
                    t('tournament.view.register')
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowGuestForm(false);
                    setGuestPseudonym('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {canRegister && (!showGuestForm || user) && (
            <Button size="sm" onClick={handleRegister} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('tournament.view.registering')}
                </>
              ) : (
                t('tournament.view.register')
              )}
            </Button>
          )}
          {isRegistered &&
            tournament.status !== 'completed' &&
            tournament.status !== 'cancelled' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnregister}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('tournament.view.unregistering')}
                  </>
                ) : (
                  t('tournament.view.unregister')
                )}
              </Button>
            )}
        </div>
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="flex flex-wrap gap-2">
          {(tournament.status === 'open' ||
            tournament.status === 'in-progress' ||
            tournament.status === 'paused') && (
            <Button
              onClick={() => handleStatusChange('completed')}
              disabled={actionLoading}
              variant="outline"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('tournament.view.completeTournament')}
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Bracket */}
      {tournament.type === 'single-elimination' && (
        <>
          {tournament.progress ? (
            <SingleEliminationBracket
              progress={tournament.progress}
              isOwner={isOwner}
              onReportMatch={isOwner ? openReportDialog : undefined}
            />
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">
              {t('tournament.bracket.awaitingStart')}
            </Card>
          )}
        </>
      )}

      {/* Owner add participant */}
      {isOwner && tournament.status !== 'completed' && (
        <Card className="p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              {t('tournament.view.ownerAddParticipant.title')}
            </h2>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              {t('tournament.view.ownerAddParticipant.description')}
            </p>
          </div>
          <Form {...ownerAddParticipantForm}>
            <form onSubmit={handleOwnerAddParticipant} className="space-y-3">
              <FormField
                control={ownerAddParticipantForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('tournament.view.ownerAddParticipant.nameLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder={t(
                          'tournament.view.ownerAddParticipant.namePlaceholder'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  type="submit"
                  disabled={ownerAddParticipantForm.formState.isSubmitting}
                >
                  {ownerAddParticipantForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('tournament.view.ownerAddParticipant.addButton')
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t('tournament.view.ownerAddParticipant.helper')}
                </p>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {/* Players List */}
      <Card className="p-4 sm:p-6">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 mb-4">
          {t('tournament.view.players')} ({tournament.players.length}/
          {tournament.maxPlayers})
        </h2>
        {tournament.players.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('tournament.view.noPlayers')}
          </p>
        ) : (
          <div className="space-y-2">
            {tournament.players.map((participant) => {
              const participantKey =
                participant.userId ||
                participant.guestId ||
                participant.displayName;
              const isCurrentParticipant =
                (user && participant.userId === user.uid) ||
                (!user && guestId && participant.guestId === guestId);
              const canOwnerRemove =
                isOwner &&
                tournament.status !== 'completed' &&
                tournament.status !== 'cancelled' &&
                participant.userId !== tournament.ownerId;

              return (
                <ButtonGroup
                  key={participantKey}
                  className={cn(
                    'w-full overflow-hidden rounded-md border bg-background transition',
                    isCurrentParticipant && 'border-primary/50 bg-primary/5'
                  )}
                >
                  <ButtonGroupText
                    className={cn(
                      'flex flex-1 items-center justify-between',
                      isCurrentParticipant && 'text-primary'
                    )}
                  >
                    <div className="min-w-0 p-1">
                      <p className="truncate font-medium text-sm">
                        {participant.displayName}
                      </p>
                      {isOwner && participant.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {participant.email}
                        </p>
                      )}
                    </div>
                    {isCurrentParticipant && (
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {t('tournament.view.you')}
                      </span>
                    )}
                  </ButtonGroupText>
                  {canOwnerRemove && (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={(event) => {
                        event.preventDefault();
                        handleRemoveParticipant(participant);
                      }}
                      disabled={
                        removingParticipantId === participantKey ||
                        actionLoading
                      }
                    >
                      {removingParticipantId === participantKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {t('tournament.view.removeParticipant')}
                      </span>
                    </Button>
                  )}
                </ButtonGroup>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog
        open={reportDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeReportDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('tournament.bracket.reportDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('tournament.bracket.reportDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {reportMatch ? (
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div className="space-y-4">
                {requireScores ? (
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t('tournament.bracket.reportDialog.scoresLabel')}
                    </Label>
                    <div className="mt-2 space-y-3">
                      {reportMatch.participants.map((participant) => (
                        <div key={participant.key} className="space-y-1">
                          <Label htmlFor={`score-${participant.key}`}>
                            {participant.displayName}
                          </Label>
                          <Input
                            id={`score-${participant.key}`}
                            type="number"
                            min={0}
                            value={reportScores[participant.key] ?? ''}
                            onChange={(event) =>
                              setReportScores((prev) => ({
                                ...prev,
                                [participant.key]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    {t('tournament.bracket.reportDialog.scoresOptional')}
                  </p>
                )}

                <div className="space-y-2">
                  <Label>
                    {t('tournament.bracket.reportDialog.winnerLabel')}
                  </Label>
                  <Select
                    value={reportWinnerKey}
                    onValueChange={setReportWinnerKey}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          'tournament.bracket.reportDialog.winnerLabel'
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {reportMatch.participants.map((participant) => (
                        <SelectItem
                          key={participant.key}
                          value={participant.key}
                        >
                          {participant.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {reportErrorMessage && (
                <div className="rounded border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {reportErrorMessage}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeReportDialog}
                  disabled={reportSubmitting}
                >
                  {t('tournament.bracket.reportDialog.cancel')}
                </Button>
                <Button type="submit" disabled={reportSubmitting}>
                  {reportSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('tournament.bracket.reportDialog.submit')
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('tournament.bracket.reportDialog.description')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
