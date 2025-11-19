import { Plus, History, List, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
}: MobileBottomNavProps) {
  const { t } = useTranslation();

  const navItems = [
    {
      id: 'log',
      label: t('workouts.tabs.log'),
      icon: Plus,
    },
    {
      id: 'history',
      label: t('workouts.tabs.history'),
      icon: History,
    },
    {
      id: 'routines',
      label: t('workouts.tabs.routines'),
      icon: List,
    },
    {
      id: 'exercises',
      label: t('workouts.tabs.exercises'),
      icon: BookOpen,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16 w-full max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-all relative',
                'active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label={item.label}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 transition-all',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
