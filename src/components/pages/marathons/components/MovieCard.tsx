import { Film, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { MarathonMovie, MarathonMovieEntry } from '@/types/marathon';

type BaseProps = {
  movie: MarathonMovie | MarathonMovieEntry;
  index: number;
};

type EditableProps = BaseProps & {
  mode: 'edit';
  onRemove: (index: number) => void;
  dragHandle?: React.ReactNode;
};

type TrackProps = BaseProps & {
  mode: 'track';
  movie: MarathonMovieEntry;
  onToggleWatched: (index: number) => void;
  onNotesChange: (index: number, notes: string) => void;
};

type Props = EditableProps | TrackProps;

export default function MovieCard(props: Props) {
  const { movie, index } = props;

  if (props.mode === 'edit') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
        {props.dragHandle && <span className="text-muted-foreground cursor-grab">{props.dragHandle}</span>}
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-10 h-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{movie.title}</p>
          <p className="text-sm text-muted-foreground">
            {movie.releaseYear ?? '—'}
            {movie.runtime ? ` · ${movie.runtime} min` : ''}
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={() => props.onRemove(index)} className="flex-shrink-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const entry = props.movie as MarathonMovieEntry;

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${entry.watched ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => props.onToggleWatched(index)}
          className="flex-shrink-0 text-primary hover:opacity-80 transition-opacity"
          aria-label={entry.watched ? 'Mark unwatched' : 'Mark watched'}
        >
          {entry.watched ? (
            <CheckCircle2 className="h-6 w-6 text-primary" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
        ) : (
          <div className="w-10 h-14 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <Film className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${entry.watched ? 'line-through text-muted-foreground' : ''}`}>
            {movie.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {movie.releaseYear ?? '—'}
            {movie.runtime ? ` · ${movie.runtime} min` : ''}
          </p>
          {movie.genres.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">{movie.genres.join(', ')}</p>
          )}
        </div>
      </div>
      {entry.watched && (
        <Textarea
          placeholder="Add notes..."
          value={entry.notes ?? ''}
          onChange={(e) => props.onNotesChange(index, e.target.value)}
          rows={2}
          className="text-sm resize-none"
        />
      )}
    </div>
  );
}
