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
} from '@/services/tournamentService';
import type { Tournament, TournamentStatus } from '@/types/tournament';
import { useTranslation } from 'react-i18next';
import { User, Loader2, Play, Square, CheckCircle, XCircle, Copy, Check, Pause } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  // Generate or retrieve guest ID from localStorage
  const getOrCreateGuestId = (tournamentCode: string): string => {
    const storageKey = `tournament_guest_${tournamentCode}`;
    let guestId = localStorage.getItem(storageKey);
    if (!guestId) {
      // Generate a simple unique ID (not cryptographically secure, but sufficient for this use case)
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(storageKey, guestId);
    }
    return guestId;
  };

  const isOwner = tournament && user && tournament.ownerId === user.uid;
  const guestId = tournament ? getOrCreateGuestId(tournament.code) : null;
  
  // Check if user (authenticated) is registered
  const isRegisteredAsUser = tournament && user && tournament.players.some((p) => p.userId === user.uid);
  
  // Check if guest is registered
  const isRegisteredAsGuest = tournament && guestId && tournament.players.some((p) => p.guestId === guestId);
  
  const isRegistered = isRegisteredAsUser || isRegisteredAsGuest;

  // Can register if:
  // - Tournament exists
  // - Tournament is pending or open
  // - Not already registered (as user or guest)
  // - Not full
  const canRegister =
    tournament &&
    !isRegistered &&
    tournament.players.length < tournament.maxPlayers &&
    (tournament.status === 'pending' || tournament.status === 'open');

  useEffect(() => {
    if (code) {
      loadTournament();
    }
  }, [code]);

  const loadTournament = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const tournamentData = await getTournamentByCode(code);
      if (!tournamentData) {
        setError(t('tournament.view.notFound'));
      } else {
        setTournament(tournamentData);
      }
    } catch (err: any) {
      setError(err.message || t('tournament.view.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!tournament) return;
    
    // If user is logged in, register as authenticated user
    if (user) {
      setActionLoading(true);
      setError('');
      try {
        await registerPlayer(tournament.id, user);
        await loadTournament();
      } catch (err: any) {
        setError(err.message || t('tournament.view.registerError'));
      } finally {
        setActionLoading(false);
      }
    } else {
      // Show guest form if pseudonym is not set
      if (!guestPseudonym.trim()) {
        setShowGuestForm(true);
        return;
      }
      
      // Register as guest
      if (!guestId) return;
      setActionLoading(true);
      setError('');
      try {
        await registerGuestPlayer(tournament.id, guestPseudonym.trim(), guestId);
        setGuestPseudonym('');
        setShowGuestForm(false);
        await loadTournament();
      } catch (err: any) {
        setError(err.message || t('tournament.view.registerError'));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleUnregister = async () => {
    if (!tournament) return;
    setActionLoading(true);
    setError('');
    try {
      if (user && isRegisteredAsUser) {
        // Unregister authenticated user
        await unregisterPlayer(tournament.id, user.uid);
      } else if (guestId && isRegisteredAsGuest) {
        // Unregister guest
        await unregisterGuestPlayer(tournament.id, guestId);
        // Clear guest ID from localStorage
        localStorage.removeItem(`tournament_guest_${tournament.code}`);
      }
      await loadTournament();
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
      await loadTournament();
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

  const getTournamentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'single-elimination': 'singleElimination',
      'double-elimination': 'doubleElimination',
      'round-robin': 'roundRobin',
      'swiss': 'swiss',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const statusConfig = {
      pending: { label: t('tournament.status.pending'), icon: Square, className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
      open: { label: t('tournament.status.open'), icon: CheckCircle, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      'in-progress': { label: t('tournament.status.inProgress'), icon: Play, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
      paused: { label: t('tournament.status.paused'), icon: Pause, className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
      completed: { label: t('tournament.status.completed'), icon: CheckCircle, className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
      cancelled: { label: t('tournament.status.cancelled'), icon: XCircle, className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{tournament.name}</h1>
          {tournament.description && (
            <p className="text-sm sm:text-base text-muted-foreground mb-2">
              {tournament.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              {t('tournament.view.code')}: <strong className="text-foreground font-mono">{tournament.code}</strong>
              {getStatusBadge(tournament.status)}
            </span>
            <span>
              {t('tournament.view.type')}: {t(`tournament.types.${getTournamentTypeLabel(tournament.type)}`)}
            </span>
            <span>
              {tournament.players.length} / {tournament.maxPlayers} {t('tournament.view.players')}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyTournamentLink}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('tournament.view.copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t('tournament.view.copyLink')}
                </>
              )}
            </Button>
                         {(tournament.status === 'pending' || tournament.status === 'open') && tournament.players.length >= 1 && (
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
            {(tournament.status === 'pending' || tournament.status === 'open') && (
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
        {/* Guest Pseudonym Form */}
        {canRegister && !user && showGuestForm && (
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pseudonym">{t('tournament.view.enterPseudonym')}</Label>
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

        {/* Register/Unregister Buttons */}
        <div className="flex flex-wrap gap-2">
          {canRegister && (!showGuestForm || user) && (
            <Button onClick={handleRegister} disabled={actionLoading}>
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
          {isRegistered && tournament.status !== 'completed' && tournament.status !== 'cancelled' && (
            <Button variant="outline" onClick={handleUnregister} disabled={actionLoading}>
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
            {(tournament.status === 'open' || tournament.status === 'in-progress' || tournament.status === 'paused') && (
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

      {/* Players List */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">
          {t('tournament.view.players')} ({tournament.players.length}/{tournament.maxPlayers})
        </h2>
        {tournament.players.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('tournament.view.noPlayers')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tournament.players.map((player) => (
              <div
                key={player.userId || player.guestId}
                className="flex items-center gap-3 p-3 rounded-md border bg-card"
              >
                {player.photoURL ? (
                  <img
                    src={player.photoURL}
                    alt={player.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{player.displayName}</p>
                  {isOwner && (
                    <p className="text-xs text-muted-foreground truncate">{player.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tournament Info */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">{t('tournament.view.info')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">{t('tournament.view.createdBy')}</p>
            <p className="font-medium">{tournament.ownerDisplayName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">{t('tournament.view.createdAt')}</p>
            <p className="font-medium">
              {new Date(tournament.createdAt).toLocaleDateString()}
            </p>
          </div>
          {tournament.startedAt && (
            <div>
              <p className="text-muted-foreground mb-1">{t('tournament.view.startedAt')}</p>
              <p className="font-medium">
                {new Date(tournament.startedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {tournament.completedAt && (
            <div>
                <p className="text-muted-foreground mb-1">{t('tournament.view.completedAt')}</p>
                <p className="font-medium">
                  {new Date(tournament.completedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {(tournament.winScore !== undefined || tournament.loseScore !== undefined) && (
              <>
                {tournament.winScore !== undefined && (
                  <div>
                    <p className="text-muted-foreground mb-1">{t('tournament.view.winScore')}</p>
                    <p className="font-medium">{tournament.winScore} {t('tournament.view.points')}</p>
                  </div>
                )}
                {tournament.loseScore !== undefined && (
                  <div>
                    <p className="text-muted-foreground mb-1">{t('tournament.view.loseScore')}</p>
                    <p className="font-medium">{tournament.loseScore} {t('tournament.view.points')}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
    </div>
  );
}
