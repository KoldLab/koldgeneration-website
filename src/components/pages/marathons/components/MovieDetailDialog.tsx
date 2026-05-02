import { useState, useEffect } from 'react';
import { Eye, Bookmark, Trash2, Loader2, Clock, Calendar, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMovieDetails } from '@/services/omdbService';
import { addUserMovie, updateUserMovieStatus, removeUserMovie, getUserMovie } from '@/services/userMovieService';
import { useAuth } from '@/contexts/AuthContext';
import type { OMDBMovieDetail } from '@/types/marathon';
import type { UserMovie } from '@/types/userMovie';
import { toast } from 'sonner';

type Props = {
  imdbId: string | null;
  onClose: () => void;
};

function parsePoster(p: string) { return p && p !== 'N/A' ? p : null; }
function parseRuntime(r: string) { const m = r?.match(/(\d+)/); return m ? parseInt(m[1]) : null; }
function parseYear(y: string) { const n = parseInt(y); return isNaN(n) ? null : n; }

export default function MovieDetailDialog({ imdbId, onClose }: Props) {
  const { user } = useAuth();
  const [movie, setMovie] = useState<OMDBMovieDetail | null>(null);
  const [userMovie, setUserMovie] = useState<UserMovie | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!imdbId) return;
    setLoading(true);
    setMovie(null);
    setUserMovie(null);

    const fetchAll = async () => {
      const [detail, um] = await Promise.all([
        getMovieDetails(imdbId),
        user ? getUserMovie(user.uid, imdbId) : Promise.resolve(null),
      ]);
      setMovie(detail);
      setUserMovie(um);
    };

    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [imdbId, user]);

  const handleAdd = async (status: 'watched' | 'want_to_watch') => {
    if (!user || !movie) return;
    setActing(true);
    try {
      await addUserMovie(user.uid, {
        imdbId: movie.imdbID,
        title: movie.Title,
        posterUrl: parsePoster(movie.Poster),
        releaseYear: parseYear(movie.Year),
        runtime: parseRuntime(movie.Runtime),
        genres: movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [],
        overview: movie.Plot !== 'N/A' ? movie.Plot : '',
        status,
      }, status);
      setUserMovie({ id: '', userId: user.uid, imdbId: movie.imdbID, title: movie.Title,
        posterUrl: parsePoster(movie.Poster), releaseYear: parseYear(movie.Year),
        runtime: parseRuntime(movie.Runtime), genres: movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [],
        overview: movie.Plot !== 'N/A' ? movie.Plot : '', status, addedAt: new Date(), watchedAt: status === 'watched' ? new Date() : null,
      });
      toast.success(status === 'watched' ? 'Added to watched list' : 'Added to watchlist');
    } catch (err) { console.error(err); toast.error('Error'); }
    finally { setActing(false); }
  };

  const handleChangeStatus = async (status: 'watched' | 'want_to_watch') => {
    if (!user || !movie) return;
    setActing(true);
    try {
      await updateUserMovieStatus(user.uid, movie.imdbID, status);
      setUserMovie((prev) => prev ? { ...prev, status } : prev);
      toast.success('Updated');
    } catch { toast.error('Error'); }
    finally { setActing(false); }
  };

  const handleRemove = async () => {
    if (!user || !movie) return;
    setActing(true);
    try {
      await removeUserMovie(user.uid, movie.imdbID);
      setUserMovie(null);
      toast.success('Removed from list');
    } catch { toast.error('Error'); }
    finally { setActing(false); }
  };

  const poster = movie ? parsePoster(movie.Poster) : null;
  const runtime = movie ? parseRuntime(movie.Runtime) : null;
  const year = movie ? parseYear(movie.Year) : null;
  const genres = movie?.Genre !== 'N/A' ? movie?.Genre.split(', ') : [];

  return (
    <Dialog open={!!imdbId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && movie && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl pr-8">{movie.Title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              {/* Poster */}
              {poster ? (
                <img src={poster} alt={movie.Title} className="w-full sm:w-32 max-h-48 sm:max-h-none sm:h-48 object-cover rounded-lg flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-full sm:w-32 h-40 sm:h-48 bg-muted rounded-lg flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {year && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{year}</span>}
                  {runtime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{runtime} min</span>}
                  {movie.Rated && movie.Rated !== 'N/A' && <Badge variant="outline" className="text-xs">{movie.Rated}</Badge>}
                  {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                    <span className="flex items-center gap-1 font-medium text-foreground">⭐ {movie.imdbRating}/10</span>
                  )}
                </div>

                {genres && genres.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {genres.map((g) => (
                      <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                    ))}
                  </div>
                )}

                {movie.Plot && movie.Plot !== 'N/A' && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{movie.Plot}</p>
                )}

                {movie.Director && movie.Director !== 'N/A' && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Director:</span> {movie.Director}</p>
                )}

                {movie.Actors && movie.Actors !== 'N/A' && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Cast:</span> {movie.Actors}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {user && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!userMovie ? (
                  <>
                    <Button onClick={() => handleAdd('watched')} disabled={acting} className="gap-2 flex-1 sm:flex-none">
                      <Eye className="h-4 w-4" /> Mark as Watched
                    </Button>
                    <Button variant="outline" onClick={() => handleAdd('want_to_watch')} disabled={acting} className="gap-2 flex-1 sm:flex-none">
                      <Bookmark className="h-4 w-4" /> Add to Watchlist
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge className={`px-3 py-1.5 text-sm ${userMovie.status === 'watched' ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'}`}>
                      {userMovie.status === 'watched' ? '✓ Watched' : '⊕ Watchlist'}
                    </Badge>
                    {userMovie.status === 'want_to_watch' && (
                      <Button size="sm" onClick={() => handleChangeStatus('watched')} disabled={acting} className="gap-2">
                        <Eye className="h-3.5 w-3.5" /> Mark as Watched
                      </Button>
                    )}
                    {userMovie.status === 'watched' && (
                      <Button size="sm" variant="outline" onClick={() => handleChangeStatus('want_to_watch')} disabled={acting} className="gap-2">
                        <Bookmark className="h-3.5 w-3.5" /> Move to Watchlist
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-2 ml-auto" onClick={handleRemove} disabled={acting}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
