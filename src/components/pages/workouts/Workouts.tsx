import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import ExerciseLibrary from './ExerciseLibrary';
import { Loader2 } from 'lucide-react';

export default function Workouts() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('log');

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('workouts.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('workouts.description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="log">
            {t('workouts.tabs.log')}
          </TabsTrigger>
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
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-muted-foreground text-center">
                {t('workouts.logWorkout.comingSoon')}
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <p className="text-muted-foreground text-center">
                {t('workouts.history.comingSoon')}
              </p>
            </div>
          </Card>
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

