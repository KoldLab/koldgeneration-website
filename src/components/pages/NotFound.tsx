import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 sm:px-6">
      <div className="text-center max-w-md">
        <h1 className="text-5xl sm:text-6xl font-bold mb-2">{t('error.notFound.title')}</h1>
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{t('error.notFound.heading')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          {t('error.notFound.message')}
        </p>
        <Button asChild className="min-h-[44px]">
          <Link to="/">{t('error.notFound.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}

