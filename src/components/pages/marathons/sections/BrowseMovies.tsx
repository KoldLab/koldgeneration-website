import { useState, useCallback } from 'react';
import { Search, Loader2, Film } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchMovies } from '@/services/omdbService';
import MovieDetailDialog from '../components/MovieDetailDialog';
import type { OMDBSearchMovie } from '@/types/marathon';

function MovieGrid({ movies, onSelect }: { movies: OMDBSearchMovie[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {movies.map((movie) => {
        const poster = movie.Poster !== 'N/A' ? movie.Poster : null;
        return (
          <button
            key={movie.imdbID}
            onClick={() => onSelect(movie.imdbID)}
            className="group flex flex-col rounded-lg overflow-hidden border bg-card hover:bg-accent/30 transition-colors text-left"
          >
            {poster ? (
              <img src={poster} alt={movie.Title} className="w-full aspect-[2/3] object-cover group-hover:opacity-90 transition-opacity" />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                <Film className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium line-clamp-2 leading-snug">{movie.Title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{movie.Year}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function BrowseMovies() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OMDBSearchMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchMovies(query.trim());
      setResults(data.Search ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No results found.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <MovieGrid movies={results} onSelect={setSelectedId} />
      )}

      {!searched && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Film className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Search for a movie to get started.</p>
        </div>
      )}

      <MovieDetailDialog imdbId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
