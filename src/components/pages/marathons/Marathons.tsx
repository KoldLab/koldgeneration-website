import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Play, Pencil, Trash2, Film, Trophy, Search, List, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPublicMarathons,
  getUserCreatedMarathons,
  getUserMarathons,
  startMarathon,
  deleteMarathon,
  deleteUserMarathon,
} from '@/services/marathonService';
import type { Marathon, UserMarathon } from '@/types/marathon';
import { toast } from 'sonner';

type Section = 'browse' | 'my-marathons' | 'created';

// ─── Nav item ────────────────────────────────────────────────────────────────

function NavItem({ active, onClick, icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className={`text-xs tabular-nums ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Marathon template card ───────────────────────────────────────────────────

function MarathonTemplateCard({ marathon, onStart, onEdit, onDelete, isOwner }: {
  marathon: Marathon;
  onStart: (m: Marathon) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/20 xs:flex-row xs:items-start">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {marathon.coverPosterUrl ? (
          <img src={marathon.coverPosterUrl} alt={marathon.title} className="w-12 h-16 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-12 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <Film className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="min-w-0 text-base font-semibold leading-tight break-words sm:text-lg">
              {marathon.title}
            </p>
            {marathon.visibility === 'private' && (
              <Badge variant="outline" className="text-xs">Private</Badge>
            )}
          </div>
          {marathon.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground break-words">{marathon.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{marathon.movies.length} movies</p>
        </div>
      </div>
      <div className="flex w-full gap-1 sm:w-auto xs:w-auto flex-shrink-0 xs:self-auto xs:flex-col">
        <Button size="sm" onClick={() => onStart(marathon)}>
          <Play className="h-3 w-3 mr-1" /> Start
        </Button>
        {isOwner && (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit(marathon.id)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(marathon.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── User marathon card ───────────────────────────────────────────────────────

function UserMarathonCard({ marathon, onContinue, onDelete }: {
  marathon: UserMarathon;
  onContinue: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const watched = marathon.movies.filter((m) => m.watched).length;
  const total = marathon.movies.length;
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div className="p-3 rounded-lg border bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold break-words leading-tight">{marathon.marathonTitle}</p>
            {marathon.completedAt && <Trophy className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">{watched}/{total} watched · {progress}%</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button size="sm" onClick={() => onContinue(marathon.id)}>
            {marathon.completedAt ? 'Review' : 'Continue'}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(marathon.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Marathons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const initialSection = (searchParams.get('s') as Section) ?? 'browse';
  const [section, setSection] = useState<Section>(initialSection);
  // Auto-jump to "My Marathons" on first load if the user has active runs and
  // no explicit section was requested via URL.
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [publicMarathons, setPublicMarathons] = useState<Marathon[]>([]);
  const [myCreated, setMyCreated] = useState<Marathon[]>([]);
  const [myActive, setMyActive] = useState<UserMarathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [pub, active] = await Promise.all([
          getPublicMarathons(),
          user ? getUserMarathons(user.uid) : Promise.resolve([]),
        ]);
        setPublicMarathons(pub);
        setMyActive(active);
        if (user) {
          const created = await getUserCreatedMarathons(user.uid);
          setMyCreated(created);
        }
        if (
          !autoSwitched &&
          !searchParams.get('s') &&
          active.length > 0 &&
          section === 'browse'
        ) {
          setSection('my-marathons');
          setAutoSwitched(true);
        }
      } catch (err: any) {
        console.error(err);
        if (err?.message?.includes('index') && err?.message?.includes('building')) {
          setLoadError(t('marathon.indexBuilding'));
        } else {
          setLoadError(t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, t]);

  const filteredPublic = useMemo(
    () => search.trim()
      ? publicMarathons.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
      : publicMarathons,
    [publicMarathons, search]
  );

  const handleStart = async (marathon: Marathon) => {
    if (!user) { toast.error(t('marathon.loginRequired')); return; }
    // If the user already has an in-progress run for this template, resume it
    // instead of creating a duplicate user_marathon.
    const existing = myActive.find((um) => um.marathonId === marathon.id);
    if (existing) {
      navigate(`/marathons/track/${existing.id}`);
      return;
    }
    try {
      const um = await startMarathon(user.uid, marathon);
      setMyActive((p) => [um, ...p]);
      navigate(`/marathons/track/${um.id}`);
    } catch { toast.error(t('common.error')); }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteMarathon(id);
      setMyCreated((p) => p.filter((m) => m.id !== id));
      setPublicMarathons((p) => p.filter((m) => m.id !== id));
      toast.success(t('marathon.deleted'));
    } catch { toast.error(t('common.error')); }
  };

  const handleDeleteUserMarathon = async (id: string) => {
    try {
      await deleteUserMarathon(id);
      setMyActive((p) => p.filter((m) => m.id !== id));
      toast.success(t('marathon.deleted'));
    } catch { toast.error(t('common.error')); }
  };

  const navItems = [
    { id: 'browse' as Section, icon: <BookOpen className="h-4 w-4" />, label: 'Browse', count: publicMarathons.length },
    { id: 'my-marathons' as Section, icon: <List className="h-4 w-4" />, label: 'My Marathons', count: myActive.length, authRequired: true },
    { id: 'created' as Section, icon: <Users className="h-4 w-4" />, label: 'Created by Me', count: myCreated.length, authRequired: true },
  ];

  const emptyState = (icon: React.ReactNode, text: string, action?: React.ReactNode) => (
    <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
      <div className="flex justify-center mb-3 opacity-40">{icon}</div>
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );

  return (
    <div className="container max-w-5xl mx-auto px-2 py-3 sm:px-4 sm:py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Marathons</h1>
        <Button onClick={() => navigate('/marathons/create')} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {t('marathon.new')}
        </Button>
      </div>

      {/* Mobile nav — full-width, sits above the flex row */}
      <div className="sm:hidden mb-4 -mx-2 px-2">
        <div className="flex gap-2 overflow-x-auto px-0.5 pb-1 scrollbar-hide">
          {navItems.map((item) => {
            if (item.authRequired && !user) return null;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                  section === item.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
                {item.count !== undefined && (
                  <span className={`text-xs tabular-nums ${
                    section === item.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Side nav — desktop */}
        <aside className="hidden sm:flex flex-col w-48 shrink-0 space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Marathons
          </p>
          {navItems.map((item) => {
            if (item.authRequired && !user) return null;
            return (
              <NavItem
                key={item.id}
                active={section === item.id}
                onClick={() => setSection(item.id)}
                icon={item.icon}
                label={item.label}
                count={item.count}
              />
            );
          })}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Browse */}
          {section === 'browse' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search marathons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loadError && (
                <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-sm">
                  {loadError}
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredPublic.length === 0 ? (
                emptyState(
                  <Film className="h-10 w-10" />,
                  search ? 'No marathons match your search.' : 'No public marathons yet.',
                  !search && (
                    <Button variant="link" onClick={() => navigate('/marathons/create')}>
                      Create the first one
                    </Button>
                  )
                )
              ) : (
                <div className="space-y-2">
                  {filteredPublic.map((m) => (
                    <MarathonTemplateCard
                      key={m.id}
                      marathon={m}
                      onStart={handleStart}
                      onEdit={(id) => navigate(`/marathons/edit/${id}`)}
                      onDelete={handleDeleteTemplate}
                      isOwner={m.createdBy === user?.uid}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* My Marathons */}
          {section === 'my-marathons' && (
            loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : myActive.length === 0
              ? emptyState(<Trophy className="h-10 w-10" />, "You haven't started any marathon yet.")
              : (
                <div className="space-y-2">
                  {myActive.map((m) => (
                    <UserMarathonCard
                      key={m.id}
                      marathon={m}
                      onContinue={(id) => navigate(`/marathons/track/${id}`)}
                      onDelete={handleDeleteUserMarathon}
                    />
                  ))}
                </div>
              )
          )}

          {/* Created by Me */}
          {section === 'created' && (
            loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : myCreated.length === 0
              ? emptyState(
                  <Film className="h-10 w-10" />,
                  "You haven't created any marathon yet.",
                  <Button variant="link" onClick={() => navigate('/marathons/create')}>Create one</Button>
                )
              : (
                <div className="space-y-2">
                  {myCreated.map((m) => (
                    <MarathonTemplateCard
                      key={m.id}
                      marathon={m}
                      onStart={handleStart}
                      onEdit={(id) => navigate(`/marathons/edit/${id}`)}
                      onDelete={handleDeleteTemplate}
                      isOwner
                    />
                  ))}
                </div>
              )
          )}
        </main>
      </div>
    </div>
  );
}
