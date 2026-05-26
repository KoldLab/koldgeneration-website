import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ArrowLeft,
  Copy,
  Minus,
  MoreVertical,
  Plus,
  Share2,
  Shuffle,
  Trash2,
  Trophy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  getSession,
  updateSession,
  deleteSession,
  listPlayers,
  generateShareCode,
  revokeShareCode,
  subscribeToSession,
} from '@/services/volleyballService';
import {
  VOLLEYBALL_LEVELS,
  VOLLEYBALL_POSITIONS,
  type SessionMatch,
  type SessionPlayer,
  type SessionTeam,
  type VolleyballLevel,
  type VolleyballPlayer,
  type VolleyballPosition,
  type VolleyballSession,
} from '@/types/volleyball';
import {
  buildBalancedTeams,
  buildRandomTeams,
  matchScore,
  playerValue,
} from '@/lib/volleyball';

const MIN_TEAMS = 2;
const MAX_TEAMS = 8;
const DEFAULT_LEVEL: VolleyballLevel = 'B';
const DEFAULT_POSITION: VolleyballPosition = 'outside';

function makeId() {
  return Math.random().toString(36).slice(2, 12);
}

function defaultTeamName(t: TFunction, i: number) {
  return t('volleyballTeamMaker.teamLabel', { index: i + 1 });
}

export default function VolleyballSession() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [session, setSession] = useState<VolleyballSession | null>(null);
  const [roster, setRoster] = useState<VolleyballPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  // Generation controls
  const [teamCount, setTeamCount] = useState(2);
  const [mode, setMode] = useState<'balanced' | 'random'>('balanced');

  // Ad-hoc player form
  const [adhocName, setAdhocName] = useState('');
  const [adhocPosition, setAdhocPosition] =
    useState<VolleyballPosition>(DEFAULT_POSITION);
  const [adhocLevel, setAdhocLevel] = useState<VolleyballLevel>(DEFAULT_LEVEL);

  // Sharing
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareWorking, setShareWorking] = useState(false);

  const isOwner = useMemo(
    () => !!user && !!session && user.uid === session.userId,
    [user, session]
  );

  // Debounced auto-save
  const saveTimerRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<Partial<VolleyballSession>>({});
  const lastSavedSignatureRef = useRef('');

  const positionLabel = useCallback(
    (pos: VolleyballPosition) => t(`volleyballTeamMaker.positions.${pos}`),
    [t]
  );

  // Load session (+ roster if signed in). Guests with a share code can load too.
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const tasks: [
      Promise<VolleyballSession | null>,
      Promise<VolleyballPlayer[]>,
    ] = [getSession(id), user ? listPlayers(user.uid) : Promise.resolve([])];
    Promise.all(tasks)
      .then(([s, r]) => {
        if (cancelled) return;
        if (!s) {
          error(t('volleyballTeamMaker.errors.notFound'));
          navigate('/tools/volleyball-team-maker');
          return;
        }
        setSession(s);
        setRoster(r);
        lastSavedSignatureRef.current = JSON.stringify({
          name: s.name,
          date: s.date,
          notes: s.notes,
          players: s.players,
          teams: s.teams,
          matches: s.matches,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        error(t('volleyballTeamMaker.errors.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `error`, `t`, `navigate` excluded: they're recreated each render and would
    // cause an infinite re-fetch loop. Only reload when id or user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // Realtime: keep the session in sync with edits from other devices (phone
  // entering scores while laptop is watching). We only adopt remote state when
  // there is no pending local patch waiting to flush — otherwise we'd clobber
  // an in-flight edit.
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToSession(id, (next) => {
      if (!next) return;
      if (Object.keys(pendingPatchRef.current).length > 0) {
        // Local edit not yet saved; ignore this round, the next save will reconcile.
        return;
      }
      const incomingSig = JSON.stringify({
        name: next.name,
        date: next.date,
        notes: next.notes,
        players: next.players,
        teams: next.teams,
        matches: next.matches,
      });
      if (incomingSig === lastSavedSignatureRef.current) return;
      lastSavedSignatureRef.current = incomingSig;
      setSession((prev) => (prev ? { ...next } : next));
    });
    return unsubscribe;
  }, [id]);

  const scheduleSave = useCallback(
    (patch: Partial<VolleyballSession>) => {
      if (!id) return;
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      setSaveState('saving');
      saveTimerRef.current = window.setTimeout(() => {
        const toSave = pendingPatchRef.current;
        pendingPatchRef.current = {};
        updateSession(id, toSave)
          .then(() => setSaveState('saved'))
          .catch((e) => {
            console.error(e);
            error(t('volleyballTeamMaker.errors.saveFailed'));
            setSaveState('idle');
          });
      }, 600);
    },
    [id, error, t]
  );

  /** Mutate the session locally and queue a save with the changed fields. */
  const mutate = useCallback(
    (updater: (s: VolleyballSession) => VolleyballSession) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        const patch: Partial<VolleyballSession> = {};
        if (next.name !== prev.name) patch.name = next.name;
        if (next.date !== prev.date) patch.date = next.date;
        if (next.notes !== prev.notes) patch.notes = next.notes;
        if (next.players !== prev.players) patch.players = next.players;
        if (next.teams !== prev.teams) patch.teams = next.teams;
        if (next.matches !== prev.matches) patch.matches = next.matches;
        if (Object.keys(patch).length) scheduleSave(patch);
        return next;
      });
    },
    [scheduleSave]
  );

  // Cleanup pending save on unmount: flush.
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        if (id && Object.keys(pendingPatchRef.current).length) {
          const toSave = pendingPatchRef.current;
          pendingPatchRef.current = {};
          void updateSession(id, toSave);
        }
      }
    };
  }, [id]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    if (!window.confirm(t('volleyballTeamMaker.confirmDeleteSession'))) return;
    try {
      await deleteSession(id);
      success(t('volleyballTeamMaker.sessionDeleted'));
      navigate('/tools/volleyball-team-maker');
    } catch (e) {
      console.error(e);
      error(t('volleyballTeamMaker.errors.deleteFailed'));
    }
  }, [id, success, error, t, navigate]);

  const handleGenerateShareCode = useCallback(async () => {
    if (!id) return;
    setShareWorking(true);
    try {
      const code = await generateShareCode(id);
      setSession((prev) => (prev ? { ...prev, shareCode: code } : prev));
      success(t('volleyballTeamMaker.share.generated'));
    } catch (e) {
      console.error(e);
      error(t('volleyballTeamMaker.share.errors.generateFailed'));
    } finally {
      setShareWorking(false);
    }
  }, [id, success, error, t]);

  const handleRevokeShareCode = useCallback(async () => {
    if (!id) return;
    if (!window.confirm(t('volleyballTeamMaker.share.confirmRevoke'))) return;
    setShareWorking(true);
    try {
      await revokeShareCode(id);
      setSession((prev) => (prev ? { ...prev, shareCode: null } : prev));
      success(t('volleyballTeamMaker.share.revoked'));
    } catch (e) {
      console.error(e);
      error(t('volleyballTeamMaker.share.errors.revokeFailed'));
    } finally {
      setShareWorking(false);
    }
  }, [id, success, error, t]);

  // ───────── Players in session ─────────

  const addRosterPlayer = useCallback(
    (rp: VolleyballPlayer) => {
      mutate((s) => {
        if (s.players.some((p) => p.rosterPlayerId === rp.id)) return s;
        const newPlayer: SessionPlayer = {
          id: makeId(),
          name: rp.name,
          position: rp.position,
          level: rp.level,
          rosterPlayerId: rp.id,
        };
        return { ...s, players: [...s.players, newPlayer] };
      });
    },
    [mutate]
  );

  const addAdhocPlayer = useCallback(() => {
    const name = adhocName.trim();
    if (!name) {
      error(t('volleyballTeamMaker.errors.nameRequired'));
      return;
    }
    mutate((s) => ({
      ...s,
      players: [
        ...s.players,
        {
          id: makeId(),
          name,
          position: adhocPosition,
          level: adhocLevel,
          rosterPlayerId: null,
        },
      ],
    }));
    setAdhocName('');
    setAdhocPosition(DEFAULT_POSITION);
    setAdhocLevel(DEFAULT_LEVEL);
  }, [adhocName, adhocPosition, adhocLevel, mutate, error, t]);

  const removeSessionPlayer = useCallback(
    (playerId: string) => {
      mutate((s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== playerId),
        teams: s.teams.map((team) => ({
          ...team,
          playerIds: team.playerIds.filter((pid) => pid !== playerId),
        })),
      }));
    },
    [mutate]
  );

  const updateSessionPlayer = useCallback(
    (
      playerId: string,
      patch: Partial<Pick<SessionPlayer, 'name' | 'position' | 'level'>>
    ) => {
      mutate((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId ? { ...p, ...patch } : p
        ),
      }));
    },
    [mutate]
  );

  // ───────── Teams ─────────

  const generateTeams = useCallback(() => {
    if (!session) return;
    if (session.players.length < teamCount) {
      error(
        t('volleyballTeamMaker.errors.notEnoughPlayers', { count: teamCount })
      );
      return;
    }
    const grouped =
      mode === 'balanced'
        ? buildBalancedTeams(session.players, teamCount)
        : buildRandomTeams(session.players, teamCount);
    const newTeams: SessionTeam[] = grouped.map((players, i) => ({
      id: makeId(),
      name: defaultTeamName(t, i),
      playerIds: players.map((p) => p.id),
    }));
    mutate((s) => ({ ...s, teams: newTeams, matches: [] }));
  }, [session, teamCount, mode, mutate, error, t]);

  const renameTeam = useCallback(
    (teamId: string, name: string) => {
      mutate((s) => ({
        ...s,
        teams: s.teams.map((tm) => (tm.id === teamId ? { ...tm, name } : tm)),
      }));
    },
    [mutate]
  );

  const movePlayerToTeam = useCallback(
    (playerId: string, targetTeamId: string | null) => {
      mutate((s) => {
        const teams = s.teams.map((tm) => ({
          ...tm,
          playerIds: tm.playerIds.filter((pid) => pid !== playerId),
        }));
        if (targetTeamId) {
          const target = teams.find((tm) => tm.id === targetTeamId);
          if (target && !target.playerIds.includes(playerId)) {
            target.playerIds.push(playerId);
          }
        }
        return { ...s, teams };
      });
    },
    [mutate]
  );

  // ───────── Matches ─────────

  const addMatch = useCallback(() => {
    if (!session) return;
    if (session.teams.length < 2) {
      error(t('volleyballTeamMaker.errors.needTwoTeams'));
      return;
    }
    const newMatch: SessionMatch = {
      id: makeId(),
      teamAId: session.teams[0].id,
      teamBId: session.teams[1].id,
      sets: [{ teamAScore: 0, teamBScore: 0 }],
      createdAt: new Date().toISOString(),
    };
    mutate((s) => ({ ...s, matches: [...s.matches, newMatch] }));
  }, [session, mutate, error, t]);

  const updateMatch = useCallback(
    (matchId: string, patch: Partial<SessionMatch>) => {
      mutate((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === matchId ? { ...m, ...patch } : m
        ),
      }));
    },
    [mutate]
  );

  const deleteMatch = useCallback(
    (matchId: string) => {
      mutate((s) => ({
        ...s,
        matches: s.matches.filter((m) => m.id !== matchId),
      }));
    },
    [mutate]
  );

  const addSet = useCallback(
    (matchId: string) => {
      mutate((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === matchId
            ? { ...m, sets: [...m.sets, { teamAScore: 0, teamBScore: 0 }] }
            : m
        ),
      }));
    },
    [mutate]
  );

  const removeSet = useCallback(
    (matchId: string, setIndex: number) => {
      mutate((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === matchId
            ? { ...m, sets: m.sets.filter((_, i) => i !== setIndex) }
            : m
        ),
      }));
    },
    [mutate]
  );

  const updateSet = useCallback(
    (
      matchId: string,
      setIndex: number,
      patch: { teamAScore?: number; teamBScore?: number }
    ) => {
      mutate((s) => ({
        ...s,
        matches: s.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                sets: m.sets.map((set, i) =>
                  i === setIndex ? { ...set, ...patch } : set
                ),
              }
            : m
        ),
      }));
    },
    [mutate]
  );

  // ───────── Derived ─────────

  const playersById = useMemo(() => {
    const map = new Map<string, SessionPlayer>();
    session?.players.forEach((p) => map.set(p.id, p));
    return map;
  }, [session]);

  const assignedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    session?.teams.forEach((tm) => tm.playerIds.forEach((pid) => set.add(pid)));
    return set;
  }, [session]);

  const unassignedPlayers = useMemo(() => {
    if (!session) return [];
    return session.players.filter((p) => !assignedPlayerIds.has(p.id));
  }, [session, assignedPlayerIds]);

  const rosterAlreadyInSession = useMemo(() => {
    const set = new Set<string>();
    session?.players.forEach(
      (p) => p.rosterPlayerId && set.add(p.rosterPlayerId)
    );
    return set;
  }, [session]);

  if (loading || !session) {
    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center py-16 lg:max-w-5xl">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 lg:max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5"
          onClick={() => navigate('/tools/volleyball-team-maker')}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('volleyballTeamMaker.backToSessions')}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {saveState === 'saving'
            ? t('volleyballTeamMaker.saving')
            : saveState === 'saved'
              ? t('volleyballTeamMaker.saved')
              : ''}
        </span>
        {isOwner ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShareDialogOpen(true)}
              aria-label={t('volleyballTeamMaker.share.button')}
              title={t('volleyballTeamMaker.share.button')}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => void handleDelete()}
              aria-label={t('volleyballTeamMaker.deleteSession')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t('volleyballTeamMaker.share.guestBadge')}
          </Badge>
        )}
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareCode={session.shareCode}
        working={shareWorking}
        onGenerate={() => void handleGenerateShareCode()}
        onRevoke={() => void handleRevokeShareCode()}
      />

      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="vtm-session-name">
              {t('volleyballTeamMaker.sessionName')}
            </Label>
            <Input
              id="vtm-session-name"
              className="h-10"
              value={session.name}
              onChange={(e) => mutate((s) => ({ ...s, name: e.target.value }))}
              placeholder={t('volleyballTeamMaker.sessionNamePlaceholder')}
            />
          </div>
          <div className="space-y-2 sm:w-44">
            <Label htmlFor="vtm-session-date">
              {t('volleyballTeamMaker.sessionDate')}
            </Label>
            <Input
              id="vtm-session-date"
              type="date"
              className="h-10"
              value={session.date}
              onChange={(e) => mutate((s) => ({ ...s, date: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <Label htmlFor="vtm-session-notes">
            {t('volleyballTeamMaker.sessionNotes')}
          </Label>
          <Textarea
            id="vtm-session-notes"
            rows={2}
            value={session.notes}
            onChange={(e) => mutate((s) => ({ ...s, notes: e.target.value }))}
            placeholder={t('volleyballTeamMaker.sessionNotesPlaceholder')}
          />
        </div>
      </Card>

      {/* PLAYERS */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t('volleyballTeamMaker.sessionPlayers')}
            </h3>
            <Badge variant="secondary">
              {t('volleyballTeamMaker.playerCount', {
                count: session.players.length,
              })}
            </Badge>
          </div>

          {roster.length > 0 ? (
            <div className="space-y-2">
              <Label>{t('volleyballTeamMaker.addFromRoster')}</Label>
              <div className="flex flex-wrap gap-2">
                {roster.map((rp) => {
                  const already = rosterAlreadyInSession.has(rp.id);
                  return (
                    <Button
                      key={rp.id}
                      type="button"
                      variant={already ? 'outline' : 'secondary'}
                      size="sm"
                      className="h-9 gap-1.5"
                      disabled={already}
                      onClick={() => addRosterPlayer(rp)}
                    >
                      {already ? null : <Plus className="h-3 w-3" />}
                      {rp.name}
                      <span className="text-muted-foreground">
                        ({rp.level})
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>{t('volleyballTeamMaker.addAdhoc')}</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
              <Input
                className="h-10"
                value={adhocName}
                onChange={(e) => setAdhocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAdhocPlayer();
                  }
                }}
                placeholder={t('volleyballTeamMaker.playerNamePlaceholder')}
              />
              <Select
                value={adhocPosition}
                onValueChange={(v) => setAdhocPosition(v as VolleyballPosition)}
              >
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLLEYBALL_POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {positionLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={adhocLevel}
                onValueChange={(v) => setAdhocLevel(v as VolleyballLevel)}
              >
                <SelectTrigger className="h-10 w-full sm:w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOLLEYBALL_LEVELS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                className="h-10 gap-2"
                onClick={addAdhocPlayer}
              >
                <Plus className="h-4 w-4" />
                {t('volleyballTeamMaker.add')}
              </Button>
            </div>
          </div>

          {session.players.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('volleyballTeamMaker.noSessionPlayers')}
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {session.players.map((p) => (
                <li
                  key={p.id}
                  className="space-y-2 p-2 sm:flex sm:items-center sm:gap-2 sm:space-y-0"
                >
                  <div className="flex items-center gap-2 sm:contents">
                    <Input
                      className="h-10 min-w-0 flex-1 sm:flex-1"
                      value={p.name}
                      onChange={(e) =>
                        updateSessionPlayer(p.id, { name: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 sm:order-last"
                      onClick={() => removeSessionPlayer(p.id)}
                      aria-label={t('volleyballTeamMaker.removePlayer', {
                        name: p.name,
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 sm:contents">
                    <Select
                      value={p.position}
                      onValueChange={(v) =>
                        updateSessionPlayer(p.id, {
                          position: v as VolleyballPosition,
                        })
                      }
                    >
                      <SelectTrigger className="h-10 w-full sm:w-44 sm:shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLLEYBALL_POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {positionLabel(pos)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={p.level}
                      onValueChange={(v) =>
                        updateSessionPlayer(p.id, {
                          level: v as VolleyballLevel,
                        })
                      }
                    >
                      <SelectTrigger className="h-10 w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOLLEYBALL_LEVELS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* TEAMS */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t('volleyballTeamMaker.teams')}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_auto_1fr]">
            <div className="space-y-2 sm:w-32">
              <Label htmlFor="vtm-team-count">
                {t('volleyballTeamMaker.teamCount')}
              </Label>
              <Input
                id="vtm-team-count"
                type="number"
                min={MIN_TEAMS}
                max={MAX_TEAMS}
                inputMode="numeric"
                className="h-10"
                value={teamCount}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) return;
                  setTeamCount(Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, n)));
                }}
              />
            </div>
            <div className="space-y-2 sm:w-56">
              <Label htmlFor="vtm-mode">{t('volleyballTeamMaker.mode')}</Label>
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as typeof mode)}
              >
                <SelectTrigger className="h-10 w-full" id="vtm-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">
                    {t('volleyballTeamMaker.modeBalanced')}
                  </SelectItem>
                  <SelectItem value="random">
                    {t('volleyballTeamMaker.modeRandom')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                className="h-10 w-full gap-2 sm:w-auto"
                onClick={generateTeams}
                disabled={session.players.length < teamCount}
              >
                <Shuffle className="h-4 w-4" />
                {t('volleyballTeamMaker.generate')}
              </Button>
            </div>
          </div>

          {session.teams.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('volleyballTeamMaker.noTeamsYet')}
            </p>
          ) : (
            <div
              className={
                session.teams.length === 2
                  ? 'grid gap-3 sm:grid-cols-2'
                  : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
              }
            >
              {session.teams.map((team) => {
                const teamPlayers = team.playerIds
                  .map((pid) => playersById.get(pid))
                  .filter(Boolean) as SessionPlayer[];
                const total = teamPlayers.reduce(
                  (sum, p) => sum + playerValue(p),
                  0
                );
                return (
                  <Card key={team.id} className="gap-4 px-4 py-5">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-0">
                      <Input
                        className="h-9 flex-1 border-0 bg-transparent px-1 text-base font-semibold focus-visible:ring-1 dark:bg-transparent"
                        value={team.name}
                        onChange={(e) => renameTeam(team.id, e.target.value)}
                      />
                      <Badge variant="secondary" className="shrink-0">
                        {total}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      {teamPlayers.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          {t('volleyballTeamMaker.emptyTeam')}
                        </p>
                      ) : (
                        <ul className="space-y-1.5 text-sm">
                          {teamPlayers.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="min-w-0 truncate">{p.name}</span>
                              <span className="flex shrink-0 items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {positionLabel(p.position)}
                                </Badge>
                                <span className="text-muted-foreground tabular-nums">
                                  {p.level}
                                </span>
                                <Select
                                  value={team.id}
                                  onValueChange={(v) =>
                                    movePlayerToTeam(
                                      p.id,
                                      v === '__bench__' ? null : v
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className="h-7 w-7 shrink-0 justify-center border-0 p-0 text-muted-foreground hover:bg-accent hover:text-foreground [&>svg]:hidden"
                                    aria-label={t(
                                      'volleyballTeamMaker.assignTo'
                                    )}
                                    title={t('volleyballTeamMaker.assignTo')}
                                  >
                                    <span className="flex items-center justify-center">
                                      <MoreVertical className="h-4 w-4" />
                                    </span>
                                  </SelectTrigger>
                                  <SelectContent align="end">
                                    {session.teams.map((tm) => (
                                      <SelectItem
                                        key={tm.id}
                                        value={tm.id}
                                        disabled={tm.id === team.id}
                                      >
                                        {t('volleyballTeamMaker.moveToTeam', {
                                          team: tm.name,
                                        })}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__bench__">
                                      {t('volleyballTeamMaker.moveToBench')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {unassignedPlayers.length > 0 && session.teams.length > 0 ? (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-sm font-medium">
                {t('volleyballTeamMaker.bench')}
              </p>
              <ul className="space-y-1 text-sm">
                {unassignedPlayers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <Select onValueChange={(v) => movePlayerToTeam(p.id, v)}>
                      <SelectTrigger className="h-8 w-36 shrink-0">
                        <SelectValue
                          placeholder={t('volleyballTeamMaker.assignTo')}
                        />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {session.teams.map((tm) => (
                          <SelectItem key={tm.id} value={tm.id}>
                            {tm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Card>

      {/* MATCHES */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              {t('volleyballTeamMaker.matches')}
            </h3>
            <Button
              type="button"
              className="h-10 gap-2"
              onClick={addMatch}
              disabled={session.teams.length < 2}
            >
              <Plus className="h-4 w-4" />
              {t('volleyballTeamMaker.newMatch')}
            </Button>
          </div>

          {session.matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {session.teams.length < 2
                ? t('volleyballTeamMaker.noTeamsYetForMatch')
                : t('volleyballTeamMaker.noMatchesYet')}
            </p>
          ) : (
            <div className="space-y-3">
              {session.matches.map((match) => {
                const { a, b } = matchScore(match.sets);
                const teamA = session.teams.find(
                  (tm) => tm.id === match.teamAId
                );
                const teamB = session.teams.find(
                  (tm) => tm.id === match.teamBId
                );
                const teamAName =
                  teamA?.name || t('volleyballTeamMaker.teamA');
                const teamBName =
                  teamB?.name || t('volleyballTeamMaker.teamB');
                const winner = a === b ? null : a > b ? 'a' : 'b';
                return (
                  <Card key={match.id} className="gap-3 p-4">
                    <CardHeader className="space-y-0 p-0">
                      {/* Mobile-only top row: trash button right-aligned. */}
                      <div className="mb-1 flex justify-end sm:hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMatch(match.id)}
                          aria-label={t('volleyballTeamMaker.deleteMatch')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid-cols-[3.5rem_1fr_auto_1fr_2rem]">
                        <span className="hidden sm:block" />
                        <Select
                          value={match.teamAId}
                          onValueChange={(v) =>
                            updateMatch(match.id, { teamAId: v })
                          }
                        >
                          <SelectTrigger
                            className={
                              winner === 'a'
                                ? 'h-9 w-full font-semibold'
                                : 'h-9 w-full'
                            }
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {session.teams.map((tm) => (
                              <SelectItem
                                key={tm.id}
                                value={tm.id}
                                disabled={tm.id === match.teamBId}
                              >
                                {tm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge
                          variant="secondary"
                          className="shrink-0 whitespace-nowrap"
                        >
                          {a} – {b}
                        </Badge>
                        <Select
                          value={match.teamBId}
                          onValueChange={(v) =>
                            updateMatch(match.id, { teamBId: v })
                          }
                        >
                          <SelectTrigger
                            className={
                              winner === 'b'
                                ? 'h-9 w-full font-semibold'
                                : 'h-9 w-full'
                            }
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {session.teams.map((tm) => (
                              <SelectItem
                                key={tm.id}
                                value={tm.id}
                                disabled={tm.id === match.teamAId}
                              >
                                {tm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hidden h-8 w-8 justify-self-end text-destructive hover:text-destructive sm:flex"
                          onClick={() => deleteMatch(match.id)}
                          aria-label={t('volleyballTeamMaker.deleteMatch')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 p-0">
                      <CardTitle className="sr-only">
                        {(teamA?.name ?? '') + ' vs ' + (teamB?.name ?? '')}
                      </CardTitle>
                      <ul className="space-y-1.5">
                        {match.sets.map((set, i) => {
                          const setWinnerSide =
                            set.teamAScore === set.teamBScore
                              ? null
                              : set.teamAScore > set.teamBScore
                                ? 'a'
                                : 'b';
                          return (
                            <li key={i}>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {t('volleyballTeamMaker.setLabel', {
                                    index: i + 1,
                                  })}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeSet(match.id, i)}
                                  aria-label={t(
                                    'volleyballTeamMaker.removeSet'
                                  )}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <ScoreTile
                                  label={teamAName}
                                  score={set.teamAScore}
                                  isWinner={setWinnerSide === 'a'}
                                  onIncrement={() =>
                                    updateSet(match.id, i, {
                                      teamAScore: set.teamAScore + 1,
                                    })
                                  }
                                  onDecrement={() =>
                                    updateSet(match.id, i, {
                                      teamAScore: Math.max(
                                        0,
                                        set.teamAScore - 1
                                      ),
                                    })
                                  }
                                  onChange={(n) =>
                                    updateSet(match.id, i, {
                                      teamAScore: n,
                                    })
                                  }
                                />
                                <ScoreTile
                                  label={teamBName}
                                  score={set.teamBScore}
                                  isWinner={setWinnerSide === 'b'}
                                  onIncrement={() =>
                                    updateSet(match.id, i, {
                                      teamBScore: set.teamBScore + 1,
                                    })
                                  }
                                  onDecrement={() =>
                                    updateSet(match.id, i, {
                                      teamBScore: Math.max(
                                        0,
                                        set.teamBScore - 1
                                      ),
                                    })
                                  }
                                  onChange={(n) =>
                                    updateSet(match.id, i, {
                                      teamBScore: n,
                                    })
                                  }
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="h-9 gap-2"
                          onClick={() => addSet(match.id)}
                        >
                          <Plus className="h-3 w-3" />
                          {t('volleyballTeamMaker.addSet')}
                        </Button>
                        {winner ? (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Trophy className="h-3.5 w-3.5 text-primary" />
                            {t('volleyballTeamMaker.matchWinner', {
                              team:
                                winner === 'a'
                                  ? (teamA?.name ?? '')
                                  : (teamB?.name ?? ''),
                            })}
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ───────── Share dialog ─────────

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareCode: string | null;
  working: boolean;
  onGenerate: () => void;
  onRevoke: () => void;
};

function ShareDialog({
  open,
  onOpenChange,
  shareCode,
  working,
  onGenerate,
  onRevoke,
}: ShareDialogProps) {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const shareUrl = shareCode
    ? `${window.location.origin}/tools/volleyball-team-maker/join/${shareCode}`
    : '';

  const copyCode = useCallback(async () => {
    if (!shareCode) return;
    try {
      await navigator.clipboard.writeText(shareCode);
      success(t('volleyballTeamMaker.share.codeCopied'));
    } catch {
      error(t('volleyballTeamMaker.share.errors.copyFailed'));
    }
  }, [shareCode, success, error, t]);

  const copyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      success(t('volleyballTeamMaker.share.linkCopied'));
    } catch {
      error(t('volleyballTeamMaker.share.errors.copyFailed'));
    }
  }, [shareUrl, success, error, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('volleyballTeamMaker.share.title')}</DialogTitle>
          <DialogDescription>
            {t('volleyballTeamMaker.share.description')}
          </DialogDescription>
        </DialogHeader>

        {shareCode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={shareUrl} size={180} level="M" />
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-3 py-2 text-2xl font-bold tracking-[0.3em]">
                  {shareCode}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => void copyCode()}
                  aria-label={t('volleyballTeamMaker.share.copyCode')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vtm-share-link">
                {t('volleyballTeamMaker.share.linkLabel')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="vtm-share-link"
                  readOnly
                  value={shareUrl}
                  className="h-10 text-xs"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 gap-2"
                  onClick={() => void copyLink()}
                >
                  <Copy className="h-4 w-4" />
                  {t('volleyballTeamMaker.share.copy')}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              {t('volleyballTeamMaker.share.hint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm">
              {t('volleyballTeamMaker.share.noCodeYet')}
            </p>
            <Button
              type="button"
              className="h-10 w-full gap-2"
              onClick={onGenerate}
              disabled={working}
            >
              <Share2 className="h-4 w-4" />
              {t('volleyballTeamMaker.share.generate')}
            </Button>
          </div>
        )}

        {shareCode ? (
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onRevoke}
              disabled={working}
            >
              {t('volleyballTeamMaker.share.revoke')}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ScoreTileProps = {
  label: string;
  score: number;
  isWinner: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (n: number) => void;
};

function ScoreTile({
  label,
  score,
  isWinner,
  onIncrement,
  onDecrement,
  onChange,
}: ScoreTileProps) {
  return (
    <div
      className={
        isWinner
          ? 'rounded-md border border-emerald-500/50 bg-emerald-500/10 p-2.5'
          : 'rounded-md border bg-muted/30 p-2.5'
      }
    >
      <p className="mb-1.5 truncate text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center justify-between gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onDecrement}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={score}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isNaN(n) ? 0 : Math.max(0, n));
          }}
          className={
            isWinner
              ? 'w-full min-w-0 border-0 bg-transparent text-center text-2xl font-bold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              : 'w-full min-w-0 border-0 bg-transparent text-center text-2xl font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          }
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={onIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
