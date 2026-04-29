import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, ListChecks, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  getNotesByUserId,
  getCollaboratorNotes,
  createNote,
} from '@/services/notesService';
import NoteCard from './NoteCard';
import type { Note } from '@/types/notes';

export default function NotesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { error } = useToast();
  const [ownNotes, setOwnNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      getNotesByUserId(user.uid),
      getCollaboratorNotes(user.uid),
    ])
      .then(([own, shared]) => {
        if (!cancelled) {
          setOwnNotes(own);
          setSharedNotes(shared);
        }
      })
      .catch(() => {
        if (!cancelled) error(t('notes.loadError'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleCreate = async (type: 'note' | 'list') => {
    if (!user || isCreating) return;
    setIsCreating(true);
    try {
      const note = await createNote(user.uid, { title: '', type });
      navigate(`/notes/${note.id}`);
    } catch {
      error(t('notes.loadError'));
      setIsCreating(false);
    }
  };

  const pinned = ownNotes.filter((n) => n.isPinned);
  const unpinned = ownNotes.filter((n) => !n.isPinned);
  const hasAnyNotes = ownNotes.length > 0 || sharedNotes.length > 0;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            {t('notes.title')}
          </h1>
          <p className="text-muted-foreground text-xl leading-7 mt-2">
            {t('notes.description')}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          <Button
            variant="outline"
            onClick={() => handleCreate('list')}
            disabled={isCreating}
            className="gap-2"
          >
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">{t('notes.newList')}</span>
          </Button>
          <Button
            onClick={() => handleCreate('note')}
            disabled={isCreating}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t('notes.newNote')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="break-inside-avoid rounded-lg border bg-muted animate-pulse h-28" />
          ))}
        </div>
      ) : !hasAnyNotes ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">{t('notes.empty.title')}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t('notes.empty.description')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned */}
          {pinned.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('notes.pinned')}
              </p>
              <NoteGrid notes={pinned} />
            </section>
          )}

          {/* My notes */}
          {unpinned.length > 0 && (
            <section>
              {(pinned.length > 0 || sharedNotes.length > 0) && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t('notes.allNotes')}
                </p>
              )}
              <NoteGrid notes={unpinned} />
            </section>
          )}

          {/* Shared with me */}
          {sharedNotes.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {t('notes.sharedWithMe')}
              </p>
              <NoteGrid notes={sharedNotes} isCollaborator />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NoteGrid({
  notes,
  isCollaborator = false,
}: {
  notes: Note[];
  isCollaborator?: boolean;
}) {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="break-inside-avoid mb-3">
          <NoteCard note={note} isCollaborator={isCollaborator} />
        </div>
      ))}
    </div>
  );
}
