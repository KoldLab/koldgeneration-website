import { useState } from 'react';
import { Copy, Check, Loader2, Wand2, Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getMovieByTitle, omdbDetailMovieToMarathonMovie } from '@/services/omdbService';
import type { MarathonMovie } from '@/types/marathon';
import { toast } from 'sonner';

const AI_PROMPT = `You are a movie marathon assistant. When given a request, respond ONLY with a valid JSON object in this exact format, with no extra text or markdown:

{
  "title": "Marathon Title",
  "description": "Short description of this marathon",
  "movies": [
    { "title": "Exact Movie Title", "year": 2008 },
    { "title": "Exact Movie Title", "year": 2010 }
  ]
}

Rules:
- Always search the web for the most current and complete list before responding
- Use the exact official English movie title
- Include the release year as a 4-digit number
- Order the movies as requested (chronological, release date, etc.)
- Only include movies, no TV shows or mini-series
- Respond with ONLY the JSON object, nothing else`;

type ImportEntry = { title: string; year?: number };
type ImportPayload = { title: string; description: string; movies: ImportEntry[] };

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (title: string, description: string, movies: MarathonMovie[]) => void;
  existingCount: number;
};

function tryFormatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw.trim()), null, 2);
  } catch {
    return raw;
  }
}

export default function ImportFromAIDialog({ open, onClose, onImport, existingCount }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [json, setJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    setJson(tryFormatJson(pasted));
  };

  const handleFormat = () => {
    setJson((prev) => tryFormatJson(prev));
  };

  const handleImport = async () => {
    let payload: ImportPayload;
    try {
      payload = JSON.parse(json.trim());
    } catch {
      toast.error(t('marathon.import.invalidJson'));
      return;
    }

    if (!Array.isArray(payload.movies) || payload.movies.length === 0) {
      toast.error(t('marathon.import.invalidJson'));
      return;
    }

    setLoading(true);
    setProgress({ done: 0, total: payload.movies.length });

    const results: MarathonMovie[] = [];
    const failed: string[] = [];

    for (let i = 0; i < payload.movies.length; i++) {
      const entry = payload.movies[i];
      try {
        const detail = await getMovieByTitle(entry.title, entry.year);
        if (detail) {
          results.push(omdbDetailMovieToMarathonMovie(detail, existingCount + i));
        } else {
          failed.push(entry.title);
        }
      } catch {
        failed.push(entry.title);
      }
      setProgress({ done: i + 1, total: payload.movies.length });
    }

    setLoading(false);
    setProgress(null);

    if (results.length === 0) {
      toast.error(t('marathon.import.noMoviesFound'));
      return;
    }

    if (failed.length > 0) {
      toast.warning(t('marathon.import.partialSuccess', { count: failed.length, titles: failed.join(', ') }));
    }

    onImport(payload.title ?? '', payload.description ?? '', results);
    setJson('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {t('marathon.import.title')}
          </DialogTitle>
          <DialogDescription>{t('marathon.import.description')}</DialogDescription>
        </DialogHeader>

        {/* Step 1 — Copy prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t('marathon.import.step1')}</p>
            <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleCopyPrompt}>
              {copied
                ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
                : <><Copy className="h-3.5 w-3.5" /> Copy prompt</>
              }
            </Button>
          </div>
          <pre className="text-xs bg-muted text-muted-foreground rounded-lg p-4 overflow-y-auto max-h-44 whitespace-pre-wrap leading-relaxed">
            {AI_PROMPT}
          </pre>
          <p className="text-xs text-muted-foreground">{t('marathon.import.step1hint')}</p>
        </div>

        {/* Step 2 — Paste JSON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t('marathon.import.step2')}</p>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={handleFormat}
              disabled={!json.trim()}
            >
              <Braces className="h-3.5 w-3.5" />
              Format JSON
            </Button>
          </div>
          <Textarea
            placeholder={'{\n  "title": "...",\n  "movies": [\n    { "title": "...", "year": 2008 }\n  ]\n}'}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            onPaste={handlePaste}
            className="font-mono text-xs resize-none h-52 leading-relaxed"
            spellCheck={false}
          />
        </div>

        {progress && (
          <div className="space-y-1.5">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t('marathon.import.fetching', { done: progress.done, total: progress.total })}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleImport} disabled={loading || !json.trim()}>
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t('marathon.import.importing')}</>
              : t('marathon.import.import')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
