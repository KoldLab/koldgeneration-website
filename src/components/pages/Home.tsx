import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        {t('home.welcome')}
      </h1>
      <p className="text-sm sm:text-base">{t('home.description')}</p>
    </div>
  );
}
