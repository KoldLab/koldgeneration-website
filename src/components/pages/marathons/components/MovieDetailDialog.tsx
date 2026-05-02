import { useState, useEffect } from 'react';
import { Eye, Bookmark, Trash2, Loader2, Clock, Calendar, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMovieDetails } from '@/services/tmdbService';
import { addUserMovie, updateUserMovieStatus, removeUserMovie, getUserMovie } from '@/services/userMovieService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import type { TMDBMovieDetail } from '@/types/marathon';
import type { UserMovie } from '@/types/userMovie';

type Props = {
  imdbId: string | null;
  onClose: () => void;
};

function parsePoster(path: string | null) { return path ? `https://image.tmdb.org/t/p/w500${path}` : null; }
function parseYear(date: string) { const n = parseInt(date.slice(0, 4), 10); return isNaN(n) ? null : n; }

export default function MovieDetailDialog({ imdbId, onClose }: Props) {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { user } = useAuth();
  const [movie, setMovie] = useState<TMDBMovieDetail | null>(null);
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
    const movieId = userMovie?.imdbId ?? `tmdb:${movie.id}`;
    setActing(true);
    try {
      await addUserMovie(user.uid, {
        imdbId: movieId,
        title: movie.title,
        posterUrl: parsePoster(movie.poster_path),
        releaseYear: parseYear(movie.release_date),
        runtime: movie.runtime,
        genres: movie.genres.map((genre) => genre.name),
        overview: movie.overview,
        status,
      }, status);
      setUserMovie({ id: '', userId: user.uid, imdbId: movieId, title: movie.title,
        posterUrl: parsePoster(movie.poster_path), releaseYear: parseYear(movie.release_date),
        runtime: movie.runtime, genres: movie.genres.map((genre) => genre.name),
        overview: movie.overview, status, addedAt: new Date(), watchedAt: status === 'watched' ? new Date() : null,
      });
      success(status === 'watched' ? t('marathon.movie.addedWatched') : t('marathon.movie.addedWatchlist'));
    } catch (err) { console.error(err); error(t('common.error')); }
    finally { setActing(false); }
  };

  const handleChangeStatus = async (status: 'watched' | 'want_to_watch') => {
    if (!user || !movie) return;
    const movieId = userMovie?.imdbId ?? `tmdb:${movie.id}`;
    setActing(true);
    try {
      await updateUserMovieStatus(user.uid, movieId, status);
      setUserMovie((prev) => prev ? { ...prev, status } : prev);
      success(t('marathon.movie.updated'));
    } catch { error(t('common.error')); }
    finally { setActing(false); }
  };

  const handleRemove = async () => {
    if (!user || !movie) return;
    const movieId = userMovie?.imdbId ?? `tmdb:${movie.id}`;
    setActing(true);
    try {
      await removeUserMovie(user.uid, movieId);
      setUserMovie(null);
      success(t('marathon.movie.removed'));
    } catch { error(t('common.error')); }
    finally { setActing(false); }
  };

  const poster = movie ? parsePoster(movie.poster_path) : null;
  const year = movie ? parseYear(movie.release_date) : null;
  const genres = movie?.genres.map((genre) => genre.name) ?? [];

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
              <DialogTitle className="text-xl pr-8">{movie.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
              {/* Poster */}
              {poster ? (
                <img src={poster} alt={movie.title} className="w-full sm:w-32 max-h-48 sm:max-h-none sm:h-48 object-cover rounded-lg flex-shrink-0 shadow-md" />
              ) : (
                <div className="w-full sm:w-32 h-40 sm:h-48 bg-muted rounded-lg flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {year && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{year}</span>}
                  {movie.runtime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{movie.runtime} min</span>}
                  {movie.certification && <Badge variant="outline" className="text-xs">{movie.certification}</Badge>}
                  {movie.vote_average > 0 && (
                    <span className="flex items-center gap-1 font-medium text-foreground">{movie.vote_average.toFixed(1)}/10</span>
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

                {movie.overview && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
                )}

                {movie.director && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{t('marathon.movie.director')}:</span> {movie.director}</p>
                )}

                {movie.cast.length > 0 && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{t('marathon.movie.cast')}:</span> {movie.cast.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {user && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!userMovie ? (
                  <>
                    <Button onClick={() => handleAdd('watched')} disabled={acting} className="gap-2 flex-1 sm:flex-none">
                      <Eye className="h-4 w-4" /> {t('marathon.movie.markWatched')}
                    </Button>
                    <Button variant="outline" onClick={() => handleAdd('want_to_watch')} disabled={acting} className="gap-2 flex-1 sm:flex-none">
                      <Bookmark className="h-4 w-4" /> {t('marathon.movie.addWatchlist')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge className={`px-3 py-1.5 text-sm ${userMovie.status === 'watched' ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'}`}>
                      {userMovie.status === 'watched' ? t('marathon.movie.watched') : t('marathon.movie.watchlist')}
                    </Badge>
                    {userMovie.status === 'want_to_watch' && (
                      <Button size="sm" onClick={() => handleChangeStatus('watched')} disabled={acting} className="gap-2">
                        <Eye className="h-3.5 w-3.5" /> {t('marathon.movie.markWatched')}
                      </Button>
                    )}
                    {userMovie.status === 'watched' && (
                      <Button size="sm" variant="outline" onClick={() => handleChangeStatus('want_to_watch')} disabled={acting} className="gap-2">
                        <Bookmark className="h-3.5 w-3.5" /> {t('marathon.movie.moveWatchlist')}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-2 ml-auto" onClick={handleRemove} disabled={acting}>
                      <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
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
