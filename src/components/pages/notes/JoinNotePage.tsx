import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { getNoteByInviteToken, joinNoteAsCollaborator } from '@/services/notesService';
import type { Note } from '@/types/notes';

export default function JoinNotePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { success, error: showError } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    getNoteByInviteToken(inviteToken).then((n) => {
      setNote(n);
      setIsLoading(false);
    });
  }, [inviteToken]);

  const isAlreadyMember =
    note && user
      ? note.userId === user.uid || note.collaborators.includes(user.uid)
      : false;

  const handleJoin = async () => {
    if (!note || !user) return;
    setIsJoining(true);
    try {
      await joinNoteAsCollaborator(note.id, {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      success(t('notes.join.joined'));
      navigate(`/notes/${note.id}`);
    } catch {
      showError(t('notes.join.joinError'));
      setIsJoining(false);
    }
  };

  const ownerName =
    note?.collaboratorProfiles[note.userId]?.displayName ?? null;

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
        <p className="font-semibold">{t('notes.join.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          {t('common.goHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="w-full max-w-sm border rounded-xl p-8 space-y-6 text-center shadow-sm">
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t('notes.join.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('notes.join.description')}</p>
        </div>

        <div className="border rounded-lg p-4 text-left space-y-1">
          <p className="font-medium truncate">
            {note.title || t('notes.editor.titlePlaceholder')}
          </p>
          {ownerName && (
            <p className="text-xs text-muted-foreground">
              {t('notes.join.noteBy', { name: ownerName })}
            </p>
          )}
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('notes.join.signInFirst')}</p>
            <Button onClick={signInWithGoogle} className="w-full">
              {t('notes.join.signIn')}
            </Button>
          </div>
        ) : isAlreadyMember ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('notes.join.alreadyMember')}</p>
            <Button onClick={() => navigate(`/notes/${note.id}`)} className="w-full">
              {t('notes.join.openNote')}
            </Button>
          </div>
        ) : (
          <Button onClick={handleJoin} disabled={isJoining} className="w-full">
            {isJoining ? t('notes.join.joining') : t('notes.join.join')}
          </Button>
        )}
      </div>
    </div>
  );
}
