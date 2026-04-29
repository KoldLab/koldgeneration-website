import { Pin, Link, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Note, NoteColor } from '@/types/notes';

const colorClasses: Record<NoteColor, string> = {
  default: 'bg-card',
  red: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-900',
  orange: 'bg-orange-100 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
  yellow: 'bg-yellow-100 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900',
  green: 'bg-green-100 dark:bg-green-950/40 border-green-200 dark:border-green-900',
  teal: 'bg-teal-100 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
  blue: 'bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
  purple: 'bg-purple-100 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
};

interface NoteCardProps {
  note: Note;
  isCollaborator?: boolean;
}

export default function NoteCard({ note, isCollaborator = false }: NoteCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const previewItems = note.items.slice(0, 6);
  const extraCount = note.items.length - previewItems.length;
  const hasCollaborators = note.collaborators.length > 0;

  return (
    <div
      onClick={() => navigate(`/notes/${note.id}`)}
      className={`rounded-lg border p-4 cursor-pointer transition-shadow hover:shadow-md flex flex-col gap-2 min-h-[80px] max-h-[260px] overflow-hidden ${colorClasses[note.color]}`}
    >
      {note.title && (
        <h3 className="font-semibold text-sm leading-tight truncate">
          {note.title}
        </h3>
      )}

      {note.type === 'note' && note.content && (
        <p className="text-sm text-muted-foreground line-clamp-6 flex-1 whitespace-pre-wrap">
          {note.content}
        </p>
      )}

      {note.type === 'list' && note.items.length > 0 && (
        <div className="flex-1 space-y-1">
          {previewItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <div
                className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                  item.checked ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}
              >
                {item.checked && (
                  <svg
                    viewBox="0 0 10 10"
                    className="w-2.5 h-2.5 fill-none stroke-primary-foreground stroke-2"
                  >
                    <polyline points="1.5,5 3.5,7.5 8.5,2.5" />
                  </svg>
                )}
              </div>
              <span
                className={`truncate ${item.checked ? 'line-through text-muted-foreground' : ''}`}
              >
                {item.text}
              </span>
            </div>
          ))}
          {extraCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('notes.card.moreItems', { count: extraCount })}
            </p>
          )}
        </div>
      )}

      {(note.isPinned || note.isPublic || hasCollaborators || isCollaborator) && (
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          {note.isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground" aria-label={t('notes.card.pinned')} />
          )}
          {(hasCollaborators || isCollaborator) && (
            <Users className="h-3 w-3 text-muted-foreground" aria-label={t('notes.collaborators.title')} />
          )}
          {note.isPublic && (
            <Link className="h-3 w-3 text-muted-foreground" aria-label={t('notes.card.shared')} />
          )}
        </div>
      )}
    </div>
  );
}
