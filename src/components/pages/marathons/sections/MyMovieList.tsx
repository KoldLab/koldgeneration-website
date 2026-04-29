import { useState, useEffect } from 'react';
import { Eye, Bookmark, Trash2, Film, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserMovies, removeUserMovie, updateUserMovieStatus } from '@/services/userMovieService';
import MovieDetailDialog from '../components/MovieDetailDialog';
import type { UserMovie } from '@/types/userMovie';
import { toast } from 'sonner';

function MovieRow({ movie, onSelect, onRemove, onStatusChange }: {
  movie: UserMovie;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onStatusChange: (id: string, status: 'watched' | 'want_to_watch') => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/20 transition-colors">
      <button onClick={() => onSelect(movie.imdbId)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-10 h-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{movie.title}</p>
          <p className="text-xs text-muted-foreground">
            {movie.releaseYear ?? '—'}
            {movie.runtime ? ` · ${movie.runtime} min` : ''}
          </p>
          {movie.genres.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">{movie.genres.join(', ')}</p>
          )}
        </div>
      </button>
      <div className="flex items-center gap-1 flex-shrink-0">
        {movie.status === 'want_to_watch' ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Mark as watched" onClick={() => onStatusChange(movie.imdbId, 'watched')}>
            <Eye className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Move to watchlist" onClick={() => onStatusChange(movie.imdbId, 'want_to_watch')}>
            <Bookmark className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemove(movie.imdbId)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function MyMovieList() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserMovies(user.uid)
      .then(setMovies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (imdbId: string) => {
    if (!user) return;
    try {
      await removeUserMovie(user.uid, imdbId);
      setMovies((prev) => prev.filter((m) => m.imdbId !== imdbId));
      toast.success('Removed');
    } catch { toast.error('Error'); }
  };

  const handleStatusChange = async (imdbId: string, status: 'watched' | 'want_to_watch') => {
    if (!user) return;
    try {
      await updateUserMovieStatus(user.uid, imdbId, status);
      setMovies((prev) => prev.map((m) => m.imdbId === imdbId ? { ...m, status } : m));
    } catch { toast.error('Error'); }
  };

  if (!user) return <p className="text-center text-muted-foreground py-16">You must be logged in.</p>;

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  const watched = movies.filter((m) => m.status === 'watched');
  const watchlist = movies.filter((m) => m.status === 'want_to_watch');

  const empty = (label: string) => (
    <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
      <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );

  return (
    <>
      <Tabs defaultValue="watchlist">
        <TabsList className="w-full">
          <TabsTrigger value="watchlist" className="flex-1 gap-2">
            <Bookmark className="h-4 w-4" /> Watchlist ({watchlist.length})
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex-1 gap-2">
            <Eye className="h-4 w-4" /> Watched ({watched.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-2 mt-4">
          {watchlist.length === 0
            ? empty('Your watchlist is empty. Search for movies and add them.')
            : watchlist.map((m) => (
                <MovieRow key={m.imdbId} movie={m} onSelect={setSelectedId} onRemove={handleRemove} onStatusChange={handleStatusChange} />
              ))}
        </TabsContent>

        <TabsContent value="watched" className="space-y-2 mt-4">
          {watched.length === 0
            ? empty('No watched movies yet.')
            : watched.map((m) => (
                <MovieRow key={m.imdbId} movie={m} onSelect={setSelectedId} onRemove={handleRemove} onStatusChange={handleStatusChange} />
              ))}
        </TabsContent>
      </Tabs>

      <MovieDetailDialog imdbId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
