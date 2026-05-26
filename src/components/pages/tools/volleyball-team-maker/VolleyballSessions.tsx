import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  Volleyball,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  listSessions,
  createSession,
  deleteSession,
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '@/services/volleyballService';
import {
  VOLLEYBALL_LEVELS,
  VOLLEYBALL_POSITIONS,
  type VolleyballLevel,
  type VolleyballPlayer,
  type VolleyballPosition,
  type VolleyballSession,
} from '@/types/volleyball';
import { computeStats, playerMatchHistory } from '@/lib/volleyball';

const DEFAULT_LEVEL: VolleyballLevel = 'B';
const DEFAULT_POSITION: VolleyballPosition = 'outside';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function VolleyballSessions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [sessions, setSessions] = useState<VolleyballSession[]>([]);
  const [players, setPlayers] = useState<VolleyballPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] =
    useState<VolleyballPosition>(DEFAULT_POSITION);
  const [newLevel, setNewLevel] = useState<VolleyballLevel>(DEFAULT_LEVEL);

  const positionLabel = useCallback(
    (pos: VolleyballPosition) => t(`volleyballTeamMaker.positions.${pos}`),
    [t]
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([listSessions(user.uid), listPlayers(user.uid)])
      .then(([s, p]) => {
        if (cancelled) return;
        setSessions(s);
        setPlayers(p);
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
    // `error` and `t` are intentionally excluded — they're recreated each render
    // and would cause an infinite re-fetch loop. We only want to reload on user change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNewSession = useCallback(async () => {
    if (!user) return;
    try {
      const session = await createSession(user.uid, {
        name: '',
        date: new Date().toISOString().slice(0, 10),
      });
      navigate(`/tools/volleyball-team-maker/sessions/${session.id}`);
    } catch (e) {
      console.error(e);
      error(t('volleyballTeamMaker.errors.createFailed'));
    }
  }, [user, navigate, error, t]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        await deleteSession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        success(t('volleyballTeamMaker.sessionDeleted'));
      } catch (e) {
        console.error(e);
        error(t('volleyballTeamMaker.errors.deleteFailed'));
      }
    },
    [success, error, t]
  );

  const handleAddPlayer = useCallback(async () => {
    if (!user) return;
    const name = newName.trim();
    if (!name) {
      error(t('volleyballTeamMaker.errors.nameRequired'));
      return;
    }
    try {
      const player = await createPlayer(user.uid, {
        name,
        position: newPosition,
        level: newLevel,
      });
      setPlayers((prev) =>
        [...prev, player].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewName('');
      setNewPosition(DEFAULT_POSITION);
      setNewLevel(DEFAULT_LEVEL);
    } catch (e) {
      console.error(e);
      error(t('volleyballTeamMaker.errors.createFailed'));
    }
  }, [user, newName, newPosition, newLevel, error, t]);

  const handleUpdatePlayer = useCallback(
    async (
      id: string,
      patch: Partial<{
        name: string;
        position: VolleyballPosition;
        level: VolleyballLevel;
      }>
    ) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
      try {
        await updatePlayer(id, patch);
      } catch (e) {
        console.error(e);
        error(t('volleyballTeamMaker.errors.saveFailed'));
      }
    },
    [error, t]
  );

  const handleDeletePlayer = useCallback(
    async (id: string) => {
      try {
        await deletePlayer(id);
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        success(t('volleyballTeamMaker.playerDeleted'));
      } catch (e) {
        console.error(e);
        error(t('volleyballTeamMaker.errors.deleteFailed'));
      }
    },
    [success, error, t]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 lg:max-w-5xl">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('volleyballTeamMaker.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 not-first:mt-6">
          {t('volleyballTeamMaker.description')}
        </p>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid h-10 w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="sessions" className="px-4">
            {t('volleyballTeamMaker.tabs.sessions')}
          </TabsTrigger>
          <TabsTrigger value="roster" className="px-4">
            {t('volleyballTeamMaker.tabs.roster')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-4">
            {t('volleyballTeamMaker.tabs.stats')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              className="h-10 gap-2"
              onClick={() => void handleNewSession()}
            >
              <Plus className="h-4 w-4" />
              {t('volleyballTeamMaker.newSession')}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
              <Volleyball className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm">{t('volleyballTeamMaker.noSessions')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const matchesWithWinner = s.matches.length;
                return (
                  <Card
                    key={s.id}
                    className="cursor-pointer p-4 transition-colors hover:bg-accent/30"
                    onClick={() =>
                      navigate(`/tools/volleyball-team-maker/sessions/${s.id}`)
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold leading-tight">
                          {s.name || t('volleyballTeamMaker.untitledSession')}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(s.date)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {t('volleyballTeamMaker.playerCount', {
                              count: s.players.length,
                            })}
                          </Badge>
                          <Badge variant="outline">
                            {t('volleyballTeamMaker.teamCountBadge', {
                              count: s.teams.length,
                            })}
                          </Badge>
                          {matchesWithWinner > 0 ? (
                            <Badge variant="outline">
                              {t('volleyballTeamMaker.matchCount', {
                                count: matchesWithWinner,
                              })}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteSession(s.id);
                        }}
                        aria-label={t('volleyballTeamMaker.deleteSession')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {t('volleyballTeamMaker.addPlayer')}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <div className="space-y-2">
                  <Label htmlFor="vtm-roster-name">
                    {t('volleyballTeamMaker.playerName')}
                  </Label>
                  <Input
                    id="vtm-roster-name"
                    className="h-10"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddPlayer();
                      }
                    }}
                    placeholder={t('volleyballTeamMaker.playerNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2 sm:w-44">
                  <Label htmlFor="vtm-roster-position">
                    {t('volleyballTeamMaker.position')}
                  </Label>
                  <Select
                    value={newPosition}
                    onValueChange={(v) =>
                      setNewPosition(v as VolleyballPosition)
                    }
                  >
                    <SelectTrigger
                      className="h-10 w-full"
                      id="vtm-roster-position"
                    >
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
                </div>
                <div className="space-y-2 sm:w-24">
                  <Label htmlFor="vtm-roster-level">
                    {t('volleyballTeamMaker.skill')}
                  </Label>
                  <Select
                    value={newLevel}
                    onValueChange={(v) => setNewLevel(v as VolleyballLevel)}
                  >
                    <SelectTrigger
                      className="h-10 w-full"
                      id="vtm-roster-level"
                    >
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
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-10 w-full gap-2 sm:w-auto"
                    onClick={() => void handleAddPlayer()}
                  >
                    <Plus className="h-4 w-4" />
                    {t('volleyballTeamMaker.add')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {t('volleyballTeamMaker.players')}
              </h3>
              <Badge variant="secondary">
                {t('volleyballTeamMaker.playerCount', {
                  count: players.length,
                })}
              </Badge>
            </div>

            {loading ? null : players.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t('volleyballTeamMaker.noPlayers')}
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {players.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap"
                  >
                    <Input
                      className="h-10 min-w-0 flex-1"
                      value={p.name}
                      onChange={(e) =>
                        setPlayers((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      onBlur={(e) =>
                        void handleUpdatePlayer(p.id, { name: e.target.value })
                      }
                    />
                    <Select
                      value={p.position}
                      onValueChange={(v) =>
                        void handleUpdatePlayer(p.id, {
                          position: v as VolleyballPosition,
                        })
                      }
                    >
                      <SelectTrigger className="h-10 w-44 shrink-0">
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
                        void handleUpdatePlayer(p.id, {
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => void handleDeletePlayer(p.id)}
                      aria-label={t('volleyballTeamMaker.removePlayer', {
                        name: p.name,
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <StatsTabContent
            sessions={sessions}
            roster={players}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type StatsTabProps = {
  sessions: VolleyballSession[];
  roster: VolleyballPlayer[];
  loading: boolean;
};

function StatsTabContent({ sessions, roster, loading }: StatsTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(sessions), [sessions]);

  const rows = useMemo(() => {
    return roster
      .map((p) => ({
        player: p,
        stats: stats.get(p.id),
      }))
      .filter((r) => r.stats && r.stats.matchesPlayed > 0)
      .sort((a, b) => {
        const aw = a.stats!.matchesWon;
        const bw = b.stats!.matchesWon;
        if (aw !== bw) return bw - aw;
        return a.player.name.localeCompare(b.player.name);
      });
  }, [roster, stats]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        <TrendingUp className="mx-auto mb-3 h-10 w-10 opacity-40" />
        <p className="text-sm">{t('volleyballTeamMaker.noStatsYet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ player, stats: s }) => {
        const isOpen = expandedId === player.id;
        return (
          <Card key={player.id} className="p-0">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-accent/30"
              onClick={() => setExpandedId(isOpen ? null : player.id)}
              aria-expanded={isOpen}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold leading-tight">
                  {player.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {t('volleyballTeamMaker.stats.matches', {
                      won: s!.matchesWon,
                      lost: s!.matchesLost,
                    })}
                  </Badge>
                  <Badge variant="outline">
                    {t('volleyballTeamMaker.stats.sets', {
                      won: s!.setsWon,
                      lost: s!.setsLost,
                    })}
                  </Badge>
                  <Badge variant="outline">
                    {t('volleyballTeamMaker.stats.sessions', {
                      count: s!.sessions,
                    })}
                  </Badge>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {isOpen ? (
              <PlayerHistory player={player} sessions={sessions} />
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function PlayerHistory({
  player,
  sessions,
}: {
  player: VolleyballPlayer;
  sessions: VolleyballSession[];
}) {
  const { t } = useTranslation();
  const history = useMemo(
    () => playerMatchHistory(player.id, sessions),
    [player.id, sessions]
  );

  if (history.length === 0) {
    return (
      <p className="px-3 pb-3 text-sm text-muted-foreground">
        {t('volleyballTeamMaker.stats.noMatches')}
      </p>
    );
  }

  return (
    <ul className="divide-y border-t">
      {history.map((h) => (
        <li
          key={`${h.sessionId}:${h.matchId}`}
          className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground tabular-nums">
            {formatDate(h.sessionDate)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {h.sessionName || t('volleyballTeamMaker.untitledSession')}
            <span className="text-muted-foreground">
              {' · '}
              {h.teamName} vs {h.opponentName}
            </span>
          </span>
          <span
            className={
              h.outcome === 'won'
                ? 'shrink-0 font-semibold text-emerald-600 dark:text-emerald-400'
                : h.outcome === 'lost'
                  ? 'shrink-0 font-semibold text-destructive'
                  : 'shrink-0 text-muted-foreground'
            }
          >
            {h.setsWon} – {h.setsLost}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {h.sets.map((s) => `${s.mine}-${s.theirs}`).join(', ')}
          </span>
        </li>
      ))}
    </ul>
  );
}
