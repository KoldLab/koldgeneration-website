import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Timer,
  Crown,
  FileText,
  Users,
  Lock,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

type ToolCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  gradient: string;
  requireAuth?: boolean;
};

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const cards: ToolCard[] = [
    {
      title: t('home.cards.tools.timer.title'),
      description: t('home.cards.tools.timer.description'),
      icon: <Timer className="h-12 w-12 text-white drop-shadow-lg" />,
      to: '/tools/timer',
      gradient: 'from-emerald-500 via-teal-500 to-sky-500',
    },
    {
      title: t('home.cards.tools.minecraftListGenerator.title'),
      description: t('home.cards.tools.minecraftListGenerator.description'),
      icon: <FileText className="h-12 w-12 text-white drop-shadow-lg" />,
      to: '/minecraft-tools/list-generator',
      gradient: 'from-orange-500 via-amber-500 to-rose-500',
    },
    {
      title: t('home.cards.tournaments.create.title'),
      description: t('home.cards.tournaments.create.description'),
      icon: <Crown className="h-12 w-12 text-white drop-shadow-lg" />,
      to: '/tournaments/create',
      gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
      requireAuth: true,
    },
    {
      title: t('home.cards.tournaments.my.title'),
      description: t('home.cards.tournaments.my.description'),
      icon: <Users className="h-12 w-12 text-white drop-shadow-lg" />,
      to: '/tournaments/my',
      gradient: 'from-blue-500 via-cyan-500 to-sky-500',
      requireAuth: true,
    },
    {
      title: t('home.cards.tournaments.view.title'),
      description: t('home.cards.tournaments.view.description'),
      icon: <KeyRound className="h-12 w-12 text-white drop-shadow-lg" />,
      to: '/tournaments/enter',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {t('home.welcome')}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t('home.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const requiresAuth = card.requireAuth && !user;

          const cardMarkup = (
            <Card
              className={cn(
                'group relative h-full overflow-hidden rounded-3xl border border-border/40 bg-background/70 !p-0 !gap-0 backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-border hover:shadow-2xl',
                requiresAuth &&
                  'cursor-not-allowed opacity-60 hover:-translate-y-0 hover:shadow-none'
              )}
            >
              <div className="relative overflow-hidden rounded-[2.25rem] p-5 pb-0">
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-gradient-to-br',
                    card.gradient,
                    'aspect-[16/10]'
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/90">
                    {card.icon}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-4 text-sm text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="leading-relaxed">{card.description}</p>
                  </div>
                </div>

                {card.requireAuth && (
                  <span className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                    <Lock className="h-3.5 w-3.5" />
                    {t('home.cardBadge.authRequired')}
                  </span>
                )}
              </div>

              <CardContent className="px-6 pb-4 pt-5">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {card.title}
                </CardTitle>
              </CardContent>

              <div className="flex items-center justify-between px-6 pb-6 text-sm font-medium text-primary">
                <span>
                  {requiresAuth
                    ? t('home.cardButton.signInRequired')
                    : t('home.cardButton.explore')}
                </span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Card>
          );

          if (requiresAuth) {
            return (
              <div key={card.title} className="relative">
                {cardMarkup}
                <div
                  className="absolute inset-0 rounded-3xl"
                  aria-hidden="true"
                />
              </div>
            );
          }

          return (
            <Link
              key={card.title}
              to={card.to}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl"
            >
              {cardMarkup}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
