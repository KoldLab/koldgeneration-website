import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function NoteModal({ open, onClose, children }: NoteModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 hidden md:block">
      <button
        type="button"
        aria-label="Close note"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-6">
        <div className="relative max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close note"
            className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
