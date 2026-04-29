import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Save, ArrowLeft, GripVertical, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { createMarathon, updateMarathon, getMarathon } from '@/services/marathonService';
import MovieSearchDialog from './components/MovieSearchDialog';
import ImportFromAIDialog from './components/ImportFromAIDialog';
import MovieCard from './components/MovieCard';
import type { MarathonMovie } from '@/types/marathon';
import { toast } from 'sonner';

export default function CreateEditMarathon() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [movies, setMovies] = useState<MarathonMovie[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing || !id) return;
    setLoading(true);
    getMarathon(id).then((m) => {
      if (!m) return navigate('/marathons');
      setTitle(m.title);
      setDescription(m.description);
      setIsPublic(m.visibility === 'public');
      setMovies(m.movies);
    }).finally(() => setLoading(false));
  }, [id, isEditing, navigate]);

  const handleAddMovie = (movie: MarathonMovie) => {
    setMovies((prev) => [...prev, { ...movie, order: prev.length }]);
  };

  const handleAIImport = (aiTitle: string, aiDescription: string, importedMovies: MarathonMovie[]) => {
    if (!title && aiTitle) setTitle(aiTitle);
    if (!description && aiDescription) setDescription(aiDescription);
    setMovies((prev) => {
      const existingIds = new Set(prev.map((m) => m.imdbId));
      const newMovies = importedMovies.filter((m) => !existingIds.has(m.imdbId));
      return [...prev, ...newMovies.map((m, i) => ({ ...m, order: prev.length + i }))];
    });
    toast.success(t('marathon.import.success', { count: importedMovies.length }));
  };

  const handleRemoveMovie = (index: number) => {
    setMovies((prev) => prev.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i })));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error(t('marathon.create.titleRequired'));
      return;
    }
    if (movies.length === 0) {
      toast.error(t('marathon.create.moviesRequired'));
      return;
    }

    setSaving(true);
    try {
      const coverPosterUrl = movies[0]?.posterUrl ?? null;
      if (isEditing && id) {
        await updateMarathon(id, { title, description, visibility: isPublic ? 'public' : 'private', movies, coverPosterUrl });
        toast.success(t('marathon.create.updated'));
      } else {
        await createMarathon(user.uid, { title, description, visibility: isPublic ? 'public' : 'private', movies, coverPosterUrl, tags: [] });
        toast.success(t('marathon.create.created'));
      }
      navigate('/marathons');
    } catch (err) {
      console.error('Marathon save error:', err);
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/marathons')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? t('marathon.create.editTitle') : t('marathon.create.newTitle')}
        </h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t('marathon.create.titleLabel')}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('marathon.create.titlePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t('marathon.create.descriptionLabel')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('marathon.create.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public">{t('marathon.create.publicLabel')}</Label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">{t('marathon.create.moviesLabel')} ({movies.length})</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Wand2 className="h-4 w-4 mr-1" />
              {t('marathon.import.button')}
            </Button>
            <Button size="sm" onClick={() => setSearchOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('marathon.create.addMovie')}
            </Button>
          </div>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            {t('marathon.create.noMovies')}
          </div>
        ) : (
          <div className="space-y-2">
            {movies.map((movie, index) => (
              <MovieCard
                key={movie.imdbId}
                movie={movie}
                index={index}
                mode="edit"
                onRemove={handleRemoveMovie}
                dragHandle={<GripVertical className="h-4 w-4" />}
              />
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <span className="animate-pulse">{t('common.saving')}</span>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? t('marathon.create.saveChanges') : t('marathon.create.createMarathon')}
          </>
        )}
      </Button>

      <MovieSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAddMovie}
        existingIds={movies.map((m) => m.imdbId)}
        nextOrder={movies.length}
      />

      <ImportFromAIDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleAIImport}
        existingCount={movies.length}
      />
    </div>
  );
}
