import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy, Film, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMarathon, updateMovieProgress } from '@/services/marathonService';
import MovieCard from './components/MovieCard';
import type { UserMarathon, MarathonMovieEntry } from '@/types/marathon';
import { toast } from 'sonner';

export default function MarathonView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  useAuth();

  const [marathon, setMarathon] = useState<UserMarathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    getUserMarathon(id).then((m) => {
      if (!m) navigate('/marathons');
      else setMarathon(m);
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleToggleWatched = (index: number) => {
    setMarathon((prev) => {
      if (!prev) return prev;
      const movies = prev.movies.map((m, i) =>
        i === index
          ? { ...m, watched: !m.watched, watchedAt: !m.watched ? new Date() : null }
          : m
      );
      return { ...prev, movies };
    });
    setDirty(true);
  };

  const handleNotesChange = (index: number, notes: string) => {
    setMarathon((prev) => {
      if (!prev) return prev;
      const movies = prev.movies.map((m, i) => (i === index ? { ...m, notes } : m));
      return { ...prev, movies };
    });
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (!marathon || !dirty) return;
    setSaving(true);
    try {
      await updateMovieProgress(marathon.id, marathon.movies);
      setDirty(false);
      const allWatched = marathon.movies.every((m) => m.watched);
      if (allWatched) toast.success(t('marathon.view.completed'));
      else toast.success(t('marathon.view.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }, [marathon, dirty, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!marathon) return null;

  const watched = marathon.movies.filter((m) => m.watched).length;
  const total = marathon.movies.length;
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0;
  const totalRuntime = marathon.movies.reduce((acc, m) => acc + (m.runtime ?? 0), 0);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/marathons')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1 truncate">{marathon.marathonTitle}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3 rounded-lg border bg-card text-center">
          <Film className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-2xl font-bold">{watched}/{total}</span>
          <span className="text-xs text-muted-foreground">{t('marathon.view.watched')}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg border bg-card text-center">
          <Trophy className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-2xl font-bold">{progress}%</span>
          <span className="text-xs text-muted-foreground">{t('marathon.view.progress')}</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg border bg-card text-center">
          <Clock className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-2xl font-bold">{Math.round(totalRuntime / 60)}h</span>
          <span className="text-xs text-muted-foreground">{t('marathon.view.totalRuntime')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {marathon.completedAt && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Trophy className="h-5 w-5" />
          <span className="font-medium">{t('marathon.view.completedBadge')}</span>
        </div>
      )}

      {/* Movie list */}
      <div className="space-y-2">
        {marathon.movies.map((movie, index) => (
          <MovieCard
            key={movie.imdbId}
            movie={movie}
            index={index}
            mode="track"
            onToggleWatched={handleToggleWatched}
            onNotesChange={handleNotesChange}
          />
        ))}
      </div>

      {dirty && (
        <Button onClick={handleSave} disabled={saving} className="w-full sticky bottom-4 shadow-lg">
          {saving ? <span className="animate-pulse">{t('common.saving')}</span> : t('marathon.view.saveProgress')}
        </Button>
      )}
    </div>
  );
}
