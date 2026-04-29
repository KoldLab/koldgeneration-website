import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getNoteByShareToken } from '@/services/notesService';
import type { Note, NoteColor, ItemActor } from '@/types/notes';

const colorBgClasses: Record<NoteColor, string> = {
  default: '',
  red: 'bg-red-50 dark:bg-red-950/20',
  orange: 'bg-orange-50 dark:bg-orange-950/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/20',
  green: 'bg-green-50 dark:bg-green-950/20',
  teal: 'bg-teal-50 dark:bg-teal-950/20',
  blue: 'bg-blue-50 dark:bg-blue-950/20',
  purple: 'bg-purple-50 dark:bg-purple-950/20',
};

function actorName(actor: ItemActor | null | undefined): string | null {
  if (!actor) return null;
  return actor.displayName ?? actor.uid.slice(0, 8);
}

export default function SharedNotePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shareToken) return;
    getNoteByShareToken(shareToken).then((n) => {
      setNote(n);
      setIsLoading(false);
    });
  }, [shareToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t('notes.loading')}</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-4">
        <p className="font-semibold">{t('notes.notFound')}</p>
        <p className="text-muted-foreground text-sm">{t('notes.notFoundDescription')}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          {t('common.goHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-4rem)] transition-colors ${colorBgClasses[note.color]}`}>
      {/* View-only banner */}
      <div className="border-b bg-muted/50">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            {t('notes.share.viewOnly')} — {t('notes.share.viewOnlyDescription')}
          </span>
          {!user && (
            <Button
              size="sm"
              variant="outline"
              onClick={signInWithGoogle}
              className="gap-1.5 h-7 text-xs shrink-0"
            >
              <LogIn className="h-3 w-3" />
              {t('notes.share.signIn')}
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {note.title && <h1 className="text-xl font-semibold">{note.title}</h1>}

        {note.type === 'note' ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
        ) : (
          <div className="space-y-1">
            {note.items.map((item) => {
              const added = actorName(item.addedBy);
              const checked = actorName(item.checkedBy);
              return (
                <div key={item.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        item.checked ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {item.checked && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                  {(added || checked) && (
                    <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                      {added && (
                        <span>{t('notes.editor.addedBy', { name: added })}</span>
                      )}
                      {added && checked && <span> · </span>}
                      {checked && (
                        <span>{t('notes.editor.checkedBy', { name: checked })}</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
