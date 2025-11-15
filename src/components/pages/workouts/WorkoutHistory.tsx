import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { getWorkoutLogsByUserId } from '@/services/workoutService';
import type { WorkoutLog } from '@/types/workout';
import { format } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function WorkoutHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const loadWorkouts = async () => {
      setLoading(true);
      setError('');
      try {
        const logs = await getWorkoutLogsByUserId(user.uid);
        setWorkouts(logs);
      } catch (err: any) {
        setError(err.message || t('workouts.history.error'));
        console.error('Failed to load workouts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkouts();
  }, [user, t]);

  const toggleWorkout = (workoutId: string) => {
    setExpandedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) {
        next.delete(workoutId);
      } else {
        next.add(workoutId);
      }
      return next;
    });
  };

  const groupWorkoutsByDate = (workouts: WorkoutLog[]) => {
    const grouped: Record<string, WorkoutLog[]> = {};
    workouts.forEach((workout) => {
      const dateKey = format(workout.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(workout);
    });
    return grouped;
  };

  const groupedWorkouts = groupWorkoutsByDate(workouts);
  const sortedDates = Object.keys(groupedWorkouts).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Dumbbell className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            {t('workouts.history.noWorkouts')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('workouts.history.title')}</h2>
          <p className="text-muted-foreground mt-1">
            {t('workouts.history.description')} ({workouts.length})
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dateWorkouts = groupedWorkouts[dateKey];
          const date = new Date(dateKey);
          const isToday =
            format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isYesterday =
            format(date, 'yyyy-MM-dd') ===
            format(
              new Date(Date.now() - 24 * 60 * 60 * 1000),
              'yyyy-MM-dd'
            );

          let dateLabel = format(date, 'MMMM d, yyyy');
          if (isToday) {
            dateLabel = t('workouts.history.today');
          } else if (isYesterday) {
            dateLabel = t('workouts.history.yesterday');
          }

          return (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-lg font-semibold text-muted-foreground">
                {dateLabel}
              </h3>
              <div className="space-y-3">
                {dateWorkouts.map((workout) => {
                  const isExpanded = expandedWorkouts.has(workout.id);
                  const totalExercises = workout.exercises.length;
                  const totalSets = workout.exercises.reduce(
                    (sum, ex) => sum + ex.sets.length,
                    0
                  );

                  return (
                    <Collapsible
                      key={workout.id}
                      open={isExpanded}
                      onOpenChange={() => toggleWorkout(workout.id)}
                    >
                      <Card>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  {workout.routineName || t('workouts.history.freeWorkout')}
                                  {workout.routineName && (
                                    <Badge variant="secondary" className="text-xs">
                                      {t('workouts.history.routine')}
                                    </Badge>
                                  )}
                                </CardTitle>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Dumbbell className="h-4 w-4" />
                                    <span>
                                      {totalExercises}{' '}
                                      {totalExercises === 1
                                        ? t('workouts.history.exercise')
                                        : t('workouts.history.exercises')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>
                                      {totalSets}{' '}
                                      {totalSets === 1
                                        ? t('workouts.history.set')
                                        : t('workouts.history.sets')}
                                    </span>
                                  </div>
                                  {workout.duration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>{workout.duration} min</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(workout.date, 'HH:mm')}</span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWorkout(workout.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0">
                            {workout.notes && (
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-1">
                                  {t('workouts.history.notes')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {workout.notes}
                                </p>
                              </div>
                            )}

                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">
                                {t('workouts.history.exercises')}
                              </h4>
                              {workout.exercises.map((exercise, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-md space-y-2"
                                >
                                  <div className="font-medium">
                                    {exercise.exerciseName}
                                  </div>
                                  {exercise.notes && (
                                    <p className="text-sm text-muted-foreground">
                                      {exercise.notes}
                                    </p>
                                  )}
                                  <div className="space-y-1">
                                    {exercise.sets.map((set, setIndex) => (
                                      <div
                                        key={setIndex}
                                        className="flex items-center gap-3 text-sm"
                                      >
                                        <span className="text-muted-foreground w-8">
                                          {set.setNumber}
                                        </span>
                                        <span className="flex-1">
                                          {set.reps && (
                                            <span>
                                              {set.reps}{' '}
                                              {t('workouts.history.reps')}
                                            </span>
                                          )}
                                          {set.reps && set.weight && ' × '}
                                          {set.weight && (
                                            <span>
                                              {set.weight} kg
                                            </span>
                                          )}
                                        </span>
                                        {set.completed && (
                                          <Badge
                                            variant="outline"
                                            className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                          >
                                            {t('workouts.history.completed')}
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

