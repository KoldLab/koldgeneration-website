import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Pin,
  PinOff,
  Link,
  Link2Off,
  Trash2,
  Check,
  Plus,
  X,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import {
  createNote,
  subscribeToNote,
  updateNote,
  deleteNote,
  enableSharing,
  disableSharing,
  generateInviteToken,
  revokeInviteToken,
  removeCollaborator,
} from '@/services/notesService';
import type { Note, NoteColor, ChecklistItem, ItemActor } from '@/types/notes';

// ─── Color maps ────────────────────────────────────────────────────────────

const NOTE_COLORS: NoteColor[] = [
  'default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple',
];

const colorDotClasses: Record<NoteColor, string> = {
  default: 'bg-background border-2 border-border',
  red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400',
  green: 'bg-green-400', teal: 'bg-teal-400', blue: 'bg-blue-400',
  purple: 'bg-purple-400',
};

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

// ─── Collaborator dialog ───────────────────────────────────────────────────

function CollaboratorsDialog({
  note,
  currentUid,
  currentDisplayName,
}: {
  note: Note;
  currentUid: string;
  currentDisplayName: string | null;
}) {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [inviteUrl, setInviteUrl] = useState(
    note.inviteToken
      ? `${window.location.origin}/join/notes/${note.inviteToken}`
      : ''
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const isOwner = note.userId === currentUid;

  useEffect(() => {
    setInviteUrl(
      note.inviteToken
        ? `${window.location.origin}/join/notes/${note.inviteToken}`
        : ''
    );
  }, [note.inviteToken]);

  const getName = (uid: string) => {
    if (uid === currentUid) return t('notes.collaborators.you');
    return (
      note.collaboratorProfiles[uid]?.displayName ??
      t('notes.collaborators.unknown')
    );
  };

  const getInitial = (uid: string) => {
    if (uid === currentUid) return (currentDisplayName?.[0] ?? '?').toUpperCase();
    const name = note.collaboratorProfiles[uid]?.displayName;
    return name ? name[0].toUpperCase() : '?';
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const token = await generateInviteToken(note.id);
      setInviteUrl(`${window.location.origin}/join/notes/${token}`);
    } catch {
      showError(t('notes.collaborators.generateError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    success(t('notes.collaborators.inviteCopied'));
  };

  const handleRevoke = async () => {
    try {
      await revokeInviteToken(note.id);
      setInviteUrl('');
      success(t('notes.collaborators.revoked'));
    } catch {
      showError(t('notes.editor.saveError'));
    }
  };

  const handleRemove = async (uid: string) => {
    try {
      await removeCollaborator(note.id, uid);
    } catch {
      showError(t('notes.editor.saveError'));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('notes.collaborators.title')}</DialogTitle>
        <DialogDescription>{t('notes.collaborators.description')}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Owner row */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('notes.collaborators.owner')}
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
              {getInitial(note.userId)}
            </div>
            <span className="text-sm">
              {note.userId === currentUid
                ? t('notes.collaborators.youOwner')
                : (note.collaboratorProfiles[note.userId]?.displayName ??
                  t('notes.collaborators.unknown'))}
            </span>
          </div>
        </div>

        {/* Collaborators */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('notes.collaborators.members')}
          </p>
          {note.collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('notes.collaborators.noCollaboratorsYet')}
            </p>
          ) : (
            <div className="space-y-2">
              {note.collaborators.map((uid) => (
                <div key={uid} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold shrink-0">
                    {getInitial(uid)}
                  </div>
                  <span className="text-sm flex-1">{getName(uid)}</span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(uid)}
                      className="h-7 text-xs text-destructive hover:text-destructive px-2"
                    >
                      {t('notes.collaborators.remove')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite link — owner only */}
        {isOwner && (
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {t('notes.collaborators.inviteLink')}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {t('notes.collaborators.inviteLinkDescription')}
            </p>
            {inviteUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly className="flex-1 text-xs h-8" />
                  <Button size="sm" onClick={handleCopy} className="shrink-0">
                    {t('notes.collaborators.copyInviteLink')}
                  </Button>
                </div>
                <button
                  onClick={handleRevoke}
                  className="text-xs text-destructive hover:underline"
                >
                  {t('notes.collaborators.revokeLink')}
                </button>
              </div>
            ) : (
              <Button onClick={handleGenerate} disabled={isGenerating} size="sm">
                {t('notes.collaborators.generateLink')}
              </Button>
            )}
          </div>
        )}

        {!isOwner && (
          <p className="text-xs text-muted-foreground border-t pt-4">
            {t('notes.collaborators.onlyOwnerCanManage')}
          </p>
        )}
      </div>
    </DialogContent>
  );
}

// ─── Main editor ───────────────────────────────────────────────────────────

interface HeaderActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

function HeaderActionButton({
  label,
  icon,
  onClick,
  disabled = false,
  destructive = false,
}: HeaderActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          onMouseEnter={() => !disabled && setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          onFocus={() => !disabled && setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          aria-label={label}
          title={label}
          disabled={disabled}
          className={destructive ? 'text-destructive hover:text-destructive' : undefined}
        >
          {icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={8}
        className="w-auto rounded-full px-3 py-1.5 text-xs font-medium"
      >
        {label}
      </PopoverContent>
    </Popover>
  );
}

interface NoteEditorProps {
  noteId?: string;
  onClose?: () => void;
  onDeleted?: (deletedNoteId: string) => void;
}

export default function NoteEditor({
  noteId: propNoteId,
  onClose,
  onDeleted,
}: NoteEditorProps = {}) {
  const { noteId: paramNoteId } = useParams<{ noteId: string }>();
  const noteId = propNoteId ?? paramNoteId;
  const [searchParams] = useSearchParams();
  const isDraftRoute = noteId === 'new';
  const draftType = (searchParams.get('type') ?? 'note') as 'note' | 'list';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCollabDialog, setShowCollabDialog] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isTogglingShare, setIsTogglingShare] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNoteRef = useRef<Note | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const saveTextNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const current = latestNoteRef.current;
    if (!current) return;

    const hasContent = current.title.trim() || (current.type === 'note' && current.content.trim());
    if (!hasContent) return;

    setIsSaving(true);
    try {
      if (current.id === 'draft') {
        if (!user) return;
        const created = await createNote(user.uid, {
          title: current.title,
          type: current.type,
          content: current.content,
          color: current.color,
        });
        const realNote = { ...current, id: created.id };
        latestNoteRef.current = realNote;
        setNote(realNote);
        navigate(`/notes/${created.id}`, { replace: true });
      } else {
        await updateNote(current.id, {
          title: current.title,
          content: current.content,
          color: current.color,
        });
      }

      isDirtyTextRef.current = false;
      setHasSaved(true);
    } catch {
      showError(t('notes.editor.saveError'));
    } finally {
      setIsSaving(false);
    }
  }, [navigate, showError, t, user]);

  const goBack = useCallback(async () => {
    if (isDirtyTextRef.current) {
      await saveTextNow();
    }

    if (onClose) {
      onClose();
      return;
    }

    navigate('/notes');
  }, [navigate, onClose, saveTextNow]);
  // True while title/content has unsaved changes — used to avoid remote snapshot clobbering local text
  const isDirtyTextRef = useRef(false);

  // Draft init — populate local state without touching Firestore
  useEffect(() => {
    if (!isDraftRoute) return;
    const empty: Note = {
      id: 'draft',
      userId: user?.uid ?? '',
      title: '',
      type: draftType,
      content: '',
      items: [],
      color: 'default',
      isPinned: false,
      isPublic: false,
      shareToken: null,
      inviteToken: null,
      collaborators: [],
      collaboratorProfiles: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNote(empty);
    latestNoteRef.current = empty;
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraftRoute, draftType, user?.uid]);

  // Real-time subscription
  useEffect(() => {
    if (!noteId || isDraftRoute) return;
    const unsub = subscribeToNote(noteId, (remoteNote) => {
      if (!remoteNote) {
        setIsLoading(false);
        return;
      }
      setNote((prev) => {
        if (!prev) {
          latestNoteRef.current = remoteNote;
          return remoteNote;
        }
        // Keep local title/content while typing; accept everything else from remote
        const merged: Note = {
          ...remoteNote,
          title: isDirtyTextRef.current ? prev.title : remoteNote.title,
          content: isDirtyTextRef.current ? prev.content : remoteNote.content,
        };
        latestNoteRef.current = merged;
        return merged;
      });
      setIsLoading(false);
    });
    return unsub;
  }, [noteId]);

  // Debounced save for title / content / color
  const scheduleTextSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    isDirtyTextRef.current = true;
    saveTimerRef.current = setTimeout(async () => {
      await saveTextNow();
    }, 1500);
  }, [saveTextNow]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Immediate save for items (collaboration-critical)
  const saveItemsNow = useCallback(
    async (items: ChecklistItem[]) => {
      const current = latestNoteRef.current;
      if (!current) return;
      if (current.id === 'draft') {
        if (!user) return;
        try {
          const created = await createNote(user.uid, {
            title: current.title,
            type: 'list',
            items,
          });
          const realNote = { ...current, id: created.id, items };
          latestNoteRef.current = realNote;
          setNote(realNote);
          navigate(`/notes/${created.id}`, { replace: true });
        } catch {
          showError(t('notes.editor.saveError'));
        }
        return;
      }
      try {
        await updateNote(current.id, { items });
      } catch {
        showError(t('notes.editor.saveError'));
      }
    },
    [showError, t, user, navigate]
  );

  const updateTextField = useCallback(
    <K extends 'title' | 'content' | 'color'>(field: K, value: Note[K]) => {
      setNote((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, [field]: value };
        latestNoteRef.current = updated;
        return updated;
      });
      scheduleTextSave();
    },
    [scheduleTextSave]
  );

  const actor = user
    ? ({ uid: user.uid, displayName: user.displayName, photoURL: user.photoURL } satisfies ItemActor)
    : undefined;

  const addChecklistItem = () => {
    if (!note || !newItemText.trim() || !actor) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      checked: false,
      addedBy: actor,
    };
    const updated = [...note.items, newItem];
    setNote((prev) => prev ? { ...prev, items: updated } : prev);
    latestNoteRef.current = note ? { ...note, items: updated } : note;
    setNewItemText('');
    newItemInputRef.current?.focus();
    saveItemsNow(updated);
  };

  const toggleItem = (id: string) => {
    if (!note) return;
    const updated = note.items.map((item) => {
      if (item.id !== id) return item;
      const checked = !item.checked;
      return {
        ...item,
        checked,
        checkedBy: checked ? actor ?? null : null,
        checkedAt: checked ? new Date().toISOString() : null,
      };
    });
    setNote((prev) => prev ? { ...prev, items: updated } : prev);
    latestNoteRef.current = note ? { ...note, items: updated } : note;
    saveItemsNow(updated);
  };

  const updateItemText = (id: string, text: string) => {
    if (!note) return;
    const updated = note.items.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    setNote((prev) => prev ? { ...prev, items: updated } : prev);
    latestNoteRef.current = note ? { ...note, items: updated } : note;
    saveItemsNow(updated);
  };

  const removeItem = (id: string) => {
    if (!note) return;
    const updated = note.items.filter((item) => item.id !== id);
    setNote((prev) => prev ? { ...prev, items: updated } : prev);
    latestNoteRef.current = note ? { ...note, items: updated } : note;
    saveItemsNow(updated);
  };

  const isDraft = note?.id === 'draft';

  const handleDeleteConfirm = async () => {
    if (!note || isDraft) return;
    try {
      await deleteNote(note.id);
      onDeleted?.(note.id);
      success(t('notes.editor.deleted'));
      await goBack();
    } catch {
      showError(t('notes.editor.deleteError'));
    }
  };

  const handleTogglePin = async () => {
    if (!note || isDraft) return;
    const newPinned = !note.isPinned;
    const updated = { ...note, isPinned: newPinned };
    setNote(updated);
    latestNoteRef.current = updated;
    try {
      await updateNote(note.id, { isPinned: newPinned });
    } catch {
      setNote(note);
      latestNoteRef.current = note;
      showError(t('notes.editor.saveError'));
    }
  };

  const handleToggleShare = async () => {
    if (!note || isDraft) return;
    setIsTogglingShare(true);
    try {
      if (note.isPublic) {
        await disableSharing(note.id);
        success(t('notes.share.disabled'));
        setShowShareDialog(false);
      } else {
        const token = await enableSharing(note.id, note.shareToken);
        const updated = { ...note, isPublic: true, shareToken: token };
        setNote(updated);
        latestNoteRef.current = updated;
        success(t('notes.share.enabled'));
        setShowShareDialog(true);
      }
    } catch {
      showError(
        note.isPublic ? t('notes.share.disableError') : t('notes.share.enableError')
      );
    } finally {
      setIsTogglingShare(false);
    }
  };

  const shareUrl = note?.shareToken
    ? `${window.location.origin}/share/notes/${note.shareToken}`
    : '';

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    success(t('notes.share.copied'));
  };

  const getActorName = (a: ItemActor | null | undefined) => {
    if (!a) return '';
    if (a.uid === user?.uid) return t('notes.collaborators.you');
    return a.displayName ?? t('notes.collaborators.unknown');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t('notes.loading')}</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <p className="font-semibold">{t('notes.notFound')}</p>
        <Button variant="outline" onClick={goBack}>
          {t('notes.editor.back')}
        </Button>
      </div>
    );
  }

  const collaboratorCount = note.collaborators.length;
  const saveStatus = isSaving
    ? t('notes.editor.saving')
    : hasSaved && !isDirtyTextRef.current
      ? t('notes.editor.saved')
      : '';
  const isOwner = note.userId === user?.uid;

  return (
    <div className={`min-h-[calc(100vh-4rem)] transition-colors ${colorBgClasses[note.color]}`}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            aria-label={t('notes.editor.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <span className="text-xs text-muted-foreground px-1">{saveStatus}</span>

          {isOwner && !isDraft && (
            <HeaderActionButton
              label={note.isPinned ? t('notes.editor.unpin') : t('notes.editor.pin')}
              onClick={handleTogglePin}
              icon={note.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            />
          )}

          {isOwner && !isDraft && (
            <HeaderActionButton
              label={note.isPublic ? t('notes.editor.unshare') : t('notes.editor.share')}
              onClick={handleToggleShare}
              disabled={isTogglingShare}
              icon={note.isPublic ? <Link2Off className="h-4 w-4" /> : <Link className="h-4 w-4" />}
            />
          )}

          {note.isPublic && isOwner && !isDraft && (
            <HeaderActionButton
              label={t('notes.editor.viewShareLink')}
              onClick={() => setShowShareDialog(true)}
              icon={<Link className="h-4 w-4" />}
            />
          )}

          {!isDraft && (
            <HeaderActionButton
              label={t('notes.editor.manageCollaborators')}
              onClick={() => setShowCollabDialog(true)}
              icon={
                collaboratorCount > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <Users className="h-4 w-4" />
                    <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                      {collaboratorCount + 1}
                    </span>
                  </div>
                ) : (
                  <Users className="h-4 w-4" />
                )
              }
            />
          )}

          {isOwner && !isDraft && (
            <HeaderActionButton
              label={note.type === 'list'
                ? t('notes.editor.deleteList')
                : t('notes.editor.deleteNote')}
              onClick={() => setShowDeleteDialog(true)}
              destructive
              icon={<Trash2 className="h-4 w-4" />}
            />
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          value={note.title}
          onChange={(e) => updateTextField('title', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              newItemInputRef.current?.focus();
            }
          }}
          placeholder={t('notes.editor.titlePlaceholder')}
          className="w-full bg-transparent text-xl font-semibold placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Content */}
        {note.type === 'note' ? (
          <textarea
            value={note.content}
            onChange={(e) => updateTextField('content', e.target.value)}
            placeholder={t('notes.editor.contentPlaceholder')}
            className="w-full bg-transparent resize-none min-h-[60vh] text-sm placeholder:text-muted-foreground focus:outline-none leading-relaxed"
          />
        ) : (
          <div className="space-y-1">
            {note.items.map((item) => (
              <div key={item.id} className="group">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.checked
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {item.checked && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        newItemInputRef.current?.focus();
                      }
                    }}
                    className={`flex-1 bg-transparent text-sm focus:outline-none ${
                      item.checked ? 'line-through text-muted-foreground' : ''
                    }`}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                    aria-label="Remove item"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Attribution */}
                {(item.addedBy || item.checkedBy) && (
                  <p className="text-xs text-muted-foreground ml-7 mt-0.5">
                    {item.addedBy && (
                      <span>{t('notes.editor.addedBy', { name: getActorName(item.addedBy) })}</span>
                    )}
                    {item.addedBy && item.checkedBy && <span> · </span>}
                    {item.checkedBy && (
                      <span>{t('notes.editor.checkedBy', { name: getActorName(item.checkedBy) })}</span>
                    )}
                  </p>
                )}
              </div>
            ))}

            {/* New item row */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  if (newItemText.trim()) addChecklistItem();
                  else newItemInputRef.current?.focus();
                }}
                className="w-5 h-5 rounded border border-dashed border-muted-foreground flex items-center justify-center flex-shrink-0 hover:border-primary hover:text-primary transition-colors"
                aria-label={t('notes.editor.addItem')}
              >
                <Plus className="h-3 w-3" />
              </button>
              <input
                ref={newItemInputRef}
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                onBlur={() => {
                  if (newItemText.trim()) addChecklistItem();
                }}
                placeholder={t('notes.editor.addItem')}
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Color picker */}
        <div className="flex items-center gap-2 pt-4 border-t">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => updateTextField('color', color)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${colorDotClasses[color]} ${
                note.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
              }`}
              aria-label={t(`notes.editor.colors.${color}`)}
              title={t(`notes.editor.colors.${color}`)}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notes.editor.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('notes.editor.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share (read-only) dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('notes.share.title')}</DialogTitle>
            <DialogDescription>{t('notes.share.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="flex-1 text-sm" />
            <Button onClick={copyShareUrl}>{t('notes.share.copyLink')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collaborators dialog */}
      <Dialog open={showCollabDialog} onOpenChange={setShowCollabDialog}>
        <CollaboratorsDialog
          note={note}
          currentUid={user?.uid ?? ''}
          currentDisplayName={user?.displayName ?? null}
        />
      </Dialog>
    </div>
  );
}
