import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';
import { getTournamentByCode } from '@/services/tournamentService';

export default function EnterTournament() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const state = location.state as { error?: string; code?: string };
      if (state.code) {
        setCode(state.code.toUpperCase());
      }
      if (state.error === 'notFound') {
        setError(t('tournament.enter.errors.notFound'));
      } else if (state.error === 'generic') {
        setError(t('tournament.enter.errors.generic'));
      }
      // Clear state after consuming
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();

    if (!normalized || normalized.length < 3) {
      setError(t('tournament.enter.errors.invalid'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      const tournament = await getTournamentByCode(normalized);
      if (!tournament) {
        setError(t('tournament.enter.errors.notFound'));
        return;
      }
      navigate(`/tournament/${normalized}`);
    } catch (err: any) {
      setError(err.message || t('tournament.enter.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('tournament.enter.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
          {t('tournament.enter.subtitle')}
        </p>
      </div>

      <Card className="border-border/60 bg-background/80 p-6 shadow-sm backdrop-blur">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                {t('tournament.enter.section.title')}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t('tournament.enter.section.helper')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tournament-code">
              {t('tournament.enter.label')}
            </Label>
            <Input
              id="tournament-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t('tournament.enter.placeholder')}
              autoComplete="off"
              className="uppercase"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3 w-3 animate-ping rounded-full bg-current" />
                  {t('common.loading')}
                </span>
              ) : (
                t('tournament.enter.cta')
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('tournament.enter.helper')}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
