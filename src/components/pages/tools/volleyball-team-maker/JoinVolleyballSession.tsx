import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Volleyball, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { getSessionByCode } from '@/services/volleyballService';

/**
 * Join a shared volleyball session by code. The :code URL param auto-redirects;
 * with no code, shows a manual entry form.
 */
export default function JoinVolleyballSession() {
  const { code: paramCode } = useParams<{ code?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { error } = useToast();

  const [manualCode, setManualCode] = useState('');
  const [resolving, setResolving] = useState(false);

  const resolveCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        error(t('volleyballTeamMaker.join.errors.empty'));
        return;
      }
      setResolving(true);
      try {
        const session = await getSessionByCode(code);
        if (!session) {
          error(t('volleyballTeamMaker.join.errors.notFound'));
          setResolving(false);
          return;
        }
        navigate(`/tools/volleyball-team-maker/sessions/${session.id}`, {
          replace: true,
        });
      } catch (e) {
        console.error(e);
        error(t('volleyballTeamMaker.join.errors.loadFailed'));
        setResolving(false);
      }
    },
    [error, navigate, t]
  );

  // Auto-resolve when the URL contains a code.
  useEffect(() => {
    if (paramCode) {
      void resolveCode(paramCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramCode]);

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('volleyballTeamMaker.join.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 not-first:mt-6">
          {t('volleyballTeamMaker.join.description')}
        </p>
      </div>

      <Card className="p-6">
        {resolving ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground text-sm">
              {t('volleyballTeamMaker.join.resolving')}
            </p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void resolveCode(manualCode);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="vtm-join-code">
                {t('volleyballTeamMaker.join.codeLabel')}
              </Label>
              <Input
                id="vtm-join-code"
                className="h-10 text-center font-mono text-lg tracking-[0.4em] uppercase"
                value={manualCode}
                onChange={(e) =>
                  setManualCode(e.target.value.toUpperCase().slice(0, 8))
                }
                placeholder="ABC123"
                autoFocus
                inputMode="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <Button type="submit" className="h-10 w-full gap-2">
              <ArrowRight className="h-4 w-4" />
              {t('volleyballTeamMaker.join.submit')}
            </Button>
          </form>
        )}
      </Card>

      <p className="text-muted-foreground text-center text-sm">
        <Volleyball className="mr-1 inline h-4 w-4" />
        <Link
          to="/tools/volleyball-team-maker"
          className="underline-offset-2 hover:underline"
        >
          {t('volleyballTeamMaker.join.goToMySessions')}
        </Link>
      </p>
    </div>
  );
}
