import { useState, useCallback, useEffect } from 'react';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchMovies, tmdbDetailToMarathonMovie } from '@/services/tmdbService';
import type { MarathonMovie, TMDBSearchMovie } from '@/types/marathon';

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
  const [results, setResults] = useState<TMDBSearchMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(searchQuery.trim(), pageNum);
      setResults(data.results ?? []);
      setTotalResults(data.total_results ?? 0);
      setPage(pageNum);
    } catch {
      setError(t('marathon.search.error'));
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleAdd = async (movie: TMDBSearchMovie) => {
    const movieId = `tmdb:${movie.id}`;
    setAdding(movieId);
    try {
      const marathonMovie = await tmdbDetailToMarathonMovie(movieId, nextOrder);
      onAdd(marathonMovie);
    } catch {
      // fallback: use search result data (no plot/runtime/genres)
      onAdd({
        imdbId: movieId,
        title: movie.title,
        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        releaseYear: parseInt(movie.release_date.slice(0, 4), 10) || null,
        overview: movie.overview,
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('marathon.search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="overflow-y-auto flex-1 pr-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="divide-y divide-border">
            {results.map((movie) => {
              const movieId = `tmdb:${movie.id}`;
              const already = existingIds.includes(movieId);
              const isAdding = adding === movieId;
              const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
              return (
                <div
                  key={movieId}
                  className="flex items-center gap-3 py-3"
                >
                  {poster ? (
                    <img src={poster} alt={movie.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                      <Search className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{movie.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{movie.release_date.slice(0, 4)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={already ? 'secondary' : 'ghost'}
                    disabled={already || isAdding}
                    onClick={() => handleAdd(movie)}
                    className={`flex-shrink-0 h-8 w-8 p-0 ${!already && 'hover:bg-primary/10 hover:text-primary'}`}
                  >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              );
            })}
          </div>
          {results.length === 0 && !loading && query && (
            <p className="text-center text-muted-foreground py-8">{t('marathon.search.noResults')}</p>
          )}
        </div>

        {totalResults > 20 && (
          <div className="flex items-center justify-between pt-4 border-t mt-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => handleSearch(query, page - 1)}
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t('common.previous')}</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              {t('marathon.search.pageOf', { page, total: Math.ceil(totalResults / 20) })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(totalResults / 20) || loading}
              onClick={() => handleSearch(query, page + 1)}
            >
              <span className="hidden sm:inline">{t('common.next')}</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
