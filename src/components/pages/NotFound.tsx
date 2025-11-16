import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 sm:px-6">
      <div className="text-center max-w-md">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance mb-2">
          {t('error.notFound.title')}
        </h1>
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0 mb-4">
          {t('error.notFound.heading')}
        </h2>
        <p className="text-muted-foreground text-sm leading-7 mb-6">
          {t('error.notFound.message')}
        </p>
        <Button asChild className="min-h-[44px]">
          <Link to="/">{t('error.notFound.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
