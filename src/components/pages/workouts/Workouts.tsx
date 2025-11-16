import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import ExerciseLibrary from './ExerciseLibrary';
import LogWorkout from './LogWorkout';
import WorkoutHistory from './WorkoutHistory';

const WORKOUTS_TAB_STORAGE_KEY = 'workouts-active-tab';

export default function Workouts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(WORKOUTS_TAB_STORAGE_KEY);
      if (
        saved &&
        ['log', 'history', 'routines', 'exercises'].includes(saved)
      ) {
        return saved;
      }
    }
    return 'log';
  });

  // Save to localStorage whenever tab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WORKOUTS_TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  // Listen for tab change events from WorkoutHistory
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('workout-tab-change', handleTabChange);
    return () => {
      window.removeEventListener('workout-tab-change', handleTabChange);
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          {t('workouts.title')}
        </h1>
        <p className="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
          {t('workouts.description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="log">{t('workouts.tabs.log')}</TabsTrigger>
          <TabsTrigger value="history">
            {t('workouts.tabs.history')}
          </TabsTrigger>
          <TabsTrigger value="routines">
            {t('workouts.tabs.routines')}
          </TabsTrigger>
          <TabsTrigger value="exercises">
            {t('workouts.tabs.exercises')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-6">
          <LogWorkout />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <WorkoutHistory />
        </TabsContent>

        <TabsContent value="routines" className="mt-6">
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-muted-foreground text-center">
                {t('workouts.routines.comingSoon')}
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="mt-6">
          <ExerciseLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
