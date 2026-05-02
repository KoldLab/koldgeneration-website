import { useState, useCallback } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchMovies, omdbDetailToMarathonMovie } from '@/services/omdbService';
import type { MarathonMovie, OMDBSearchMovie } from '@/types/marathon';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (movie: MarathonMovie) => void;
  existingIds: string[];
  nextOrder: number;
};

export default function MovieSearchDialog({ open, onClose, onAdd, existingIds, nextOrder }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OMDBSearchMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(query.trim());
      setResults(data.Search ?? []);
    } catch {
      setError(t('marathon.search.error'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAdd = async (movie: OMDBSearchMovie) => {
    setAdding(movie.imdbID);
    try {
      const marathonMovie = await omdbDetailToMarathonMovie(movie.imdbID, nextOrder);
      onAdd(marathonMovie);
    } catch {
      // fallback: use search result data (no plot/runtime/genres)
      onAdd({
        imdbId: movie.imdbID,
        title: movie.Title,
        posterUrl: movie.Poster !== 'N/A' ? movie.Poster : null,
        releaseYear: parseInt(movie.Year, 10) || null,
        overview: '',
        runtime: null,
        genres: [],
        order: nextOrder,
      });
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85dvh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{t('marathon.search.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder={t('marathon.search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {results.map((movie) => {
            const already = existingIds.includes(movie.imdbID);
            const isAdding = adding === movie.imdbID;
            const poster = movie.Poster !== 'N/A' ? movie.Poster : null;
            return (
              <div
                key={movie.imdbID}
                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {poster ? (
                  <img src={poster} alt={movie.Title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-14 bg-muted rounded flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movie.Title}</p>
                  <p className="text-sm text-muted-foreground">{movie.Year}</p>
                </div>
                <Button
                  size="sm"
                  variant={already ? 'outline' : 'default'}
                  disabled={already || isAdding}
                  onClick={() => handleAdd(movie)}
                  className="flex-shrink-0"
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
          {results.length === 0 && !loading && query && (
            <p className="text-center text-muted-foreground py-8">{t('marathon.search.noResults')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
